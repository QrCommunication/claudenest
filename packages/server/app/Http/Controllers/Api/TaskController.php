<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\SharedProject;
use App\Models\SharedTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class TaskController extends Controller
{
    /**
     * List tasks for a project.
     */
    #[OA\Get(
        path: '/api/projects/{projectId}/tasks',
        summary: 'List project tasks',
        security: [['bearerAuth' => []]],
        tags: ['Tasks'],
        parameters: [
            new OA\Parameter(name: 'projectId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['pending', 'in_progress', 'blocked', 'review', 'done'])),
            new OA\Parameter(name: 'assigned_to', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'priority', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['low', 'medium', 'high', 'critical'])),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 20)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated task list', content: new OA\JsonContent(ref: '#/components/schemas/PaginatedResponse')),
            new OA\Response(response: 404, description: 'Project not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function index(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('view', $project);

        $validated = $request->validate([
            'status' => 'string|in:backlog,pending,in_progress,blocked,review,done',
            'assigned_to' => 'string',
            'priority' => 'string|in:low,medium,high,critical',
            'epic_id' => 'uuid|exists:epics,id',
            'sprint_id' => 'uuid|exists:sprints,id',
            'parent_id' => 'uuid|exists:shared_tasks,id',
            'root_only' => 'boolean',
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

        if (isset($validated['epic_id'])) {
            $query->byEpic($validated['epic_id']);
        }

        if (isset($validated['sprint_id'])) {
            $query->bySprint($validated['sprint_id']);
        }

        if (isset($validated['parent_id'])) {
            $query->subtasksOf($validated['parent_id']);
        }

        if ($request->boolean('root_only')) {
            $query->rootTasks();
        }

        $tasks = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => TaskResource::collection($tasks),
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
    #[OA\Post(
        path: '/api/projects/{projectId}/tasks',
        summary: 'Create a task',
        security: [['bearerAuth' => []]],
        tags: ['Tasks'],
        parameters: [
            new OA\Parameter(name: 'projectId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/CreateTaskRequest')),
        responses: [
            new OA\Response(response: 201, description: 'Task created', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Project not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function store(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('update', $project);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'string|in:low,medium,high,critical',
            'files' => 'array',
            'files.*' => 'string',
            'estimated_tokens' => 'integer|min:1',
            'dependencies' => 'array',
            'dependencies.*' => 'uuid|exists:shared_tasks,id',
            'epic_id' => 'nullable|uuid|exists:epics,id',
            'sprint_id' => 'nullable|uuid|exists:sprints,id',
            'parent_id' => 'nullable|uuid|exists:shared_tasks,id',
            'story_points' => 'nullable|integer|min:1|max:100',
            'due_date' => 'nullable|date',
            'labels' => 'array',
            'labels.*' => 'string|max:50',
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
            'epic_id' => $validated['epic_id'] ?? null,
            'sprint_id' => $validated['sprint_id'] ?? null,
            'parent_id' => $validated['parent_id'] ?? null,
            'story_points' => $validated['story_points'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'labels' => $validated['labels'] ?? [],
        ]);

        // Broadcast task creation
        broadcast(new \App\Events\TaskCreated($task))->toOthers();

        return response()->json([
            'success' => true,
            'data' => new TaskResource($task),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Show task details.
     */
    #[OA\Get(
        path: '/api/tasks/{id}',
        summary: 'Get task details',
        security: [['bearerAuth' => []]],
        tags: ['Tasks'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Task details', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Task not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function show(Request $request, string $id): JsonResponse
    {
        $task = SharedTask::with('project')->findOrFail($id);
        $this->authorize('view', $task);

        return response()->json([
            'success' => true,
            'data' => new TaskResource($task),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Update task.
     */
    #[OA\Patch(
        path: '/api/tasks/{id}',
        summary: 'Update a task',
        security: [['bearerAuth' => []]],
        tags: ['Tasks'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'title', type: 'string', maxLength: 255),
                new OA\Property(property: 'description', type: 'string', nullable: true),
                new OA\Property(property: 'priority', type: 'string', enum: ['low', 'medium', 'high', 'critical']),
                new OA\Property(property: 'files', type: 'array', items: new OA\Items(type: 'string')),
                new OA\Property(property: 'estimated_tokens', type: 'integer'),
            ]
        )),
        responses: [
            new OA\Response(response: 200, description: 'Task updated', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Task not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function update(Request $request, string $id): JsonResponse
    {
        $task = SharedTask::with('project')->findOrFail($id);
        $this->authorize('update', $task);

        $validated = $request->validate([
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'priority' => 'string|in:low,medium,high,critical',
            'status' => 'string|in:backlog,pending,in_progress,blocked,review,done',
            'files' => 'array',
            'files.*' => 'string',
            'estimated_tokens' => 'integer|min:1',
            'epic_id' => 'nullable|uuid|exists:epics,id',
            'sprint_id' => 'nullable|uuid|exists:sprints,id',
            'parent_id' => 'nullable|uuid|exists:shared_tasks,id',
            'story_points' => 'nullable|integer|min:1|max:100',
            'due_date' => 'nullable|date',
            'labels' => 'array',
            'labels.*' => 'string|max:50',
        ]);

        $task->update($validated);

        return response()->json([
            'success' => true,
            'data' => new TaskResource($task),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Delete task.
     */
    #[OA\Delete(
        path: '/api/tasks/{id}',
        summary: 'Delete a task',
        security: [['bearerAuth' => []]],
        tags: ['Tasks'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Task deleted', content: new OA\JsonContent(ref: '#/components/schemas/DeletedResponse')),
            new OA\Response(response: 404, description: 'Task not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function destroy(Request $request, string $id): JsonResponse
    {
        $task = SharedTask::with('project')->findOrFail($id);
        $this->authorize('delete', $task);

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
    #[OA\Post(
        path: '/api/tasks/{id}/claim',
        summary: 'Claim a task for an instance',
        security: [['bearerAuth' => []]],
        tags: ['Tasks'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['instance_id'],
            properties: [
                new OA\Property(property: 'instance_id', type: 'string'),
            ]
        )),
        responses: [
            new OA\Response(response: 200, description: 'Task claimed', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Task not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 409, description: 'Task already claimed', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function claim(Request $request, string $id): JsonResponse
    {
        $task = SharedTask::with('project')->findOrFail($id);
        $this->authorize('claim', $task);

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
            'data' => new TaskResource($task),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Release a task.
     */
    #[OA\Post(
        path: '/api/tasks/{id}/release',
        summary: 'Release a claimed task',
        security: [['bearerAuth' => []]],
        tags: ['Tasks'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'reason', type: 'string', nullable: true),
            ]
        )),
        responses: [
            new OA\Response(response: 200, description: 'Task released', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Task not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 400, description: 'Task not claimed', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function release(Request $request, string $id): JsonResponse
    {
        $task = SharedTask::with('project')->findOrFail($id);
        $this->authorize('release', $task);

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
            'data' => new TaskResource($task),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Complete a task.
     */
    #[OA\Post(
        path: '/api/tasks/{id}/complete',
        summary: 'Mark a task as completed',
        security: [['bearerAuth' => []]],
        tags: ['Tasks'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/CompleteTaskRequest')),
        responses: [
            new OA\Response(response: 200, description: 'Task completed', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Task not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 400, description: 'Task not claimed', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function complete(Request $request, string $id): JsonResponse
    {
        $task = SharedTask::with('project')->findOrFail($id);
        $this->authorize('complete', $task);

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
            'data' => new TaskResource($task),
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
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('view', $project);

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
            'data' => new TaskResource($task),
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
            'data' => new TaskResource($task),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * List subtasks of a task.
     */
    public function subtasks(Request $request, string $id): JsonResponse
    {
        $task = SharedTask::with('project')->findOrFail($id);
        $this->authorize('view', $task);

        $subtasks = $task->children()->ordered()->get();

        return response()->json([
            'success' => true,
            'data' => TaskResource::collection($subtasks),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Move a task to a different epic, sprint or status.
     */
    public function move(Request $request, string $id): JsonResponse
    {
        $task = SharedTask::with('project')->findOrFail($id);
        $this->authorize('update', $task);

        $validated = $request->validate([
            'epic_id' => 'nullable|uuid|exists:epics,id',
            'sprint_id' => 'nullable|uuid|exists:sprints,id',
            'status' => 'nullable|string|in:backlog,pending,in_progress,blocked,review,done',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $task->update($validated);

        return response()->json([
            'success' => true,
            'data' => new TaskResource($task),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

}
