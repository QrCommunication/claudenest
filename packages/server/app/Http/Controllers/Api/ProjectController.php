<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Events\ProjectBroadcast;
use App\Exceptions\WorkerPoolException;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\SessionResource;
use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Services\ContextRAGService;
use App\Services\WorkerPoolService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use OpenApi\Attributes as OA;

class ProjectController extends Controller
{
    public function __construct(
        private ContextRAGService $contextRAGService,
    ) {}

    /** List projects for a machine. */
    #[OA\Get(
        path: '/api/machines/{machineId}/projects',
        summary: 'List projects for a machine',
        security: [['bearerAuth' => []]],
        tags: ['Projects'],
        parameters: [
            new OA\Parameter(
                name: 'machineId',
                in: 'path',
                required: true,
                description: 'Machine UUID',
                schema: new OA\Schema(type: 'string', format: 'uuid'),
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of shared projects',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(ref: '#/components/schemas/SharedProject'),
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 404, description: 'Machine not found'),
        ],
    )]
    public function index(Request $request, string $machineId): JsonResponse
    {
        $machine = Machine::findOrFail($machineId);
        $this->authorize('view', $machine);

        $projects = $machine->sharedProjects()
            ->withCount([
                'claudeInstances as active_instances_count' => fn ($q) => $q->where('status', 'active'),
                'tasks as pending_tasks_count' => fn ($q) => $q->where('status', 'pending'),
            ])
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => ProjectResource::collection($projects),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Create a new shared project. */
    #[OA\Post(
        path: '/api/machines/{machineId}/projects',
        summary: 'Create shared project',
        security: [['bearerAuth' => []]],
        tags: ['Projects'],
        parameters: [
            new OA\Parameter(
                name: 'machineId',
                in: 'path',
                required: true,
                description: 'Machine UUID',
                schema: new OA\Schema(type: 'string', format: 'uuid'),
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/CreateProjectRequest'),
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Project created',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', ref: '#/components/schemas/SharedProject'),
                    ],
                ),
            ),
            new OA\Response(response: 404, description: 'Machine not found'),
            new OA\Response(response: 422, description: 'Validation error or project already exists for this path'),
        ],
    )]
    public function store(Request $request, string $machineId): JsonResponse
    {
        $machine = Machine::findOrFail($machineId);
        $this->authorize('view', $machine);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'project_path' => 'required|string|max:1024',
            'summary' => 'nullable|string',
            'architecture' => 'nullable|string',
            'conventions' => 'nullable|string',
            'current_focus' => 'nullable|string',
            'settings' => 'array',
        ]);

        // Check if project already exists for this machine and path
        $existing = $machine->sharedProjects()
            ->where('project_path', $validated['project_path'])
            ->first();

        if ($existing) {
            return $this->errorResponse('VAL_001', 'Project already exists for this path', 422);
        }

        $project = $machine->sharedProjects()->create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'project_path' => $validated['project_path'],
            'summary' => $validated['summary'] ?? '',
            'architecture' => $validated['architecture'] ?? '',
            'conventions' => $validated['conventions'] ?? '',
            'current_focus' => $validated['current_focus'] ?? '',
            'settings' => $validated['settings'] ?? [],
        ]);

        $this->seedContextChunks($project, $validated);

        return response()->json([
            'success' => true,
            'data' => new ProjectResource($project),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Seed the RAG store with one chunk per non-empty context section so the
     * AI-generated project context is immediately searchable by instances.
     * Best-effort: a RAG failure must never block project creation.
     *
     * @param  array<string, mixed>  $validated
     */
    private function seedContextChunks(SharedProject $project, array $validated): void
    {
        $sections = [
            'summary' => $validated['summary'] ?? '',
            'architecture' => $validated['architecture'] ?? '',
            'conventions' => $validated['conventions'] ?? '',
            'current_focus' => $validated['current_focus'] ?? '',
        ];

        foreach ($sections as $type => $content) {
            $content = trim((string) $content);

            if ($content === '') {
                continue;
            }

            try {
                $this->contextRAGService->addContext($project, $content, $type, [
                    'importance_score' => 0.8,
                ]);
            } catch (\Throwable $e) {
                Log::warning('Failed to seed project context chunk', [
                    'project_id' => $project->id,
                    'type' => $type,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /** Show project details. */
    #[OA\Get(
        path: '/api/projects/{id}',
        summary: 'Get project details',
        security: [['bearerAuth' => []]],
        tags: ['Projects'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'Project UUID',
                schema: new OA\Schema(type: 'string', format: 'uuid'),
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Project details',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', ref: '#/components/schemas/SharedProject'),
                    ],
                ),
            ),
            new OA\Response(response: 404, description: 'Project not found'),
        ],
    )]
    public function show(Request $request, string $id): JsonResponse
    {
        $project = SharedProject::findOrFail($id);
        $this->authorize('view', $project);

        return response()->json([
            'success' => true,
            'data' => ProjectResource::detailed($project),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Update project. */
    #[OA\Patch(
        path: '/api/projects/{id}',
        summary: 'Update project',
        security: [['bearerAuth' => []]],
        tags: ['Projects'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'Project UUID',
                schema: new OA\Schema(type: 'string', format: 'uuid'),
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/UpdateProjectRequest'),
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Project updated',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', ref: '#/components/schemas/SharedProject'),
                    ],
                ),
            ),
            new OA\Response(response: 404, description: 'Project not found'),
        ],
    )]
    public function update(Request $request, string $id): JsonResponse
    {
        $project = SharedProject::findOrFail($id);
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'summary' => 'nullable|string',
            'architecture' => 'nullable|string',
            'conventions' => 'nullable|string',
            'current_focus' => 'nullable|string',
            'recent_changes' => 'nullable|string',
            'max_tokens' => 'integer|min:1000|max:128000',
            'settings' => 'array',
        ]);

        $updateData = array_diff_key($validated, array_flip(['settings']));
        if (! empty($updateData)) {
            $project->update($updateData);
        }

        if (isset($validated['settings'])) {
            foreach ($validated['settings'] as $key => $value) {
                $project->setSetting($key, $value);
            }
        }

        return response()->json([
            'success' => true,
            'data' => ProjectResource::detailed($project),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Delete project. */
    #[OA\Delete(
        path: '/api/projects/{id}',
        summary: 'Delete project',
        security: [['bearerAuth' => []]],
        tags: ['Projects'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'Project UUID',
                schema: new OA\Schema(type: 'string', format: 'uuid'),
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Project deleted',
                content: new OA\JsonContent(ref: '#/components/schemas/DeletedResponse'),
            ),
            new OA\Response(response: 404, description: 'Project not found'),
        ],
    )]
    public function destroy(Request $request, string $id): JsonResponse
    {
        $project = SharedProject::find($id);

        // Idempotent delete: a project that is already gone (concurrent tab,
        // double-click, prior cascade) returns success so the client ALWAYS
        // purges it from its store/sidebar instead of getting stuck on a 404
        // and leaving the stale project displayed. DELETE is idempotent per
        // the HTTP spec; an absent row leaks nothing (same response shape as
        // a successful delete). See memory/audit-sharedproject-deletion.md.
        if ($project === null) {
            return $this->deletedResponse($request);
        }

        $this->authorize('delete', $project);

        // Hard delete + PostgreSQL onDelete('cascade') purge every child row
        // (context_chunks, shared_tasks, claude_instances, file_locks,
        // activity_log, epics, sprints); claude_sessions are set null. No
        // SoftDeletes, so index() never returns this row again.
        $project->delete();

        // NOTE: real-time fan-out (ProjectDeleted broadcast over Reverb) is
        // wired by the sibling "Broadcast événement suppression projet" task,
        // which captures the scalar identifiers BEFORE this delete() call.

        return $this->deletedResponse($request);
    }

    /** Standard "resource deleted" envelope shared by destroy paths. */
    private function deletedResponse(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => null,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Get project instances. */
    #[OA\Get(
        path: '/api/projects/{id}/instances',
        summary: 'List active Claude instances',
        security: [['bearerAuth' => []]],
        tags: ['Projects'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'Project UUID',
                schema: new OA\Schema(type: 'string', format: 'uuid'),
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of Claude instances',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(ref: '#/components/schemas/ClaudeInstance'),
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 404, description: 'Project not found'),
        ],
    )]
    public function instances(Request $request, string $id): JsonResponse
    {
        $project = SharedProject::findOrFail($id);
        $this->authorize('view', $project);

        $instances = $project->claudeInstances()
            ->with('currentTask')
            ->orderBy('connected_at', 'desc')
            ->get()
            ->map(fn ($instance) => [
                'id' => $instance->id,
                'status' => $instance->status,
                'is_connected' => $instance->is_connected,
                'is_available' => $instance->is_available,
                'context_tokens' => $instance->context_tokens,
                'context_usage_percent' => $instance->context_usage_percent,
                'max_context_tokens' => $instance->max_context_tokens,
                'tasks_completed' => $instance->tasks_completed,
                'current_task' => $instance->currentTask ? [
                    'id' => $instance->currentTask->id,
                    'title' => $instance->currentTask->title,
                ] : null,
                'uptime' => $instance->uptime,
                'connected_at' => $instance->connected_at,
                'last_activity_at' => $instance->last_activity_at,
            ]);

        return response()->json([
            'success' => true,
            'data' => $instances,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** List sessions attached to a shared project (workspace terminals). */
    #[OA\Get(
        path: '/api/projects/{id}/sessions',
        summary: 'List sessions of a shared project',
        security: [['bearerAuth' => []]],
        tags: ['Projects'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'Project UUID',
                schema: new OA\Schema(type: 'string', format: 'uuid'),
            ),
            new OA\Parameter(
                name: 'status',
                in: 'query',
                required: false,
                description: 'Comma-separated list of session statuses to keep (e.g. "running,waiting_input")',
                schema: new OA\Schema(type: 'string'),
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Sessions attached to the project',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(ref: '#/components/schemas/Session'),
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 404, description: 'Project not found'),
        ],
    )]
    public function sessions(Request $request, string $id): JsonResponse
    {
        $project = SharedProject::findOrFail($id);
        $this->authorize('view', $project);

        $validated = $request->validate([
            'status' => 'sometimes|string|max:255',
        ]);

        $query = Session::where('shared_project_id', $project->id)
            ->with('machine')
            ->orderByDesc('created_at');

        if (! empty($validated['status'])) {
            $statuses = array_values(array_intersect(
                array_map('trim', explode(',', $validated['status'])),
                Session::STATUSES,
            ));

            if ($statuses !== []) {
                $query->whereIn('status', $statuses);
            }
        }

        return response()->json([
            'success' => true,
            'data' => SessionResource::collection($query->get()),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Get project activity log. */
    #[OA\Get(
        path: '/api/projects/{id}/activity',
        summary: 'Get activity log',
        security: [['bearerAuth' => []]],
        tags: ['Projects'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'Project UUID',
                schema: new OA\Schema(type: 'string', format: 'uuid'),
            ),
            new OA\Parameter(
                name: 'limit',
                in: 'query',
                required: false,
                description: 'Maximum number of log entries to return',
                schema: new OA\Schema(type: 'integer', default: 50),
            ),
            new OA\Parameter(
                name: 'since',
                in: 'query',
                required: false,
                description: 'Return entries created after this datetime',
                schema: new OA\Schema(type: 'string', format: 'date-time'),
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Activity log entries',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(ref: '#/components/schemas/ActivityLog'),
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 404, description: 'Project not found'),
        ],
    )]
    public function activity(Request $request, string $id): JsonResponse
    {
        $project = SharedProject::findOrFail($id);
        $this->authorize('view', $project);

        $limit = $request->input('limit', 50);
        $since = $request->input('since');

        $query = $project->activityLogs()->orderBy('created_at', 'desc');

        if ($since) {
            $query->where('created_at', '>', $since);
        }

        $activity = $query->limit($limit)->get()->map(fn ($log) => [
            'id' => $log->id,
            'type' => $log->type,
            'message' => $log->message,
            'icon' => $log->icon,
            'color' => $log->color,
            'instance_id' => $log->instance_id,
            'details' => $log->details,
            'created_at' => $log->created_at,
        ]);

        return response()->json([
            'success' => true,
            'data' => $activity,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Broadcast message to all instances in project. */
    #[OA\Post(
        path: '/api/projects/{id}/broadcast',
        summary: 'Broadcast message to instances',
        security: [['bearerAuth' => []]],
        tags: ['Projects'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'Project UUID',
                schema: new OA\Schema(type: 'string', format: 'uuid'),
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['message'],
                properties: [
                    new OA\Property(property: 'message', type: 'string', description: 'Message to broadcast'),
                    new OA\Property(
                        property: 'type',
                        type: 'string',
                        description: 'Message type',
                        enum: ['info', 'warning', 'error', 'success'],
                    ),
                    new OA\Property(
                        property: 'target_instances',
                        type: 'array',
                        description: 'Optional list of instance IDs to target',
                        items: new OA\Items(type: 'string'),
                    ),
                ],
            ),
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Message broadcasted',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'message_id', type: 'string', description: 'Unique ID of the broadcast message'),
                                new OA\Property(property: 'broadcasted_at', type: 'string', format: 'date-time'),
                            ],
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 404, description: 'Project not found'),
        ],
    )]
    public function broadcast(Request $request, string $id): JsonResponse
    {
        $project = SharedProject::findOrFail($id);
        $this->authorize('update', $project);

        $validated = $request->validate([
            'message' => 'required|string',
            'type' => 'sometimes|string|in:info,warning,error,success',
            'target_instances' => 'array',
        ]);

        $message = [
            'id' => uniqid(),
            'type' => $validated['type'] ?? 'info',
            'message' => $validated['message'],
            'sender_id' => $request->user()->id,
            'sender_name' => $request->user()->name,
            'timestamp' => now()->toIso8601String(),
        ];

        // Log activity
        $project->logActivity('broadcast', null, $message);

        // Broadcast to instances
        broadcast(new ProjectBroadcast($project, $message, $validated['target_instances'] ?? null))->toOthers();

        return response()->json([
            'success' => true,
            'data' => [
                'message_id' => $message['id'],
                'broadcasted_at' => $message['timestamp'],
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Get project stats. */
    #[OA\Get(
        path: '/api/projects/{id}/stats',
        summary: 'Get project statistics',
        security: [['bearerAuth' => []]],
        tags: ['Projects'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'Project UUID',
                schema: new OA\Schema(type: 'string', format: 'uuid'),
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Project statistics',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'total_tasks', type: 'integer'),
                                new OA\Property(property: 'pending_tasks', type: 'integer'),
                                new OA\Property(property: 'completed_tasks', type: 'integer'),
                                new OA\Property(property: 'active_instances', type: 'integer'),
                                new OA\Property(property: 'context_chunks', type: 'integer'),
                                new OA\Property(property: 'active_locks', type: 'integer'),
                                new OA\Property(
                                    property: 'token_usage',
                                    type: 'object',
                                    properties: [
                                        new OA\Property(property: 'current', type: 'integer'),
                                        new OA\Property(property: 'max', type: 'integer'),
                                        new OA\Property(property: 'percent', type: 'number', format: 'float'),
                                    ],
                                ),
                                new OA\Property(property: 'activity_last_24h', type: 'integer'),
                            ],
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 404, description: 'Project not found'),
        ],
    )]
    public function stats(Request $request, string $id): JsonResponse
    {
        $project = SharedProject::findOrFail($id);
        $this->authorize('view', $project);

        $stats = [
            'total_tasks' => $project->tasks()->count(),
            'pending_tasks' => $project->tasks()->where('status', 'pending')->count(),
            'completed_tasks' => $project->tasks()->where('status', 'done')->count(),
            'active_instances' => $project->claudeInstances()->whereNull('disconnected_at')->count(),
            'context_chunks' => $project->contextChunks()->count(),
            'active_locks' => $project->fileLocks()->where('expires_at', '>', now())->count(),
            'token_usage' => [
                'current' => $project->total_tokens,
                'max' => $project->max_tokens,
                'percent' => $project->token_usage_percent,
            ],
            'activity_last_24h' => $project->activityLogs()
                ->where('created_at', '>', now()->subHours(24))
                ->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    // ==================== ORCHESTRATOR (server-driven worker pool) ====================

    /**
     * Start orchestration: the SERVER spawns interactive worker sessions
     * (WorkerPoolService) — the loop is driven by idle heartbeats, no
     * agent-side orchestrator anymore.
     */
    public function startOrchestrator(Request $request, WorkerPoolService $workerPool, string $id): JsonResponse
    {
        $project = $this->getUserProject($request, $id);
        if (! $project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $validated = $request->validate([
            'max_workers' => 'integer|min:1|max:10',
            'permission_mode' => 'nullable|in:default,plan,acceptEdits,bypassPermissions',
            'coordinator' => 'nullable|boolean',
        ]);

        // bypassPermissions is the explicit, operator-chosen default for
        // unattended workers (see WorkerPoolService::DEFAULT_PERMISSION_MODE).
        // Tradeoff accepted by the project owner; sandbox the workers (container
        // /VM) if stricter isolation is ever required.
        try {
            $status = $workerPool->start(
                $project,
                $request->user(),
                (int) ($validated['max_workers'] ?? 3),
                $validated['permission_mode'] ?? WorkerPoolService::DEFAULT_PERMISSION_MODE,
                (bool) ($validated['coordinator'] ?? true),
            );
        } catch (WorkerPoolException $e) {
            return $this->errorResponse($e->errorCode, $e->getMessage(), $e->httpStatus);
        }

        return response()->json([
            'success' => true,
            'data' => $status,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Stop orchestration: mark the state inactive and terminate every
     * orchestrated worker session. Works even if the machine is offline
     * (terminate messages expire in the agent queue).
     */
    public function stopOrchestrator(Request $request, WorkerPoolService $workerPool, string $id): JsonResponse
    {
        $project = $this->getUserProject($request, $id);
        if (! $project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $workerPool->stop($project);

        return response()->json([
            'success' => true,
            'data' => ['message' => 'Orchestrator stopped', 'status' => 'stopped'],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Orchestrator status — pure DB read (orchestrated sessions, instances,
     * task counters, persisted settings). No agent round-trip.
     */
    public function orchestratorStatus(Request $request, WorkerPoolService $workerPool, string $id): JsonResponse
    {
        $project = $this->getUserProject($request, $id);
        if (! $project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        return response()->json([
            'success' => true,
            'data' => $workerPool->status($project),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Helper: Get project belonging to authenticated user.
     */
    protected function getUserProject(Request $request, string $id): ?SharedProject
    {
        return SharedProject::forUser($request->user()->id)->find($id);
    }
}
