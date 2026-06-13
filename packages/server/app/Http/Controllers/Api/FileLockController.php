<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FileLock;
use App\Models\SharedProject;
use App\Services\CoordinatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;
use Throwable;

class FileLockController extends Controller
{
    /** List active file locks for a project. */
    #[OA\Get(
        path: '/api/projects/{projectId}/locks',
        summary: 'List active file locks',
        security: [['bearerAuth' => []]],
        tags: ['File Locks'],
        parameters: [
            new OA\Parameter(name: 'projectId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of active locks', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Project not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function index(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('view', $project);

        $locks = FileLock::getActiveLocks($projectId);

        return response()->json([
            'success' => true,
            'data' => $locks,
            'meta' => [
                'count' => count($locks),
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Acquire a file lock. */
    #[OA\Post(
        path: '/api/projects/{projectId}/locks',
        summary: 'Acquire a file lock',
        security: [['bearerAuth' => []]],
        tags: ['File Locks'],
        parameters: [
            new OA\Parameter(name: 'projectId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/CreateFileLockRequest')
        ),
        responses: [
            new OA\Response(response: 201, description: 'Lock acquired', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Project not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 409, description: 'File already locked', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function store(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('update', $project);

        $validated = $request->validate([
            'path' => 'required|string|max:1024',
            'instance_id' => 'required|string',
            'reason' => 'nullable|string|max:255',
            'duration_minutes' => 'integer|min:1|max:1440',
            'lock_type' => ['sometimes', Rule::in(FileLock::LOCK_TYPES)],
            'line_range' => 'sometimes|nullable|array',
            'line_range.start' => 'required_with:line_range|integer|min:1',
            'line_range.end' => 'required_with:line_range|integer|min:1|gte:line_range.start',
            // When true, a conflict returns an advisory queue position (202)
            // instead of a hard 409, so the client can order its retries.
            'queue' => 'sometimes|boolean',
        ]);

        $lockType = $validated['lock_type'] ?? FileLock::LOCK_TYPE_EXCLUSIVE;
        $lineRange = $validated['line_range'] ?? null;
        $instanceId = $validated['instance_id'];
        $path = $validated['path'];
        $reason = $validated['reason'] ?? null;
        $durationMinutes = $validated['duration_minutes']
            ?? (int) $project->getSetting('lockTimeoutMinutes', 30);
        $wantQueue = (bool) ($validated['queue'] ?? false);

        FileLock::cleanupExpired();

        // Transient candidate used only for conflict evaluation (never saved as-is).
        $candidate = new FileLock([
            'project_id' => $projectId,
            'path' => $path,
            'locked_by' => $instanceId,
            'lock_type' => $lockType,
            'line_range' => $lineRange,
        ]);

        return DB::transaction(function () use (
            $request, $project, $projectId, $path, $instanceId, $reason,
            $lockType, $lineRange, $durationMinutes, $wantQueue, $candidate
        ) {
            // Atomic check with row-level lock. unique(project_id, path) means at
            // most one active row exists per path.
            $existing = FileLock::forProject($projectId)
                ->forPath($path)
                ->active()
                ->lockForUpdate()
                ->first();

            // Re-acquire / extend own lock: refresh type, range, reason, expiry.
            if ($existing && $existing->locked_by === $instanceId) {
                $existing->update([
                    'lock_type' => $lockType,
                    'line_range' => $lineRange,
                    'reason' => $reason ?? $existing->reason,
                    'expires_at' => now()->addMinutes($durationMinutes),
                ]);

                broadcast(new \App\Events\FileLocked($existing))->toOthers();

                return $this->lockResponse($request, $existing, 200);
            }

            // A lock held by another instance: let conflictsWith decide. Two
            // shared (reader) locks on compatible ranges do NOT conflict.
            if ($existing && $candidate->conflictsWith($existing)) {
                $this->maybeReportContention($project, $projectId, $path, $existing->locked_by, $instanceId);

                if ($wantQueue) {
                    return $this->queuedResponse($request, $existing, $candidate);
                }

                return $this->conflictResponse($request, $existing, $candidate);
            }

            // Compatible shared lock already held by another instance: advisory
            // join. unique(project_id, path) forbids a second row, so the
            // requester shares the existing read marker (it may read alongside).
            if ($existing) {
                return $this->sharedJoinResponse($request, $existing, $candidate);
            }

            // Path is free → create the lock with its advanced attributes.
            $lock = FileLock::create([
                'project_id' => $projectId,
                'path' => $path,
                'locked_by' => $instanceId,
                'reason' => $reason,
                'lock_type' => $lockType,
                'line_range' => $lineRange,
                'expires_at' => now()->addMinutes($durationMinutes),
            ]);

            $lock->project?->logActivity('file_locked', $instanceId, [
                'path' => $path,
                'reason' => $reason,
                'lock_type' => $lockType,
            ]);

            broadcast(new \App\Events\FileLocked($lock))->toOthers();

            return $this->lockResponse($request, $lock, 201);
        });
    }

    /** Serialize a lock (with advanced fields) into the standard success envelope. */
    private function lockResponse(Request $request, FileLock $lock, int $status): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->lockData($lock),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], $status);
    }

    /** Standard serialization of a FileLock row including the advanced attributes. */
    private function lockData(FileLock $lock): array
    {
        return [
            'id' => $lock->id,
            'path' => $lock->path,
            'locked_by' => $lock->locked_by,
            'reason' => $lock->reason,
            'lock_type' => $lock->lock_type,
            'line_range' => $lock->line_range,
            'queue_position' => $lock->queue_position,
            'locked_at' => $lock->locked_at,
            'expires_at' => $lock->expires_at,
            'remaining_seconds' => $lock->remaining_time,
        ];
    }

    /** 409 enriched with the conflict type, holder and both line ranges. */
    private function conflictResponse(Request $request, FileLock $existing, FileLock $candidate): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => 'LCK_001',
                'message' => 'File already locked by ' . $existing->locked_by,
            ],
            'data' => [
                'conflict' => true,
                'holder' => $existing->locked_by,
                'holder_lock_type' => $existing->lock_type,
                'holder_line_range' => $existing->line_range,
                'requested_lock_type' => $candidate->lock_type,
                'requested_line_range' => $candidate->line_range,
                'expires_at' => $existing->expires_at?->toIso8601String(),
                'remaining_seconds' => $existing->remaining_time,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 409);
    }

    /**
     * 202 advisory queue response. unique(project_id, path) forbids a real
     * queued row, so we return a position the client can use to order retries.
     */
    private function queuedResponse(Request $request, FileLock $existing, FileLock $candidate): JsonResponse
    {
        // One blocking holder per path under the unique constraint → position 1
        // behind the current holder (or behind an already-advertised queue).
        $position = (int) ($existing->queue_position ?? 0) + 1;

        return response()->json([
            'success' => false,
            'data' => [
                'queued' => true,
                'queue_position' => $position,
                'ahead_of' => $candidate->locked_by,
                'holder' => $existing->locked_by,
                'holder_lock_type' => $existing->lock_type,
                'retry_after_seconds' => $existing->remaining_time,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 202);
    }

    /** 200 advisory "joined" response for a compatible shared (reader) lock. */
    private function sharedJoinResponse(Request $request, FileLock $existing, FileLock $candidate): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'shared' => true,
                'joined' => true,
                'lock_id' => $existing->id,
                'path' => $existing->path,
                'lock_type' => FileLock::LOCK_TYPE_SHARED,
                'holders_hint' => [$existing->locked_by, $candidate->locked_by],
                'line_range' => $candidate->line_range,
                'expires_at' => $existing->expires_at?->toIso8601String(),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 200);
    }

    /**
     * Coordinator trigger: ≥3 conflicting acquires on the same path within 10
     * minutes signal contention. Best-effort — must never break the response.
     */
    private function maybeReportContention(
        SharedProject $project,
        string $projectId,
        string $path,
        ?string $holder,
        string $requester
    ): void {
        try {
            $conflictKey = 'claudenest:lockconflict:' . $projectId . ':' . md5($path);
            // add() seeds the 10-minute window only on the first conflict;
            // increment() alone would create a TTL-less key.
            Cache::add($conflictKey, 0, now()->addMinutes(10));
            $conflicts = (int) Cache::increment($conflictKey);

            if ($conflicts >= 3) {
                app(CoordinatorService::class)->reportIncident(
                    $project,
                    CoordinatorService::INCIDENT_LOCK_CONTENTION,
                    [
                        'path' => $path,
                        'conflict_count' => $conflicts,
                        'holder' => $holder,
                        'requester' => $requester,
                    ],
                );
            }
        } catch (Throwable $e) {
            Log::warning('Coordinator trigger failed on lock conflict', [
                'project_id' => $projectId,
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /** Release a file lock. */
    #[OA\Post(
        path: '/api/projects/{projectId}/locks/release',
        summary: 'Release a file lock',
        security: [['bearerAuth' => []]],
        tags: ['File Locks'],
        parameters: [
            new OA\Parameter(name: 'projectId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['path', 'instance_id'],
                properties: [
                    new OA\Property(property: 'path', type: 'string'),
                    new OA\Property(property: 'instance_id', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Lock released', content: new OA\JsonContent(ref: '#/components/schemas/DeletedResponse')),
            new OA\Response(response: 404, description: 'Lock not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function destroy(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('update', $project);

        $validated = $request->validate([
            'path' => 'required|string|max:1024',
            'instance_id' => 'required|string',
        ]);

        $success = FileLock::releaseLock(
            $projectId,
            $validated['path'],
            $validated['instance_id']
        );

        if (!$success) {
            return $this->errorResponse('LCK_002', 'Lock not found or already expired', 404);
        }

        broadcast(new \App\Events\FileUnlocked($projectId, $validated['path']))->toOthers();

        return response()->json([
            'success' => true,
            'data' => null,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Force release a file lock (admin only). */
    #[OA\Post(
        path: '/api/projects/{projectId}/locks/force-release',
        summary: 'Force release a file lock',
        security: [['bearerAuth' => []]],
        tags: ['File Locks'],
        parameters: [
            new OA\Parameter(name: 'projectId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['path'],
                properties: [
                    new OA\Property(property: 'path', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Lock force released', content: new OA\JsonContent(ref: '#/components/schemas/DeletedResponse')),
            new OA\Response(response: 404, description: 'Lock not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function forceDestroy(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('forceRelease', [FileLock::class, $project]);

        $validated = $request->validate([
            'path' => 'required|string|max:1024',
        ]);

        $success = FileLock::forceRelease($projectId, $validated['path']);

        if (!$success) {
            return $this->errorResponse('LCK_002', 'Lock not found', 404);
        }

        broadcast(new \App\Events\FileUnlocked($projectId, $validated['path'], true))->toOthers();

        return response()->json([
            'success' => true,
            'data' => null,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Check if a file is locked. */
    #[OA\Post(
        path: '/api/projects/{projectId}/locks/check',
        summary: 'Check file lock status',
        security: [['bearerAuth' => []]],
        tags: ['File Locks'],
        parameters: [
            new OA\Parameter(name: 'projectId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['path'],
                properties: [
                    new OA\Property(property: 'path', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lock status',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean'),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'is_locked', type: 'boolean'),
                                new OA\Property(property: 'locked_by', type: 'string', nullable: true),
                            ]
                        ),
                    ]
                )
            ),
        ],
    )]
    public function check(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('view', $project);

        $validated = $request->validate([
            'path' => 'required|string|max:1024',
            // Optional candidate descriptor: when provided, the response also
            // reports whether such a lock WOULD conflict with the current holder.
            'lock_type' => ['sometimes', Rule::in(FileLock::LOCK_TYPES)],
            'line_range' => 'sometimes|nullable|array',
            'line_range.start' => 'required_with:line_range|integer|min:1',
            'line_range.end' => 'required_with:line_range|integer|min:1|gte:line_range.start',
            'instance_id' => 'sometimes|string',
        ]);

        FileLock::cleanupExpired();

        $existing = FileLock::forProject($projectId)
            ->forPath($validated['path'])
            ->active()
            ->first();

        $wouldConflict = null;
        if ($existing && isset($validated['lock_type'])) {
            $candidate = new FileLock([
                'project_id' => $projectId,
                'path' => $validated['path'],
                'locked_by' => $validated['instance_id'] ?? null,
                'lock_type' => $validated['lock_type'],
                'line_range' => $validated['line_range'] ?? null,
            ]);
            $wouldConflict = $candidate->conflictsWith($existing);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'is_locked' => (bool) $existing,
                'locked_by' => $existing?->locked_by,
                'lock_type' => $existing?->lock_type,
                'line_range' => $existing?->line_range,
                'expires_at' => $existing?->expires_at?->toIso8601String(),
                'would_conflict' => $wouldConflict,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Extend a file lock duration. */
    #[OA\Post(
        path: '/api/projects/{projectId}/locks/extend',
        summary: 'Extend a file lock duration',
        security: [['bearerAuth' => []]],
        tags: ['File Locks'],
        parameters: [
            new OA\Parameter(name: 'projectId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['path', 'instance_id'],
                properties: [
                    new OA\Property(property: 'path', type: 'string'),
                    new OA\Property(property: 'instance_id', type: 'string'),
                    new OA\Property(property: 'minutes', type: 'integer', default: 30),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Lock extended', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Lock not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function extend(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('update', $project);

        $validated = $request->validate([
            'path' => 'required|string|max:1024',
            'instance_id' => 'required|string',
            'minutes' => 'sometimes|integer|min:1|max:1440',
        ]);

        $lock = FileLock::forProject($projectId)
            ->forPath($validated['path'])
            ->byInstance($validated['instance_id'])
            ->active()
            ->first();

        if (!$lock) {
            return $this->errorResponse('LCK_002', 'Lock not found or already expired', 404);
        }

        $lock->extend($validated['minutes'] ?? 30);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $lock->id,
                'path' => $lock->path,
                'expires_at' => $lock->expires_at,
                'remaining_seconds' => $lock->remaining_time,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Release all locks held by an instance. */
    #[OA\Post(
        path: '/api/projects/{projectId}/locks/release-by-instance',
        summary: 'Release all locks held by an instance',
        security: [['bearerAuth' => []]],
        tags: ['File Locks'],
        parameters: [
            new OA\Parameter(name: 'projectId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['instance_id'],
                properties: [
                    new OA\Property(property: 'instance_id', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Locks released',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean'),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'released_count', type: 'integer'),
                            ]
                        ),
                    ]
                )
            ),
        ],
    )]
    public function releaseByInstance(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('update', $project);

        $validated = $request->validate([
            'instance_id' => 'required|string',
        ]);

        $count = FileLock::releaseByInstance($projectId, $validated['instance_id']);

        return response()->json([
            'success' => true,
            'data' => [
                'released_count' => $count,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Lock multiple files at once. */
    #[OA\Post(
        path: '/api/projects/{projectId}/locks/bulk',
        summary: 'Lock multiple files at once',
        security: [['bearerAuth' => []]],
        tags: ['File Locks'],
        parameters: [
            new OA\Parameter(name: 'projectId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/BulkFileLockRequest')
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Bulk lock results',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean'),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'locked', type: 'array', items: new OA\Items(type: 'object')),
                                new OA\Property(property: 'failed', type: 'array', items: new OA\Items(type: 'object')),
                            ]
                        ),
                    ]
                )
            ),
        ],
    )]
    public function bulkLock(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('update', $project);

        $validated = $request->validate([
            'paths' => 'required|array',
            'paths.*' => 'string|max:1024',
            'instance_id' => 'required|string',
            'reason' => 'nullable|string|max:255',
            'lock_type' => ['sometimes', Rule::in(FileLock::LOCK_TYPES)],
        ]);

        $lockType = $validated['lock_type'] ?? FileLock::LOCK_TYPE_EXCLUSIVE;
        $instanceId = $validated['instance_id'];
        $reason = $validated['reason'] ?? 'bulk lock';
        $durationMinutes = (int) $project->getSetting('lockTimeoutMinutes', 30);

        FileLock::cleanupExpired();

        try {
            $result = DB::transaction(function () use ($projectId, $validated, $lockType, $instanceId, $reason, $durationMinutes) {
                $results = [];

                foreach ($validated['paths'] as $path) {
                    $existing = FileLock::forProject($projectId)
                        ->forPath($path)
                        ->active()
                        ->lockForUpdate()
                        ->first();

                    // Own lock or no lock → (re)acquire. Otherwise let
                    // conflictsWith decide: a compatible shared lock is not a
                    // blocker (advisory join — no extra row under the unique
                    // constraint), an exclusive conflict aborts the whole batch.
                    if ($existing && $existing->locked_by !== $instanceId) {
                        $candidate = new FileLock([
                            'project_id' => $projectId,
                            'path' => $path,
                            'locked_by' => $instanceId,
                            'lock_type' => $lockType,
                        ]);

                        if ($candidate->conflictsWith($existing)) {
                            throw new \RuntimeException("Path '{$path}' already locked by {$existing->locked_by}");
                        }

                        // Compatible shared lock — join advisory, nothing to store.
                        $results[] = [
                            'path' => $path,
                            'id' => $existing->id,
                            'shared' => true,
                            'joined' => true,
                            'expires_at' => $existing->expires_at,
                        ];

                        continue;
                    }

                    if ($existing) {
                        // Own lock → refresh type + expiry.
                        $existing->update([
                            'lock_type' => $lockType,
                            'expires_at' => now()->addMinutes($durationMinutes),
                        ]);
                        $lock = $existing;
                    } else {
                        $lock = FileLock::create([
                            'project_id' => $projectId,
                            'path' => $path,
                            'locked_by' => $instanceId,
                            'reason' => $reason,
                            'lock_type' => $lockType,
                            'expires_at' => now()->addMinutes($durationMinutes),
                        ]);
                    }

                    $results[] = [
                        'path' => $lock->path,
                        'id' => $lock->id,
                        'lock_type' => $lock->lock_type,
                        'expires_at' => $lock->expires_at,
                    ];
                }

                return $results;
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'locked' => $result,
                    'failed' => [],
                ],
                'meta' => [
                    'timestamp' => now()->toIso8601String(),
                    'request_id' => $request->header('X-Request-ID', uniqid()),
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'data' => [
                    'locked' => [],
                    'failed' => [['error' => $e->getMessage()]],
                ],
                'meta' => [
                    'timestamp' => now()->toIso8601String(),
                    'request_id' => $request->header('X-Request-ID', uniqid()),
                ],
            ], 409);
        }
    }

    /** Check lock conflicts for multiple files. */
    #[OA\Post(
        path: '/api/projects/{projectId}/locks/conflicts',
        summary: 'Check lock conflicts for multiple files',
        security: [['bearerAuth' => []]],
        tags: ['File Locks'],
        parameters: [
            new OA\Parameter(name: 'projectId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['paths', 'instance_id'],
                properties: [
                    new OA\Property(property: 'paths', type: 'array', items: new OA\Items(type: 'string')),
                    new OA\Property(property: 'instance_id', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Conflict check results'),
        ],
    )]
    public function conflicts(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('view', $project);

        $validated = $request->validate([
            'paths' => 'required|array|min:1|max:100',
            'paths.*' => 'string|max:1024',
            'instance_id' => 'required|string',
            // Optional candidate descriptor: defaults to an exclusive whole-file
            // lock, which preserves the legacy "any other holder conflicts"
            // behaviour. A shared candidate won't conflict with shared holders.
            'lock_type' => ['sometimes', Rule::in(FileLock::LOCK_TYPES)],
            'line_range' => 'sometimes|nullable|array',
            'line_range.start' => 'required_with:line_range|integer|min:1',
            'line_range.end' => 'required_with:line_range|integer|min:1|gte:line_range.start',
        ]);

        FileLock::cleanupExpired();

        $lockType = $validated['lock_type'] ?? FileLock::LOCK_TYPE_EXCLUSIVE;
        $lineRange = $validated['line_range'] ?? null;
        $instanceId = $validated['instance_id'];

        $existingLocks = FileLock::forProject($projectId)
            ->whereIn('path', $validated['paths'])
            ->active()
            ->where('locked_by', '!=', $instanceId)
            ->get()
            ->keyBy('path');

        $conflicts = [];
        foreach ($validated['paths'] as $path) {
            $existing = $existingLocks->get($path);
            if (! $existing) {
                continue;
            }

            $candidate = new FileLock([
                'project_id' => $projectId,
                'path' => $path,
                'locked_by' => $instanceId,
                'lock_type' => $lockType,
                'line_range' => $lineRange,
            ]);

            if ($candidate->conflictsWith($existing)) {
                $conflicts[] = [
                    'path' => $path,
                    'locked_by' => $existing->locked_by,
                    'lock_type' => $existing->lock_type,
                    'line_range' => $existing->line_range,
                    'reason' => $existing->reason,
                    'expires_at' => $existing->expires_at?->toIso8601String(),
                    'remaining_seconds' => $existing->remaining_time,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'has_conflicts' => count($conflicts) > 0,
                'conflicts' => $conflicts,
                'checked_count' => count($validated['paths']),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }


}
