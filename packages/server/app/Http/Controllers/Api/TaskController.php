<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SharedProject;
use App\Models\SharedTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    /**
     * List tasks for a project.
     */
    public function index(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $validated = $request->validate([
            'status' => 'string|in:pending,in_progress,blocked,review,done',
            'assigned_to' => 'string',
            'priority' => 'string|in:low,medium,high,critical',
        ]);

        $query = $project->tasks()->orderBy('created_at', 'desc');

        if (isset($validated['status'])) {
            $query->byStatus($validated['status']);
        }

        if (isset($validated['assigned_to'])) {
            $query->assignedTo($validated['assigned_to']);
        }

        if (isset($validated['priority'])) {
            $query->byPriority($validated['priority']);
        }

        $tasks = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $tasks->map(fn ($task) => $this->formatTask($task)),
            'meta' => [
                'pagination' => [
                    'current_page' => $tasks->currentPage(),
                    'per_page' => $tasks->perPage(),
                    'total' => $tasks->total(),
                    'last_page' => $tasks->lastPage(),
                ],
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Create a new task.
     */
    public function store(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'string|in:low,medium,high,critical|default:medium',
            'files' => 'array',
            'files.*' => 'string',
            'estimated_tokens' => 'integer|min:1',
            'dependencies' => 'array',
            'dependencies.*' => 'uuid|exists:shared_tasks,id',
        ]);

        $task = $project->tasks()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'priority' => $validated['priority'] ?? 'medium',
            'status' => 'pending',
            'files' => $validated['files'] ?? [],
            'estimated_tokens' => $validated['estimated_tokens'] ?? null,
            'dependencies' => $validated['dependencies'] ?? [],
            'created_by' => $request->input('instance_id') ?? $request->user()->id,
        ]);

        // Broadcast task creation
        broadcast(new \App\Events\TaskCreated($task))->toOthers();

        return response()->json([
            'success' => true,
            'data' => $this->formatTask($task),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Show task details.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $task = SharedTask::whereHas('project', function ($q) use ($request) {
            $q->forUser($request->user()->id);
        })->find($id);

        if (!$task) {
            return $this->errorResponse('TSK_001', 'Task not found', 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatTask($task, true),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Update task.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $task = SharedTask::whereHas('project', function ($q) use ($request) {
            $q->forUser($request->user()->id);
        })->find($id);

        if (!$task) {
            return $this->errorResponse('TSK_001', 'Task not found', 404);
        }

        $validated = $request->validate([
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'priority' => 'string|in:low,medium,high,critical',
            'files' => 'array',
            'files.*' => 'string',
            'estimated_tokens' => 'integer|min:1',
        ]);

        $task->update($validated);

        return response()->json([
            'success' => true,
            'data' => $this->formatTask($task),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Delete task.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $task = SharedTask::whereHas('project', function ($q) use ($request) {
            $q->forUser($request->user()->id);
        })->find($id);

        if (!$task) {
            return $this->errorResponse('TSK_001', 'Task not found', 404);
        }

        // Release any claim before deletion
        if ($task->is_claimed) {
            $task->release('Task deleted');
        }

        $task->delete();

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
     * Claim a task.
     */
    public function claim(Request $request, string $id): JsonResponse
    {
        $task = SharedTask::whereHas('project', function ($q) use ($request) {
            $q->forUser($request->user()->id);
        })->find($id);

        if (!$task) {
            return $this->errorResponse('TSK_001', 'Task not found', 404);
        }

        $validated = $request->validate([
            'instance_id' => 'required|string',
        ]);

        if ($task->is_claimed) {
            return $this->errorResponse('TSK_002', 'Task already claimed by ' . $task->assigned_to, 409);
        }

        if (!$task->hasDependenciesCompleted()) {
            return $this->errorResponse('TSK_003', 'Task dependencies not completed', 400);
        }

        $success = $task->claim($validated['instance_id']);

        if (!$success) {
            return $this->errorResponse('TSK_002', 'Failed to claim task', 409);
        }

        // Broadcast task claim
        broadcast(new \App\Events\TaskClaimed($task))->toOthers();

        return response()->json([
            'success' => true,
            'data' => $this->formatTask($task),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Release a task.
     */
    public function release(Request $request, string $id): JsonResponse
    {
        $task = SharedTask::whereHas('project', function ($q) use ($request) {
            $q->forUser($request->user()->id);
        })->find($id);

        if (!$task) {
            return $this->errorResponse('TSK_001', 'Task not found', 404);
        }

        $validated = $request->validate([
            'reason' => 'nullable|string',
        ]);

        if (!$task->is_claimed) {
            return $this->errorResponse('TSK_003', 'Task is not claimed', 400);
        }

        $task->release($validated['reason'] ?? null);

        // Broadcast task release
        broadcast(new \App\Events\TaskReleased($task))->toOthers();

        return response()->json([
            'success' => true,
            'data' => $this->formatTask($task),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Complete a task.
     */
    public function complete(Request $request, string $id): JsonResponse
    {
        $task = SharedTask::whereHas('project', function ($q) use ($request) {
            $q->forUser($request->user()->id);
        })->find($id);

        if (!$task) {
            return $this->errorResponse('TSK_001', 'Task not found', 404);
        }

        $validated = $request->validate([
            'summary' => 'required|string',
            'files_modified' => 'array',
            'files_modified.*' => 'string',
            'instance_id' => 'required|string',
        ]);

        if (!$task->is_claimed) {
            return $this->errorResponse('TSK_003', 'Task must be claimed before completion', 400);
        }

        $task->complete(
            $validated['summary'],
            $validated['files_modified'] ?? []
        );

        // Update instance stats
        if ($instance = $task->project->claudeInstances()->find($validated['instance_id'])) {
            $instance->incrementTasksCompleted();
            $instance->markAsIdle();
        }

        // Create context chunk for task completion
        $task->project->contextChunks()->create([
            'content' => "Task completed: {$task->title}\n\nSummary: {$validated['summary']}",
            'type' => 'task_completion',
            'instance_id' => $validated['instance_id'],
            'task_id' => $task->id,
            'files' => $validated['files_modified'] ?? [],
            'importance_score' => 0.8,
        ]);

        // Broadcast task completion
        broadcast(new \App\Events\TaskCompleted($task))->toOthers();

        return response()->json([
            'success' => true,
            'data' => $this->formatTask($task),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Get next available task.
     */
    public function nextAvailable(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $task = SharedTask::getNextAvailable($projectId);

        if (!$task) {
            return response()->json([
                'success' => true,
                'data' => null,
                'meta' => [
                    'timestamp' => now()->toIso8601String(),
                    'request_id' => $request->header('X-Request-ID', uniqid()),
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatTask($task),
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
     * Helper: Format task data.
     */
    private function formatTask(SharedTask $task, bool $detailed = false): array
    {
        $data = [
            'id' => $task->id,
            'project_id' => $task->project_id,
            'title' => $task->title,
            'description' => $task->description,
            'priority' => $task->priority,
            'status' => $task->status,
            'is_claimed' => $task->is_claimed,
            'is_completed' => $task->is_completed,
            'is_blocked' => $task->is_blocked,
            'assigned_to' => $task->assigned_to,
            'claimed_at' => $task->claimed_at,
            'completed_at' => $task->completed_at,
            'created_at' => $task->created_at,
            'updated_at' => $task->updated_at,
        ];

        if ($detailed) {
            $data['files'] = $task->files;
            $data['estimated_tokens'] = $task->estimated_tokens;
            $data['dependencies'] = $task->dependencies;
            $data['blocked_by'] = $task->blocked_by;
            $data['completion_summary'] = $task->completion_summary;
            $data['files_modified'] = $task->files_modified;
            $data['created_by'] = $task->created_by;
            $data['duration'] = $task->duration,
        }

        return $data;
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
