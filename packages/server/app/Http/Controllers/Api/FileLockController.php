<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FileLock;
use App\Models\SharedProject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FileLockController extends Controller
{
    /**
     * List file locks for a project.
     *
     * @OA\Get(
     *     path="/api/projects/{projectId}/locks",
     *     tags={"File Locks"},
     *     summary="List active file locks",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="projectId", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(response=200, description="List of active locks", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")),
     *     @OA\Response(response=404, description="Project not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
     */
    public function index(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

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

    /**
     * Acquire a file lock.
     *
     * @OA\Post(
     *     path="/api/projects/{projectId}/locks",
     *     tags={"File Locks"},
     *     summary="Acquire a file lock",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="projectId", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/CreateFileLockRequest")),
     *     @OA\Response(response=201, description="Lock acquired", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")),
     *     @OA\Response(response=404, description="Project not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse")),
     *     @OA\Response(response=409, description="File already locked", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
     */
    public function store(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $validated = $request->validate([
            'path' => 'required|string|max:1024',
            'instance_id' => 'required|string',
            'reason' => 'nullable|string|max:255',
            'duration_minutes' => 'integer|min:1|max:1440',
        ]);

        FileLock::cleanupExpired();

        $existingOwner = FileLock::getOwner($projectId, $validated['path']);

        if ($existingOwner && $existingOwner !== $validated['instance_id']) {
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

    /**
     * Release a file lock.
     *
     * @OA\Post(
     *     path="/api/projects/{projectId}/locks/release",
     *     tags={"File Locks"},
     *     summary="Release a file lock",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="projectId", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"path", "instance_id"},
     *         @OA\Property(property="path", type="string"),
     *         @OA\Property(property="instance_id", type="string")
     *     )),
     *     @OA\Response(response=200, description="Lock released", @OA\JsonContent(ref="#/components/schemas/DeletedResponse")),
     *     @OA\Response(response=404, description="Lock not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
     */
    public function destroy(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

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

    /**
     * Force release a file lock (admin only).
     *
     * @OA\Post(
     *     path="/api/projects/{projectId}/locks/force-release",
     *     tags={"File Locks"},
     *     summary="Force release a file lock",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="projectId", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"path"},
     *         @OA\Property(property="path", type="string")
     *     )),
     *     @OA\Response(response=200, description="Lock force released", @OA\JsonContent(ref="#/components/schemas/DeletedResponse")),
     *     @OA\Response(response=404, description="Lock not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
     */
    public function forceDestroy(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

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

    /**
     * Check if a file is locked.
     *
     * @OA\Post(
     *     path="/api/projects/{projectId}/locks/check",
     *     tags={"File Locks"},
     *     summary="Check file lock status",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="projectId", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"path"},
     *         @OA\Property(property="path", type="string")
     *     )),
     *     @OA\Response(response=200, description="Lock status", @OA\JsonContent(
     *         @OA\Property(property="success", type="boolean"),
     *         @OA\Property(property="data", type="object",
     *             @OA\Property(property="is_locked", type="boolean"),
     *             @OA\Property(property="locked_by", type="string", nullable=true)
     *         )
     *     ))
     * )
     */
    public function check(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

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

    /**
     * Extend a file lock.
     *
     * @OA\Post(
     *     path="/api/projects/{projectId}/locks/extend",
     *     tags={"File Locks"},
     *     summary="Extend a file lock duration",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="projectId", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"path", "instance_id"},
     *         @OA\Property(property="path", type="string"),
     *         @OA\Property(property="instance_id", type="string"),
     *         @OA\Property(property="minutes", type="integer", default=30)
     *     )),
     *     @OA\Response(response=200, description="Lock extended", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")),
     *     @OA\Response(response=404, description="Lock not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
     */
    public function extend(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $validated = $request->validate([
            'path' => 'required|string|max:1024',
            'instance_id' => 'required|string',
            'minutes' => 'integer|min:1|max:1440|default:30',
        ]);

        $lock = FileLock::forProject($projectId)
            ->forPath($validated['path'])
            ->byInstance($validated['instance_id'])
            ->active()
            ->first();

        if (!$lock) {
            return $this->errorResponse('LCK_002', 'Lock not found or already expired', 404);
        }

        $lock->extend($validated['minutes']);

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

    /**
     * Release all locks by an instance.
     *
     * @OA\Post(
     *     path="/api/projects/{projectId}/locks/release-by-instance",
     *     tags={"File Locks"},
     *     summary="Release all locks held by an instance",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="projectId", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"instance_id"},
     *         @OA\Property(property="instance_id", type="string")
     *     )),
     *     @OA\Response(response=200, description="Locks released", @OA\JsonContent(
     *         @OA\Property(property="success", type="boolean"),
     *         @OA\Property(property="data", type="object",
     *             @OA\Property(property="released_count", type="integer")
     *         )
     *     ))
     * )
     */
    public function releaseByInstance(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

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

    /**
     * Bulk lock multiple files.
     *
     * @OA\Post(
     *     path="/api/projects/{projectId}/locks/bulk",
     *     tags={"File Locks"},
     *     summary="Lock multiple files at once",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="projectId", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/BulkFileLockRequest")),
     *     @OA\Response(response=200, description="Bulk lock results", @OA\JsonContent(
     *         @OA\Property(property="success", type="boolean"),
     *         @OA\Property(property="data", type="object",
     *             @OA\Property(property="locked", type="array", @OA\Items(type="object")),
     *             @OA\Property(property="failed", type="array", @OA\Items(type="object"))
     *         )
     *     ))
     * )
     */
    public function bulkLock(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

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

    /**
     * Helper: Get project belonging to authenticated user.
     */
    private function getUserProject(Request $request, string $id): ?SharedProject
    {
        return SharedProject::forUser($request->user()->id)->find($id);
    }

    /**
     * Helper: Error response.
     */
    private function errorResponse(string $code, string $message, int $status): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => request()->header('X-Request-ID', uniqid()),
            ],
        ], $status);
    }
}
