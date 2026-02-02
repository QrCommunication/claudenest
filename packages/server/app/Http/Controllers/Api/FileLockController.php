<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FileLock;
use App\Models\SharedProject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FileLockController extends Controller
{
    /**
     * List file locks for a project.
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

        // Clean up expired locks first
        FileLock::cleanupExpired();

        // Check if already locked by another instance
        $existingOwner = FileLock::getOwner($projectId, $validated['path']);

        if ($existingOwner && $existingOwner !== $validated['instance_id']) {
            return $this->errorResponse(
                'LCK_001',
                'File already locked by ' . $existingOwner,
                409
            );
        }

        // Acquire or extend lock
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

        // Broadcast lock acquisition
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

        // Broadcast lock release
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

        // Broadcast lock release
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

        $results = [];
        $failed = [];

        foreach ($validated['paths'] as $path) {
            $existingOwner = FileLock::getOwner($projectId, $path);

            if ($existingOwner && $existingOwner !== $validated['instance_id']) {
                $failed[] = [
                    'path' => $path,
                    'error' => 'Already locked by ' . $existingOwner,
                ];
                continue;
            }

            $lock = FileLock::acquire(
                $projectId,
                $path,
                $validated['instance_id'],
                $validated['reason'] ?? 'bulk lock'
            );

            if ($lock) {
                $results[] = [
                    'path' => $lock->path,
                    'id' => $lock->id,
                    'expires_at' => $lock->expires_at,
                ];
            } else {
                $failed[] = [
                    'path' => $path,
                    'error' => 'Failed to acquire lock',
                ];
            }
        }

        return response()->json([
            'success' => empty($failed),
            'data' => [
                'locked' => $results,
                'failed' => $failed,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
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
