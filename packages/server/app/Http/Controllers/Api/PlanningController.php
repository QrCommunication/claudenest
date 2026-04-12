<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SharedProject;
use App\Services\PlanningAgentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlanningController extends Controller
{
    public function __construct(
        private readonly PlanningAgentService $planningService,
    ) {}

    /**
     * Get full project context for the planning agent.
     */
    public function context(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('view', $project);

        return response()->json([
            'success' => true,
            'data' => $this->planningService->getProjectContext($project),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Execute a batch of planning actions atomically.
     */
    public function execute(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('update', $project);

        $validated = $request->validate([
            'actions'          => 'required|array|min:1',
            'actions.*.type'   => 'required|string|in:create_epic,create_task,create_sprint,update_task,move_task,decompose_task,start_sprint,complete_sprint',
            'actions.*.data'   => 'required|array',
        ]);

        $results = $this->planningService->executeActions($project, $validated['actions']);

        $project->logActivity('planning_executed', null, [
            'actions_count' => count($results),
            'actions' => collect($results)
                ->map(fn (array $r) => $r['type'] . ': ' . ($r['success'] ? 'ok' : 'failed'))
                ->toArray(),
        ]);

        return response()->json([
            'success' => true,
            'data' => ['results' => $results],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }
}
