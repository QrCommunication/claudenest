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
        ]);

        FileLock::cleanupExpired();

        $existingOwner = FileLock::getOwner($projectId, $validated['path']);

        if ($existingOwner && $existingOwner !== $validated['instance_id']) {
            // Coordinator trigger: ≥3 conflicting acquires on the same path
            // within 10 minutes signal contention. Best-effort — coordination
            // must never break the 409 response.
            try {
                $conflictKey = 'claudenest:lockconflict:' . $projectId . ':' . md5($validated['path']);
                // add() seeds the 10-minute window only on the first conflict;
                // increment() alone would create a TTL-less key.
                Cache::add($conflictKey, 0, now()->addMinutes(10));
                $conflicts = (int) Cache::increment($conflictKey);

                if ($conflicts >= 3) {
                    app(CoordinatorService::class)->reportIncident(
                        $project,
                        CoordinatorService::INCIDENT_LOCK_CONTENTION,
                        [
                            'path' => $validated['path'],
                            'conflict_count' => $conflicts,
                            'holder' => $existingOwner,
                            'requester' => $validated['instance_id'],
                        ],
                    );
                }
            } catch (Throwable $e) {
                Log::warning('Coordinator trigger failed on lock conflict', [
                    'project_id' => $projectId,
                    'path' => $validated['path'],
                    'error' => $e->getMessage(),
                ]);
            }

            return $this->errorResponse(
                'LCK_001',
                'File already locked by ' . $existingOwner,
                409
            );
        }

        $lock = FileLock::acquire(
            $projectId,
            $validated['path'],
            $validated['instance_id'],
            $validated['reason'] ?? null,
            $validated['duration_minutes'] ?? null
        );

        if (!$lock) {
            return $this->errorResponse('LCK_001', 'Failed to acquire lock', 500);
        }

        broadcast(new \App\Events\FileLocked($lock))->toOthers();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $lock->id,
                'path' => $lock->path,
                'locked_by' => $lock->locked_by,
                'reason' => $lock->reason,
                'locked_at' => $lock->locked_at,
                'expires_at' => $lock->expires_at,
                'remaining_seconds' => $lock->remaining_time,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
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
        ]);

        $isLocked = FileLock::isLocked($projectId, $validated['path']);
        $owner = $isLocked ? FileLock::getOwner($projectId, $validated['path']) : null;

        return response()->json([
            'success' => true,
            'data' => [
                'is_locked' => $isLocked,
                'locked_by' => $owner,
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
        ]);

        FileLock::cleanupExpired();

        try {
            $result = DB::transaction(function () use ($projectId, $validated) {
                $results = [];

                foreach ($validated['paths'] as $path) {
                    $existingOwner = FileLock::getOwner($projectId, $path);

                    if ($existingOwner && $existingOwner !== $validated['instance_id']) {
                        throw new \RuntimeException("Path '{$path}' already locked by {$existingOwner}");
                    }

                    $lock = FileLock::acquire(
                        $projectId,
                        $path,
                        $validated['instance_id'],
                        $validated['reason'] ?? 'bulk lock'
                    );

                    if (!$lock) {
                        throw new \RuntimeException("Failed to acquire lock on '{$path}'");
                    }

                    $results[] = [
                        'path' => $lock->path,
                        'id' => $lock->id,
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
        ]);

        $conflicts = FileLock::checkConflicts(
            $projectId,
            $validated['paths'],
            $validated['instance_id']
        );

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
