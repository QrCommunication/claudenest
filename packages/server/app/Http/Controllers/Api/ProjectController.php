<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Models\SharedProject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    /**
     * List projects for a machine.
     */
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
     */
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
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $project = SharedProject::findOrFail($id);
        $this->authorize('view', $project);

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
     */
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
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $project = SharedProject::findOrFail($id);
        $this->authorize('delete', $project);

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
     */
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

    /**
     * Get project activity log.
     */
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

    /**
     * Broadcast message to all instances in project.
     */
    public function broadcast(Request $request, string $id): JsonResponse
    {
        $project = SharedProject::findOrFail($id);
        $this->authorize('update', $project);

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
     */
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
