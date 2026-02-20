<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Services\AgentGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    /**
     * List projects for a machine.
     *
     * @OA\Get(
     *     path="/api/machines/{machineId}/projects",
     *     tags={"Projects"},
     *     summary="List projects for a machine",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="Machine UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="List of shared projects",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/SharedProject")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, description="Machine not found")
     * )
     */
    public function index(Request $request, string $machineId): JsonResponse
    {
        $machine = $request->user()->machines()->find($machineId);

        if (!$machine) {
            return $this->errorResponse('MCH_001', 'Machine not found', 404);
        }

        $projects = $machine->sharedProjects()
            ->withCount([
                'claudeInstances as active_instances_count' => fn ($q) => $q->where('status', 'active'),
                'tasks as pending_tasks_count' => fn ($q) => $q->where('status', 'pending'),
            ])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(fn ($project) => $this->formatProject($project));

        return response()->json([
            'success' => true,
            'data' => $projects,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Create a new shared project.
     *
     * @OA\Post(
     *     path="/api/machines/{machineId}/projects",
     *     tags={"Projects"},
     *     summary="Create shared project",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="Machine UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/CreateProjectRequest")
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Project created",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/SharedProject")
     *         )
     *     ),
     *     @OA\Response(response=404, description="Machine not found"),
     *     @OA\Response(response=422, description="Validation error or project already exists for this path")
     * )
     */
    public function store(Request $request, string $machineId): JsonResponse
    {
        $machine = $request->user()->machines()->find($machineId);

        if (!$machine) {
            return $this->errorResponse('MCH_001', 'Machine not found', 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'project_path' => 'required|string|max:1024',
            'summary' => 'nullable|string',
            'architecture' => 'nullable|string',
            'conventions' => 'nullable|string',
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
            'settings' => $validated['settings'] ?? [],
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->formatProject($project),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Show project details.
     *
     * @OA\Get(
     *     path="/api/projects/{id}",
     *     tags={"Projects"},
     *     summary="Get project details",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Project UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Project details",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/SharedProject")
     *         )
     *     ),
     *     @OA\Response(response=404, description="Project not found")
     * )
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $project = $this->getUserProject($request, $id);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatProject($project, true),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Update project.
     *
     * @OA\Patch(
     *     path="/api/projects/{id}",
     *     tags={"Projects"},
     *     summary="Update project",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Project UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/UpdateProjectRequest")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Project updated",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/SharedProject")
     *         )
     *     ),
     *     @OA\Response(response=404, description="Project not found")
     * )
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $project = $this->getUserProject($request, $id);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

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
        if (!empty($updateData)) {
            $project->update($updateData);
        }

        if (isset($validated['settings'])) {
            foreach ($validated['settings'] as $key => $value) {
                $project->setSetting($key, $value);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatProject($project, true),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Delete project.
     *
     * @OA\Delete(
     *     path="/api/projects/{id}",
     *     tags={"Projects"},
     *     summary="Delete project",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Project UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Project deleted",
     *         @OA\JsonContent(ref="#/components/schemas/DeletedResponse")
     *     ),
     *     @OA\Response(response=404, description="Project not found")
     * )
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $project = $this->getUserProject($request, $id);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $project->delete();

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
     * Get project instances.
     *
     * @OA\Get(
     *     path="/api/projects/{id}/instances",
     *     tags={"Projects"},
     *     summary="List active Claude instances",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Project UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="List of Claude instances",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/ClaudeInstance")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, description="Project not found")
     * )
     */
    public function instances(Request $request, string $id): JsonResponse
    {
        $project = $this->getUserProject($request, $id);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

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

    /**
     * Get project activity log.
     *
     * @OA\Get(
     *     path="/api/projects/{id}/activity",
     *     tags={"Projects"},
     *     summary="Get activity log",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Project UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="limit",
     *         in="query",
     *         required=false,
     *         description="Maximum number of log entries to return",
     *         @OA\Schema(type="integer", default=50)
     *     ),
     *     @OA\Parameter(
     *         name="since",
     *         in="query",
     *         required=false,
     *         description="Return entries created after this datetime",
     *         @OA\Schema(type="string", format="date-time")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Activity log entries",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/ActivityLog")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, description="Project not found")
     * )
     */
    public function activity(Request $request, string $id): JsonResponse
    {
        $project = $this->getUserProject($request, $id);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

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

    /**
     * Broadcast message to all instances in project.
     *
     * @OA\Post(
     *     path="/api/projects/{id}/broadcast",
     *     tags={"Projects"},
     *     summary="Broadcast message to instances",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Project UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"message"},
     *             @OA\Property(property="message", type="string", description="Message to broadcast"),
     *             @OA\Property(
     *                 property="type",
     *                 type="string",
     *                 enum={"info", "warning", "error", "success"},
     *                 description="Message type"
     *             ),
     *             @OA\Property(
     *                 property="target_instances",
     *                 type="array",
     *                 @OA\Items(type="string"),
     *                 description="Optional list of instance IDs to target"
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Message broadcasted",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="message_id", type="string", description="Unique ID of the broadcast message"),
     *                 @OA\Property(property="broadcasted_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, description="Project not found")
     * )
     */
    public function broadcast(Request $request, string $id): JsonResponse
    {
        $project = $this->getUserProject($request, $id);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $validated = $request->validate([
            'message' => 'required|string',
            'type' => 'string|in:info,warning,error,success|default:info',
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
        broadcast(new \App\Events\ProjectBroadcast($project, $message, $validated['target_instances'] ?? null))->toOthers();

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

    /**
     * Get project stats.
     *
     * @OA\Get(
     *     path="/api/projects/{id}/stats",
     *     tags={"Projects"},
     *     summary="Get project statistics",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Project UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Project statistics",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="total_tasks", type="integer"),
     *                 @OA\Property(property="pending_tasks", type="integer"),
     *                 @OA\Property(property="completed_tasks", type="integer"),
     *                 @OA\Property(property="active_instances", type="integer"),
     *                 @OA\Property(property="context_chunks", type="integer"),
     *                 @OA\Property(property="active_locks", type="integer"),
     *                 @OA\Property(
     *                     property="token_usage",
     *                     type="object",
     *                     @OA\Property(property="current", type="integer"),
     *                     @OA\Property(property="max", type="integer"),
     *                     @OA\Property(property="percent", type="number", format="float")
     *                 ),
     *                 @OA\Property(property="activity_last_24h", type="integer")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, description="Project not found")
     * )
     */
    public function stats(Request $request, string $id): JsonResponse
    {
        $project = $this->getUserProject($request, $id);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

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

    // ==================== ORCHESTRATOR ====================

    /**
     * Start the orchestrator for a project.
     */
    public function startOrchestrator(Request $request, string $id): JsonResponse
    {
        $project = $this->getUserProject($request, $id);
        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $machine = $project->machine;
        if (!$machine || $machine->status !== 'online') {
            return $this->errorResponse('MACHINE_OFFLINE', 'Machine is not online', 422);
        }

        $validated = $request->validate([
            'min_workers' => 'integer|min:1|max:5',
            'max_workers' => 'integer|min:1|max:10',
            'poll_interval_ms' => 'integer|min:1000|max:60000',
        ]);

        $result = AgentGateway::sendAndWait($machine->id, 'orchestrator:start', [
            'projectId' => $project->id,
            'projectPath' => $project->project_path,
            'minWorkers' => $validated['min_workers'] ?? 1,
            'maxWorkers' => $validated['max_workers'] ?? 3,
            'pollIntervalMs' => $validated['poll_interval_ms'] ?? 5000,
        ], 15);

        if ($result === null) {
            return $this->errorResponse('AGENT_TIMEOUT', 'Agent did not respond in time', 504);
        }

        if (!empty($result['error'])) {
            return $this->errorResponse('ORCHESTRATOR_ERROR', $result['error'], 422);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Stop the orchestrator for a project.
     */
    public function stopOrchestrator(Request $request, string $id): JsonResponse
    {
        $project = $this->getUserProject($request, $id);
        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $machine = $project->machine;
        if (!$machine || $machine->status !== 'online') {
            return $this->errorResponse('MACHINE_OFFLINE', 'Machine is not online', 422);
        }

        AgentGateway::send($machine->id, 'orchestrator:stop', [
            'projectId' => $project->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => ['message' => 'Stop signal sent'],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Get orchestrator status for a project.
     */
    public function orchestratorStatus(Request $request, string $id): JsonResponse
    {
        $project = $this->getUserProject($request, $id);
        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $machine = $project->machine;
        if (!$machine || $machine->status !== 'online') {
            return response()->json([
                'success' => true,
                'data' => ['status' => 'offline', 'workers' => [], 'pendingTasks' => 0, 'completedTasks' => 0],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ]);
        }

        $result = AgentGateway::sendAndWait($machine->id, 'orchestrator:status', [
            'projectId' => $project->id,
        ], 5);

        if ($result === null) {
            return response()->json([
                'success' => true,
                'data' => ['status' => 'unknown', 'workers' => [], 'pendingTasks' => 0, 'completedTasks' => 0],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
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
     * Helper: Format project data.
     */
    private function formatProject(SharedProject $project, bool $detailed = false): array
    {
        $data = [
            'id' => $project->id,
            'machine_id' => $project->machine_id,
            'name' => $project->name,
            'project_path' => $project->project_path,
            'summary' => $project->summary,
            'token_usage_percent' => $project->token_usage_percent,
            'is_token_limit_reached' => $project->is_token_limit_reached,
            'active_instances_count' => $project->active_instances_count ?? 0,
            'pending_tasks_count' => $project->pending_tasks_count ?? 0,
            'settings' => $project->settings,
            'created_at' => $project->created_at,
            'updated_at' => $project->updated_at,
        ];

        if ($detailed) {
            $data['architecture'] = $project->architecture;
            $data['conventions'] = $project->conventions;
            $data['current_focus'] = $project->current_focus;
            $data['recent_changes'] = $project->recent_changes;
            $data['total_tokens'] = $project->total_tokens;
            $data['max_tokens'] = $project->max_tokens;
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
