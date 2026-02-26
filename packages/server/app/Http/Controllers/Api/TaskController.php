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
     *
     * @OA\Get(
     *     path="/api/projects/{projectId}/tasks",
     *     tags={"Tasks"},
     *     summary="List project tasks",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="projectId", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Parameter(name="status", in="query", required=false, @OA\Schema(type="string", enum={"pending","in_progress","blocked","review","done"})),
     *     @OA\Parameter(name="assigned_to", in="query", required=false, @OA\Schema(type="string")),
     *     @OA\Parameter(name="priority", in="query", required=false, @OA\Schema(type="string", enum={"low","medium","high","critical"})),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=20)),
     *     @OA\Response(response=200, description="Paginated task list", @OA\JsonContent(ref="#/components/schemas/PaginatedResponse")),
     *     @OA\Response(response=404, description="Project not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
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
     *
     * @OA\Post(
     *     path="/api/projects/{projectId}/tasks",
     *     tags={"Tasks"},
     *     summary="Create a task",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="projectId", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/CreateTaskRequest")),
     *     @OA\Response(response=201, description="Task created", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")),
     *     @OA\Response(response=404, description="Project not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
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
            'priority' => 'string|in:low,medium,high,critical',
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
     *
     * @OA\Get(
     *     path="/api/tasks/{id}",
     *     tags={"Tasks"},
     *     summary="Get task details",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(response=200, description="Task details", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")),
     *     @OA\Response(response=404, description="Task not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
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
     *
     * @OA\Patch(
     *     path="/api/tasks/{id}",
     *     tags={"Tasks"},
     *     summary="Update a task",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="title", type="string", maxLength=255),
     *         @OA\Property(property="description", type="string", nullable=true),
     *         @OA\Property(property="priority", type="string", enum={"low","medium","high","critical"}),
     *         @OA\Property(property="files", type="array", @OA\Items(type="string")),
     *         @OA\Property(property="estimated_tokens", type="integer")
     *     )),
     *     @OA\Response(response=200, description="Task updated", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")),
     *     @OA\Response(response=404, description="Task not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
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
     *
     * @OA\Delete(
     *     path="/api/tasks/{id}",
     *     tags={"Tasks"},
     *     summary="Delete a task",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(response=200, description="Task deleted", @OA\JsonContent(ref="#/components/schemas/DeletedResponse")),
     *     @OA\Response(response=404, description="Task not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
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
     *
     * @OA\Post(
     *     path="/api/tasks/{id}/claim",
     *     tags={"Tasks"},
     *     summary="Claim a task for an instance",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"instance_id"},
     *         @OA\Property(property="instance_id", type="string")
     *     )),
     *     @OA\Response(response=200, description="Task claimed", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")),
     *     @OA\Response(response=404, description="Task not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse")),
     *     @OA\Response(response=409, description="Task already claimed", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
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
     *
     * @OA\Post(
     *     path="/api/tasks/{id}/release",
     *     tags={"Tasks"},
     *     summary="Release a claimed task",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\RequestBody(required=false, @OA\JsonContent(
     *         @OA\Property(property="reason", type="string", nullable=true)
     *     )),
     *     @OA\Response(response=200, description="Task released", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")),
     *     @OA\Response(response=404, description="Task not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse")),
     *     @OA\Response(response=400, description="Task not claimed", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
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
     *
     * @OA\Post(
     *     path="/api/tasks/{id}/complete",
     *     tags={"Tasks"},
     *     summary="Mark a task as completed",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/CompleteTaskRequest")),
     *     @OA\Response(response=200, description="Task completed", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")),
     *     @OA\Response(response=404, description="Task not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse")),
     *     @OA\Response(response=400, description="Task not claimed", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
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
     * Atomically claim the next available task for a worker instance.
     */
    public function claimNext(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $validated = $request->validate([
            'instance_id' => 'required|string',
        ]);

        $task = SharedTask::claimNextAvailable($projectId, $validated['instance_id']);

        if (!$task) {
            return response()->json([
                'success' => true,
                'data' => null,
                'meta' => [
                    'message' => 'No tasks available',
                    'timestamp' => now()->toIso8601String(),
                    'request_id' => $request->header('X-Request-ID', uniqid()),
                ],
            ]);
        }

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
            $data['duration'] = $task->duration;
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
