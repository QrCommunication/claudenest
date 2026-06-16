<?php

namespace App\Http\Controllers\Api;

use App\Events\EpicDecompositionUpdated;
use App\Events\SessionTerminated;
use App\Http\Controllers\Controller;
use App\Http\Resources\EpicResource;
use App\Models\ClaudeCredential;
use App\Models\ClaudeInstance;
use App\Models\Epic;
use App\Models\Session;
use App\Models\SharedProject;
use App\Services\AgentGateway;
use App\Services\CredentialService;
use App\Services\DecompositionService;
use App\Services\DecompositionSessionService;
use App\Services\DecompositionStreamService;
use App\Services\MultiAgentSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Throwable;

class DecompositionController extends Controller
{
    public function __construct(
        private DecompositionService $decompositionService,
        private CredentialService $credentialService,
        private DecompositionStreamService $decompositionStream,
        private DecompositionSessionService $decompositionSession,
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

        $machine = $project->machine;
        if (! $machine || $machine->status !== 'online') {
            return $this->errorResponse('MACHINE_OFFLINE', 'Machine is not online', 422);
        }

        // Persist the PRD so the spawn (and any auth-error relaunch) reads it.
        $project->update(['prd' => $validated['prd']]);

        // Spawn the ephemeral interactive decompose session. Validates the
        // credential first (clean 422 instead of a session that 401s on boot).
        try {
            $session = $this->decompositionSession->launch($project, $credential);
        } catch (\RuntimeException $e) {
            return $this->errorResponse('CREDENTIAL_ERROR', $e->getMessage(), 422);
        }

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
     * When the submitting session was decomposing a specific epic (epic-from-PRD
     * flow via {@see decomposeEpic}), the validated plan is ALSO auto-applied to
     * that linked epic — its sprints/tasks are generated (additive) and the epic's
     * decomposition state flips `running` → `completed`. A plain project decomposition
     * (no linked epic) leaves the wizard to apply the plan manually.
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

        // Resolve the submitting session once (via the MCP instance header) so the
        // same handle drives epic resolution AND teardown.
        $session = $this->resolveSubmittingSession($request);

        $validation = $this->decompositionService->validateMasterPlan($validated['master_plan']);
        if (! $validation['valid']) {
            // A linked epic mid-decomposition must not spin forever: flip it to
            // `failed` so the dashboard badge resolves. No-op for a plain decompose.
            $this->decompositionSession->failEpicForSession(
                $session,
                'Master plan validation failed: '.implode('; ', $validation['errors']),
            );

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

        // Epic-from-PRD flow: auto-apply the freshly stored plan to the linked
        // epic and flip it to `completed`. Best-effort & self-contained — a failure
        // marks the epic `failed` but never fails the submit (the plan is already
        // stored + broadcast for the wizard fallback).
        $epicApplied = $this->applyPlanToLinkedEpic($session, $project);

        // The session has done its single job — tear it down so it never lingers.
        $this->teardownDecomposeSession($session);

        $waves = $validation['plan']['waves'] ?? [];
        $taskCount = array_sum(array_map(fn ($w) => count($w['tasks'] ?? []), $waves));

        return response()->json([
            'success' => true,
            'data' => [
                'status' => 'submitted',
                'waves' => count($waves),
                'created' => $taskCount,
                'epic_applied' => $epicApplied,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Auto-apply the project's stored master plan to the epic linked to the
     * submitting decomposition session, flipping that epic `running` → `completed`.
     *
     * Resolution: the epic whose `decomposition_session_id` is this session and
     * whose decomposition is still in flight (`pending`/`running`) — the guard
     * makes this idempotent and a no-op for a plain (non-epic) decomposition or a
     * session that already completed.
     *
     * On success the epic is marked `completed` (canonical model enum value, via
     * {@see Epic::markDecompositionCompleted()}) and a dedicated
     * {@see EpicDecompositionUpdated} broadcast is fired; `decomposed_at` is also
     * stamped for the EpicResource alias. On failure the epic is flipped `failed`
     * via {@see DecompositionSessionService::failEpicForSession()} and the error
     * logged; the submit still succeeds.
     *
     * @return bool true when a linked epic was found and successfully applied.
     */
    private function applyPlanToLinkedEpic(?Session $session, SharedProject $project): bool
    {
        if (! $session) {
            return false;
        }

        $epic = Epic::where('decomposition_session_id', $session->id)
            ->whereIn('decomposition_status', [Epic::DECOMPOSITION_PENDING, Epic::DECOMPOSITION_RUNNING])
            ->first();

        if (! $epic) {
            return false;
        }

        try {
            // Additive: links the generated tasks to the epic and appends its
            // sprints in `planning` status, never disturbing the active sprint.
            $this->decompositionService->applyMasterPlan($project, $epic);

            // Canonical terminal success state (model enum + CHECK + helpers).
            $epic->markDecompositionCompleted();
            $epic->decomposed_at = now();
            $epic->save();

            broadcast(new EpicDecompositionUpdated($epic, Epic::DECOMPOSITION_COMPLETED));

            return true;
        } catch (Throwable $e) {
            Log::warning('Epic plan auto-application failed', [
                'epic_id' => $epic->id,
                'error' => $e->getMessage(),
            ]);

            $this->decompositionSession->failEpicForSession(
                $session,
                'Plan application failed: '.$e->getMessage(),
            );

            return false;
        }
    }

    /**
     * Resolve the session that submitted the plan from the MCP instance header
     * (X-Instance-ID → ClaudeInstance → Session). Null when the header is absent
     * or the instance/session can no longer be found.
     */
    private function resolveSubmittingSession(Request $request): ?Session
    {
        $instanceId = (string) $request->header('X-Instance-ID', '');
        if ($instanceId === '') {
            return null;
        }

        return ClaudeInstance::find($instanceId)?->session;
    }

    /**
     * Terminate the decomposition session that submitted the plan (already
     * resolved via {@see resolveSubmittingSession}). Best-effort — a failed
     * teardown must never fail the submit (the plan is already stored + broadcast).
     */
    private function teardownDecomposeSession(?Session $session): void
    {
        try {
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
                'has_plan' => ! empty($project->master_plan),
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
        if (! $validation['valid']) {
            return $this->errorResponse(
                'INVALID_PLAN',
                'Master plan validation failed: '.implode('; ', $validation['errors']),
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

        $epic = Epic::create([
            'project_id' => $project->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? ($project->master_plan['prd_summary'] ?? null),
            'color' => $validated['color'] ?? Epic::DEFAULT_COLOR,
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
                'epic' => new EpicResource($epic->fresh()),
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
     * Create an epic from a PRD and immediately launch its asynchronous
     * decomposition session.
     *
     * Unlike createEpicFromPlan (which applies an already-stored master plan),
     * this is the "decompose with AI" entry point: the epic is created up-front
     * in the `pending` decomposition state, the PRD is persisted on the project,
     * and an interactive decompose session is spawned. The session submits its
     * plan via the submit_master_plan tool; the (sibling) submitFromAgent path
     * then auto-applies that plan to the linked epic (running → completed/failed).
     *
     * POST /api/projects/{project}/epics/decompose
     */
    public function decomposeEpic(Request $request, SharedProject $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Project does not belong to you', 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'prd' => 'required|string|min:20|max:50000',
            'description' => 'nullable|string|max:2000',
            'color' => 'nullable|string|max:9',
            'icon' => 'nullable|string|max:50',
            'priority' => 'nullable|in:low,medium,high,critical',
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

        $machine = $project->machine;
        if (! $machine || $machine->status !== 'online') {
            return $this->errorResponse('MACHINE_OFFLINE', 'Machine is not online', 422);
        }

        // The decompose session reads the PRD (+ any scan_result) off the project.
        $project->update(['prd' => $validated['prd']]);

        // Create the epic up-front and mark it `pending` via the canonical model
        // helper so the dashboard shows a live badge immediately (the helper also
        // stamps decomposition_started_at, now created by the migration).
        $epic = Epic::create([
            'project_id' => $project->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'] ?? Epic::DEFAULT_COLOR,
            'icon' => $validated['icon'] ?? 'layers',
            'status' => 'open',
            'priority' => $validated['priority'] ?? 'medium',
        ]);
        $epic->markDecompositionPending();

        // Spawn the ephemeral interactive decompose session. Validates the
        // credential first (clean 422 instead of a session that 401s on boot).
        try {
            $session = $this->decompositionSession->launch($project, $credential);
        } catch (\RuntimeException $e) {
            // No session → the epic would dangle in `pending` forever. Drop it.
            $epic->delete();

            return $this->errorResponse('CREDENTIAL_ERROR', $e->getMessage(), 422);
        }

        // Link the session and flip to `running` (direct update for the same
        // schema-drift reason — markDecompositionRunning touches ghost columns).
        $epic->update([
            'decomposition_status' => Epic::DECOMPOSITION_RUNNING,
            'decomposition_session_id' => $session->id,
            'decomposition_error' => null,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'epic' => new EpicResource($epic->fresh()),
                'session_id' => $session->id,
                'status' => 'decomposing',
                'message' => 'Decomposition session started. The epic will update via WebSocket.',
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
