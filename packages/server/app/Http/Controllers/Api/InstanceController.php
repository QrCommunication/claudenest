<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Events\InstanceUpdated;
use App\Http\Controllers\Controller;
use App\Http\Resources\InstanceResource;
use App\Models\ClaudeInstance;
use App\Models\FileLock;
use App\Models\SharedProject;
use App\Services\OrchestratorService;
use App\Services\WorkerLoopService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
            'data' => new InstanceResource($instance),
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
            $statusChanged = $instance->status !== $data['status'];
            $instance->update(['status' => $data['status']]);

            if ($statusChanged) {
                event(new InstanceUpdated($instance));
            }
        }

        $instance->updateActivity();

        // Self-heal: a heartbeat proves the worker is alive. If its
        // session:status 'running' update was lost (e.g. a transient agent WS
        // drop), the session can be stuck at 'created'/'starting' — which the
        // dashboard shows as not-connected. Promote it so the UI and the
        // orchestration loop see a live worker.
        $instanceSession = $instance->session;
        if ($instanceSession && in_array($instanceSession->status, ['created', 'starting'], true)) {
            $instanceSession->markAsRunning();
        }

        // Auto-extend file locks held by this instance
        $locksExtended = 0;
        if ($instance->project_id) {
            $locksExtended = FileLock::extendByInstance(
                $instance->project_id,
                $instanceId
            );
        }

        // Worker loop tick (Stop hook → idle): nudge/recycle/pause/scale-down
        // orchestrated workers. Fail-safe — must never break the heartbeat.
        if (($data['status'] ?? null) === 'idle') {
            try {
                app(WorkerLoopService::class)->onIdle($instance->fresh());
            } catch (\Throwable $e) {
                Log::warning('Worker loop tick failed on idle heartbeat', [
                    'instance_id' => $instanceId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'data' => array_merge((new InstanceResource($instance->fresh()))->resolve(), [
                'locks_extended' => $locksExtended,
            ]),
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
            'data' => new InstanceResource($instance),
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
}
