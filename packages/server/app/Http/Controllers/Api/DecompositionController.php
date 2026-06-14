<?php

namespace App\Http\Controllers\Api;

use App\Events\SessionCreated;
use App\Events\SessionTerminated;
use App\Http\Controllers\Controller;
use App\Models\ClaudeCredential;
use App\Models\ClaudeInstance;
use App\Models\Session;
use App\Models\SharedProject;
use App\Services\AgentGateway;
use App\Services\CredentialService;
use App\Services\DecompositionService;
use App\Services\DecompositionStreamService;
use App\Services\MultiAgentSessionService;
use App\Services\SessionPayloadBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Throwable;

class DecompositionController extends Controller
{
    /**
     * Decomposition runs as an interactive session (subscription, no `claude -p`),
     * scoped to a single extra ability so the only thing it can do on the API is
     * submit its plan via the `submit_master_plan` MCP tool. Sandboxed like a
     * worker (read-all, writes confined to the project).
     */
    private const DECOMPOSE_ABILITY = 'decompose';

    public function __construct(
        private DecompositionService $decompositionService,
        private CredentialService $credentialService,
        private DecompositionStreamService $decompositionStream,
        private SessionPayloadBuilder $payloadBuilder,
        private MultiAgentSessionService $multiAgentSessionService,
    ) {}

    /**
     * Launch PRD decomposition as an INTERACTIVE session (async).
     *
     * The decomposition runs on the user's subscription — a normal interactive
     * Claude session (NOT `claude -p`/print mode, which risks separate metering).
     * The session is scoped with the `decompose` ability and an MCP env, then
     * returns its result by calling the `submit_master_plan` tool (see
     * submitFromAgent) rather than printing JSON to stdout.
     *
     * POST /api/projects/{project}/decompose
     */
    public function decompose(Request $request, SharedProject $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Project does not belong to you', 403);
        }

        $validated = $request->validate([
            'prd' => 'required|string|min:20|max:50000',
            'credential_id' => [
                'required',
                'uuid',
                Rule::exists('claude_credentials', 'id')->where('user_id', $request->user()->id),
            ],
        ]);

        $credential = ClaudeCredential::where('id', $validated['credential_id'])
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $credential) {
            return $this->errorResponse('CREDENTIAL_NOT_FOUND', 'Credential not found', 404);
        }

        // Validate the credential is usable (OAuth fresh / API key present) before
        // spawning — surfaces a clean 422 instead of a session that 401s on boot.
        try {
            $this->credentialService->getSessionEnv($credential);
        } catch (\RuntimeException $e) {
            return $this->errorResponse('CREDENTIAL_ERROR', $e->getMessage(), 422);
        }

        $machine = $project->machine;
        if (! $machine || $machine->status !== 'online') {
            return $this->errorResponse('MACHINE_OFFLINE', 'Machine is not online', 422);
        }

        // Persist the PRD + release the one-result-per-run lock so this run can
        // emit its decompose:result (see DecompositionStreamService).
        $project->update(['prd' => $validated['prd']]);
        $this->decompositionStream->reset($project->id);

        $scanResult = $project->settings['scan_result'] ?? null;
        $systemPrompt = $this->decompositionService->buildDecompositionSystemPrompt(
            $validated['prd'],
            $scanResult,
        );

        // Ephemeral interactive session: instance + scoped token (decompose
        // ability) + MCP env, exactly like a worker/coordinator. bypassPermissions
        // so it never stalls calling its MCP tool; the system prompt forbids edits
        // and the bwrap sandbox confines any write to the project as a safety net.
        $session = Session::create([
            'machine_id' => $project->machine_id,
            'user_id' => $project->user_id,
            'shared_project_id' => $project->id,
            'mode' => 'interactive',
            'project_path' => $project->project_path,
            'initial_prompt' => 'Decompose the PRD in your instructions into a master plan, '
                .'then submit it with the submit_master_plan tool. Do not edit any files.',
            'credential_id' => $credential->id,
            'status' => 'created',
            'orchestrated' => false,
        ]);

        $payload = $this->payloadBuilder->build(
            $session,
            $project,
            'bypassPermissions',
            extraAbilities: [self::DECOMPOSE_ABILITY],
            systemPromptOverride: $systemPrompt,
        );

        AgentGateway::send($machine->id, 'session:create', $payload);
        broadcast(new SessionCreated($session))->toOthers();

        return response()->json([
            'success' => true,
            'data' => [
                'status' => 'decomposing',
                'session_id' => $session->id,
                'message' => 'Decomposition session started. The plan will arrive via WebSocket.',
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Receive the master plan from a decomposition session's `submit_master_plan`
     * MCP tool. Validates + stores the plan, broadcasts decompose:result (the
     * finalize path the wizard awaits), and tears the session down.
     *
     * Hit by the session's scoped token (decompose ability) — see
     * RestrictScopedTokens.
     *
     * POST /api/projects/{project}/decompose/submit
     */
    public function submitFromAgent(Request $request, SharedProject $project): JsonResponse
    {
        $validated = $request->validate([
            'master_plan' => 'required|array',
            'master_plan.version' => 'required|integer|in:1',
            'master_plan.waves' => 'required|array|min:1',
            'master_plan.waves.*.name' => 'required|string',
            'master_plan.waves.*.tasks' => 'required|array|min:1',
            'master_plan.waves.*.tasks.*.title' => 'required|string',
        ]);

        $validation = $this->decompositionService->validateMasterPlan($validated['master_plan']);
        if (! $validation['valid']) {
            return $this->errorResponse(
                'INVALID_PLAN',
                'Master plan validation failed: '.implode('; ', $validation['errors']),
                422,
            );
        }

        // Store master_plan + broadcast decompose:result (same finalize the old
        // agent stdout-result used). The wizard refetches the plan on the signal.
        $this->decompositionStream->completeFromAgentResult($project, [
            'success' => true,
            'plan' => $validation['plan'],
        ]);

        // The session has done its single job — tear it down so it never lingers.
        $this->teardownDecomposeSession($request);

        $waves = $validation['plan']['waves'] ?? [];
        $taskCount = array_sum(array_map(fn ($w) => count($w['tasks'] ?? []), $waves));

        return response()->json([
            'success' => true,
            'data' => [
                'status' => 'submitted',
                'waves' => count($waves),
                'created' => $taskCount,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Terminate the decomposition session that submitted the plan. Resolved via
     * the MCP instance header (X-Instance-ID). Best-effort — a failed teardown
     * must never fail the submit (the plan is already stored + broadcast).
     */
    private function teardownDecomposeSession(Request $request): void
    {
        try {
            $instanceId = (string) $request->header('X-Instance-ID', '');
            if ($instanceId === '') {
                return;
            }

            $session = ClaudeInstance::find($instanceId)?->session;
            if (! $session) {
                return;
            }

            $session->markAsTerminated();
            $this->multiAgentSessionService->teardown($session);
            AgentGateway::send($session->machine_id, 'session:terminate', [
                'sessionId' => $session->id,
            ]);
            broadcast(new SessionTerminated($session))->toOthers();
        } catch (Throwable $e) {
            Log::warning('Decompose session teardown failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get the stored master plan.
     *
     * GET /api/projects/{project}/master-plan
     */
    public function getMasterPlan(Request $request, SharedProject $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Project does not belong to you', 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'prd' => $project->prd,
                'master_plan' => $project->master_plan,
                'has_plan' => !empty($project->master_plan),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Update the master plan (after frontend editing).
     *
     * PUT /api/projects/{project}/master-plan
     */
    public function updateMasterPlan(Request $request, SharedProject $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Project does not belong to you', 403);
        }

        $validated = $request->validate([
            'master_plan' => 'required|array',
            'master_plan.version' => 'required|integer|in:1',
            'master_plan.waves' => 'required|array|min:1',
            'master_plan.waves.*.name' => 'required|string',
            'master_plan.waves.*.tasks' => 'required|array|min:1',
            'master_plan.waves.*.tasks.*.title' => 'required|string',
        ]);

        $validation = $this->decompositionService->validateMasterPlan($validated['master_plan']);
        if (!$validation['valid']) {
            return $this->errorResponse(
                'INVALID_PLAN',
                'Master plan validation failed: ' . implode('; ', $validation['errors']),
                422,
            );
        }

        $project->update(['master_plan' => $validation['plan']]);

        return response()->json([
            'success' => true,
            'data' => [
                'master_plan' => $project->fresh()->master_plan,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Apply the master plan — create SharedTasks from waves.
     *
     * POST /api/projects/{project}/master-plan/apply
     */
    public function applyMasterPlan(Request $request, SharedProject $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Project does not belong to you', 403);
        }

        if (empty($project->master_plan)) {
            return $this->errorResponse('NO_PLAN', 'No master plan to apply', 422);
        }

        // Check for existing tasks
        $existingTasks = $project->tasks()->count();
        if ($existingTasks > 0) {
            $request->validate([
                'force' => 'required|boolean|accepted',
            ]);
            // Delete existing tasks before re-applying
            $project->tasks()->delete();
        }

        try {
            $result = $this->decompositionService->applyMasterPlan($project);
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse('APPLY_ERROR', $e->getMessage(), 422);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'created' => $result['created'],
                'tasks' => $result['tasks']->map(fn ($t) => [
                    'id' => $t->id,
                    'wave' => $t->wave,
                    'title' => $t->title,
                    'priority' => $t->priority,
                    'status' => $t->status,
                ]),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Create an epic from the project's current master plan, generating its
     * sprints + tasks (linked to the epic). Additive — never deletes existing
     * tasks; the new sprints are appended in `planning` status.
     *
     * POST /api/projects/{project}/epics/from-plan
     */
    public function createEpicFromPlan(Request $request, SharedProject $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Project does not belong to you', 403);
        }

        if (empty($project->master_plan)) {
            return $this->errorResponse('NO_PLAN', 'No master plan to apply — decompose a PRD first', 422);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'color' => 'nullable|string|max:9',
            'icon' => 'nullable|string|max:50',
            'priority' => 'nullable|in:low,medium,high,critical',
        ]);

        $epic = \App\Models\Epic::create([
            'project_id' => $project->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? ($project->master_plan['prd_summary'] ?? null),
            'color' => $validated['color'] ?? \App\Models\Epic::DEFAULT_COLOR,
            'icon' => $validated['icon'] ?? 'layers',
            'status' => 'open',
            'priority' => $validated['priority'] ?? 'medium',
        ]);

        try {
            $result = $this->decompositionService->applyMasterPlan($project, $epic);
        } catch (\InvalidArgumentException $e) {
            $epic->delete();

            return $this->errorResponse('APPLY_ERROR', $e->getMessage(), 422);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'epic' => new \App\Http\Resources\EpicResource($epic->fresh()),
                'created' => $result['created'],
                'sprints' => $result['sprints'],
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Re-launch decomposition (regenerate).
     *
     * POST /api/projects/{project}/master-plan/regenerate
     */
    public function regenerate(Request $request, SharedProject $project): JsonResponse
    {
        if (empty($project->prd)) {
            return $this->errorResponse('NO_PRD', 'No PRD stored on this project', 422);
        }

        // Reuse the decompose logic with stored PRD
        $request->merge(['prd' => $project->prd]);

        return $this->decompose($request, $project);
    }

}
