<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Events\SessionCreated;
use App\Http\Controllers\Controller;
use App\Http\Resources\SessionResource;
use App\Models\Session;
use App\Models\SharedProject;
use App\Services\AgentGateway;
use App\Services\PlanningAgentService;
use App\Services\SessionPayloadBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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

    /**
     * Spawn an interactive planning agent session on the project's machine.
     *
     * Same session:create mechanics as SessionController::store / WorkerPool
     * spawnWorker, but NOT orchestrated (a human drives it from the terminal):
     * the scoped token gains the 'planning' ability (epics/sprints/task
     * edition via RestrictScopedTokens) and the system prompt is the planner
     * role + backlog stats instead of the default worker prompt.
     */
    public function createSession(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('update', $project);

        $validated = $request->validate([
            'brief' => 'required|string|max:4000',
            'credential_id' => [
                'nullable',
                'uuid',
                Rule::exists('claude_credentials', 'id')->where('user_id', $request->user()->id),
            ],
        ]);

        $machine = $project->machine;
        if (!$machine || $machine->status !== 'online') {
            return $this->errorResponse('MCH_002', 'Machine is offline', 400);
        }

        $user = $request->user();

        // Per-plan concurrent agent cap — same rule as SessionController::store.
        $cap = $user->concurrentAgentCap();
        if ($cap !== null) {
            $activeSessions = Session::forUser($user->id)->active()->count();

            if ($activeSessions >= $cap) {
                return $this->errorResponse(
                    'PLAN_001',
                    "Your plan allows at most {$cap} concurrent Claude sessions. Terminate a session or upgrade your plan.",
                    403,
                );
            }
        }

        /** @var Session $session */
        $session = Session::create([
            'machine_id' => $machine->id,
            'user_id' => $user->id,
            'shared_project_id' => $project->id,
            'mode' => 'interactive',
            'project_path' => $project->project_path,
            'initial_prompt' => $validated['brief'],
            'credential_id' => $validated['credential_id']
                ?? $user->credentials()->default()->first()?->id,
            'status' => 'created',
            'orchestrated' => false,
        ]);

        $payload = app(SessionPayloadBuilder::class)->build(
            $session,
            $project,
            'default',
            extraAbilities: ['planning'],
            systemPromptOverride: $this->planningService->buildPlannerSystemPrompt($project),
        );

        // Agent payload (camelCase contract) — mcpEnv carries the scoped token:
        // agent-only via AgentGateway, NEVER broadcast nor in resources.
        AgentGateway::send($machine->id, 'session:create', $payload);

        broadcast(new SessionCreated($session))->toOthers();

        $project->logActivity('planning_session_created', null, [
            'session_id' => $session->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => new SessionResource($session),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }
}
