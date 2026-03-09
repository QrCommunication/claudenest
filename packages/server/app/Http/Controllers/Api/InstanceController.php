<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClaudeInstance;
use App\Models\SharedProject;
use App\Services\OrchestratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstanceController extends Controller
{
    public function __construct(
        private OrchestratorService $orchestratorService,
    ) {}

    /**
     * Register (or reconnect) an instance to a project.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'instance_id' => 'required|string|max:255',
            'project_id' => 'required|uuid',
            'machine_id' => 'required|uuid',
            'session_id' => 'nullable|uuid',
        ]);

        // Verify project belongs to user
        $project = SharedProject::forUser($request->user()->id)
            ->where('id', $validated['project_id'])
            ->firstOrFail();

        $instance = $this->orchestratorService->registerInstance(
            $validated['instance_id'],
            $project->id,
            $validated['machine_id'],
            $validated['session_id'] ?? null,
        );

        return response()->json([
            'success' => true,
            'data' => $this->formatInstance($instance),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Heartbeat: update instance activity timestamp.
     */
    public function heartbeat(Request $request, string $instanceId): JsonResponse
    {
        $instance = $this->findOwnedInstance($request, $instanceId);

        $data = $request->validate([
            'context_tokens' => 'nullable|integer|min:0',
            'status' => 'nullable|string|in:idle,active,busy',
        ]);

        if (isset($data['context_tokens'])) {
            $instance->updateContextTokens($data['context_tokens']);
        }

        if (isset($data['status'])) {
            $instance->update(['status' => $data['status']]);
        }

        $instance->updateActivity();

        return response()->json([
            'success' => true,
            'data' => $this->formatInstance($instance->fresh()),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Disconnect an instance gracefully.
     */
    public function disconnect(Request $request, string $instanceId): JsonResponse
    {
        $instance = $this->findOwnedInstance($request, $instanceId);

        $this->orchestratorService->handleInstanceDisconnect($instanceId);

        return response()->json([
            'success' => true,
            'data' => ['disconnected' => true],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get instance details.
     */
    public function show(Request $request, string $instanceId): JsonResponse
    {
        $instance = $this->findOwnedInstance($request, $instanceId);

        return response()->json([
            'success' => true,
            'data' => $this->formatInstance($instance),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Auto-dispatch pending tasks to available instances.
     */
    public function dispatch(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::forUser($request->user()->id)
            ->where('id', $projectId)
            ->firstOrFail();

        $dispatched = $this->orchestratorService->autoDispatch($project->id);

        return response()->json([
            'success' => true,
            'data' => [
                'dispatched' => $dispatched,
                'count' => count($dispatched),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Get orchestration stats for a project.
     */
    public function orchestrationStats(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::forUser($request->user()->id)
            ->where('id', $projectId)
            ->firstOrFail();

        $stats = $this->orchestratorService->getProjectStats($project->id);

        return response()->json([
            'success' => true,
            'data' => $stats,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
            ],
        ]);
    }

    private function findOwnedInstance(Request $request, string $instanceId): ClaudeInstance
    {
        return ClaudeInstance::where('id', $instanceId)
            ->whereHas('project', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            })
            ->firstOrFail();
    }

    private function formatInstance(ClaudeInstance $instance): array
    {
        return [
            'id' => $instance->id,
            'project_id' => $instance->project_id,
            'machine_id' => $instance->machine_id,
            'session_id' => $instance->session_id,
            'status' => $instance->status,
            'current_task_id' => $instance->current_task_id,
            'context_tokens' => $instance->context_tokens,
            'max_context_tokens' => $instance->max_context_tokens,
            'context_usage_percent' => $instance->context_usage_percent,
            'tasks_completed' => $instance->tasks_completed,
            'is_connected' => $instance->is_connected,
            'connected_at' => $instance->connected_at?->toIso8601String(),
            'last_activity_at' => $instance->last_activity_at?->toIso8601String(),
        ];
    }
}
