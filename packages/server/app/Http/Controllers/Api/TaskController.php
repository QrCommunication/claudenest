<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Events\EpicUpdated;
use App\Events\SprintUpdated;
use App\Events\TaskClaimed;
use App\Events\TaskCompleted;
use App\Events\TaskCreated;
use App\Events\TaskReleased;
use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Epic;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Sprint;
use App\Services\ContextRAGService;
use App\Services\CoordinatorService;
use App\Services\WorkerLoopService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;
use Throwable;

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
            new OA\Parameter(name: 'sprint_id', in: 'query', required: false, description: 'Filter by sprint UUID, or "none" for backlog (tasks without a sprint). Bypasses the default visibility filter.', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'include_all', in: 'query', required: false, description: 'Override the default visibility filter to return every task (including tasks completed before today).', schema: new OA\Schema(type: 'boolean')),
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
            // sprint_id accepts a sprint UUID, or the literal "none" for the
            // backlog (tasks without any sprint). Validated by hand because
            // "none" is not a UUID and Str::isUuid() guards the DB against the
            // PostgreSQL "invalid input syntax for type uuid" (22P02) error.
            'sprint_id' => [
                'string',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if ($value === 'none') {
                        return;
                    }

                    if (! Str::isUuid($value) || ! Sprint::whereKey($value)->exists()) {
                        $fail('The sprint_id must be a valid sprint UUID or "none".');
                    }
                },
            ],
            'parent_id' => 'uuid|exists:shared_tasks,id',
            'root_only' => 'boolean',
            'include_all' => 'boolean',
        ]);

        $query = $project->tasks()->orderBy('created_at', 'desc');

        // A sprint filter (specific sprint or "none" backlog) is an explicit
        // narrowing that bypasses the default visibility filter below.
        $sprintFilterApplied = isset($validated['sprint_id']);
        if ($sprintFilterApplied) {
            if ($validated['sprint_id'] === 'none') {
                $query->whereNull('sprint_id');
            } else {
                $query->bySprint($validated['sprint_id']);
            }
        }

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

        // Board hygiene: tasks under an archived epic drop off the panel, like
        // the epic itself disappears from the board (EpicController::index) and
        // its sprints (Sprint::scopeExcludingArchivedEpics). An explicit epic_id
        // filter bypasses this — targeting an epic directly lets you still
        // inspect its tasks even once it is archived. Tasks with no epic (NULL
        // epic_id) are always retained (whereDoesntHave is null-safe).
        if (! isset($validated['epic_id'])) {
            $query->excludingArchivedEpics();
        }

        if (isset($validated['parent_id'])) {
            $query->subtasksOf($validated['parent_id']);
        }

        if ($request->boolean('root_only')) {
            $query->rootTasks();
        }

        // Default visibility (in-progress tasks + tasks completed today) keeps
        // the task panel focused on the current day. It is skipped when the
        // caller already narrows the result set explicitly — by sprint, by epic,
        // by an exact status, or via the include_all override — since combining
        // it with those filters would surprisingly hide matching tasks (e.g. a
        // done epic's tasks, all completed before today, would otherwise vanish).
        if (! $sprintFilterApplied
            && ! isset($validated['epic_id'])
            && ! isset($validated['status'])
            && ! $request->boolean('include_all')) {
            $query->defaultVisible();
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
     * List tasks across every active (non-archived) project the user owns —
     * the backing endpoint for the all-projects task panel.
     *
     * Mirrors {@see index}'s filtering (status / priority / assigned_to + the
     * default visibility window, overridable with include_all), but spans all
     * the user's projects instead of one. Each task carries its `project_id`
     * (TaskResource) so the client can group by project. An optional `project_id`
     * filter narrows back to a single owned project.
     *
     * GET /api/tasks
     */
    #[OA\Get(
        path: '/api/tasks',
        summary: 'List the user\'s tasks across all active projects',
        security: [['bearerAuth' => []]],
        tags: ['Tasks'],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['backlog', 'pending', 'in_progress', 'blocked', 'review', 'done'])),
            new OA\Parameter(name: 'assigned_to', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'priority', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['low', 'medium', 'high', 'critical'])),
            new OA\Parameter(name: 'project_id', in: 'query', required: false, description: 'Narrow to a single owned project.', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'include_all', in: 'query', required: false, description: 'Override the default visibility filter to return every task (including tasks completed before today).', schema: new OA\Schema(type: 'boolean')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 30)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated cross-project task list', content: new OA\JsonContent(ref: '#/components/schemas/PaginatedResponse')),
        ],
    )]
    public function allForUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'string|in:backlog,pending,in_progress,blocked,review,done',
            'assigned_to' => 'string',
            'priority' => 'string|in:low,medium,high,critical',
            'project_id' => 'uuid',
            'include_all' => 'boolean',
        ]);

        // Scope to the user's ACTIVE (non-archived) projects only — archived
        // projects drop out of the cross-project board like they do the sidebar.
        $projectIds = $request->user()->sharedProjects()->active()->pluck('id');

        if (isset($validated['project_id'])) {
            // Honour the filter only when the project is actually one of the
            // user's active projects (prevents cross-tenant peeking via an id).
            $projectIds = $projectIds->contains($validated['project_id'])
                ? collect([$validated['project_id']])
                : collect();
        }

        $query = SharedTask::whereIn('project_id', $projectIds)
            ->orderBy('created_at', 'desc');

        if (isset($validated['status'])) {
            $query->byStatus($validated['status']);
        }

        if (isset($validated['assigned_to'])) {
            $query->assignedTo($validated['assigned_to']);
        }

        if (isset($validated['priority'])) {
            $query->byPriority($validated['priority']);
        }

        // Tasks under an archived epic are hidden from the cross-project board
        // too — there is no epic_id filter here, so it is unconditional.
        $query->excludingArchivedEpics();

        // Same default visibility as the per-project index: focus on in-progress
        // tasks + those completed today, unless narrowed by status or overridden.
        if (! isset($validated['status']) && ! $request->boolean('include_all')) {
            $query->defaultVisible();
        }

        $tasks = $query->paginate($request->input('per_page', 30));

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
        broadcast(new TaskCreated($task))->toOthers();

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

        // Remember the prior links so a task moved out of an epic/sprint also
        // reconciles the one it left, not just the one it joins.
        $previousEpicId = $task->epic_id;
        $previousSprintId = $task->sprint_id;

        $task->update($validated);

        // Manually editing a task's status/epic/sprint must heal the hierarchy
        // exactly like the worker `complete()` path — otherwise a task ticked
        // `done` here leaves its sprint and epic frozen.
        if (array_intersect_key($validated, array_flip(['status', 'epic_id', 'sprint_id']))) {
            $this->cascadeTaskHierarchy(
                array_filter([$task->sprint_id, $previousSprintId]),
                array_filter([$task->epic_id, $previousEpicId]),
            );
        }

        return response()->json([
            'success' => true,
            'data' => new TaskResource($task->fresh()),
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
            return $this->errorResponse('TSK_002', 'Task already claimed by '.$task->assigned_to, 409);
        }

        if (! $task->hasDependenciesCompleted()) {
            return $this->errorResponse('TSK_003', 'Task dependencies not completed', 400);
        }

        $success = $task->claim($validated['instance_id']);

        if (! $success) {
            return $this->errorResponse('TSK_002', 'Failed to claim task', 409);
        }

        // Progress proven — reset the worker-loop no-progress state.
        WorkerLoopService::resetNoProgress($validated['instance_id']);

        // Broadcast task claim
        broadcast(new TaskClaimed($task))->toOthers();

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

        if (! $task->is_claimed) {
            return $this->errorResponse('TSK_003', 'Task is not claimed', 400);
        }

        $task->release($validated['reason'] ?? null);

        // Broadcast task release
        broadcast(new TaskReleased($task))->toOthers();

        // Coordinator trigger: a task released 2+ times signals thrashing.
        // Best-effort — coordination must never break the release itself.
        try {
            $releaseCount = $task->project->activityLogs()
                ->where('type', 'task_released')
                ->where('details->task_id', $task->id)
                ->count();

            if ($releaseCount >= 2) {
                app(CoordinatorService::class)->reportIncident(
                    $task->project,
                    CoordinatorService::INCIDENT_TASK_THRASHING,
                    [
                        'task_id' => $task->id,
                        'task_title' => $task->title,
                        'release_count' => $releaseCount,
                        'reason' => $validated['reason'] ?? null,
                    ],
                );
            }
        } catch (Throwable $e) {
            Log::warning('Coordinator trigger failed on task release', [
                'task_id' => $task->id,
                'error' => $e->getMessage(),
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

        if (! $task->is_claimed) {
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

        // Progress proven — reset the worker-loop no-progress state.
        WorkerLoopService::resetNoProgress($validated['instance_id']);

        // Feed the LIVING project context: a searchable task_completion RAG
        // chunk + a refreshed rolling recent-changes log and current_focus.
        // Both surface to the next recycled worker via compileContext(), so the
        // global context stays alive instead of frozen at decomposition time.
        // Belt-and-suspenders best-effort: the service guards each side effect
        // internally, and this wrap keeps a future service bug from ever
        // failing the completion (the critical orchestration path).
        try {
            app(ContextRAGService::class)->recordTaskCompletion(
                $task->project,
                $task,
                $validated['summary'],
                $validated['files_modified'] ?? [],
                $validated['instance_id'],
            );
        } catch (Throwable $e) {
            Log::warning('Task completion living-context ingestion failed', [
                'task_id' => $task->id,
                'project_id' => $task->project_id,
                'error' => $e->getMessage(),
            ]);
        }

        // Broadcast task completion (scalar payload, see TaskCompleted::broadcastWith).
        broadcast(new TaskCompleted($task))->toOthers();

        // Cascade the task → sprint → epic status chain. Completing a task may
        // have been the last one needed for its sprint to reach `completed`,
        // which in turn may be the last open sprint blocking its epic from
        // `done` (see Sprint/Epic::recomputeStatus). Self-healing & idempotent.
        $this->cascadeTaskHierarchy(
            array_filter([$task->sprint_id]),
            array_filter([$task->epic_id]),
        );

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

        if (! $task) {
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

        if (! $project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $validated = $request->validate([
            'instance_id' => 'required|string',
        ]);

        $task = SharedTask::claimNextAvailable($projectId, $validated['instance_id']);

        if (! $task) {
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

        broadcast(new TaskClaimed($task))->toOthers();

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

        $previousEpicId = $task->epic_id;
        $previousSprintId = $task->sprint_id;

        $task->update($validated);

        // Moving a task across epics/sprints or flipping its status reconciles
        // both the source and destination hierarchy.
        if (array_intersect_key($validated, array_flip(['status', 'epic_id', 'sprint_id']))) {
            $this->cascadeTaskHierarchy(
                array_filter([$task->sprint_id, $previousSprintId]),
                array_filter([$task->epic_id, $previousEpicId]),
            );
        }

        return response()->json([
            'success' => true,
            'data' => new TaskResource($task->fresh()),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Self-heal the task → sprint → epic status chain after a task mutation.
     *
     * Sprints are recomputed BEFORE epics because {@see Epic::recomputeStatus()}
     * reads the live status of the sprints its tasks belong to — an epic only
     * reaches `done` once every referenced sprint is completed/cancelled. Each
     * id set carries the union of the task's previous and current links so a
     * task moved out of an epic/sprint also reconciles the one it left.
     *
     * Best-effort: the triggering mutation is already persisted and must never
     * be broken by a reconciliation failure.
     *
     * @param  array<int, string>  $sprintIds  Non-null sprint ids to reconcile.
     * @param  array<int, string>  $epicIds  Non-null epic ids to reconcile.
     */
    private function cascadeTaskHierarchy(array $sprintIds, array $epicIds): void
    {
        try {
            Sprint::whereIn('id', array_values(array_unique($sprintIds)))
                ->get()
                ->each(function (Sprint $sprint): void {
                    if ($sprint->recomputeStatus()) {
                        broadcast(new SprintUpdated($sprint->fresh(), 'updated'))->toOthers();
                    }
                });

            Epic::whereIn('id', array_values(array_unique($epicIds)))
                ->get()
                ->each(function (Epic $epic): void {
                    if ($epic->recomputeStatus()) {
                        broadcast(new EpicUpdated($epic->fresh(), 'updated'))->toOthers();
                    }
                });
        } catch (Throwable $e) {
            Log::warning('Task hierarchy cascade failed', [
                'sprint_ids' => $sprintIds,
                'epic_ids' => $epicIds,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
