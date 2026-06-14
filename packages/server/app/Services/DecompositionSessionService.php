<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\SessionCreated;
use App\Events\SessionNotification;
use App\Events\SessionTerminated;
use App\Models\ClaudeCredential;
use App\Models\PersonalAccessToken;
use App\Models\Session;
use App\Models\SharedProject;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Lifecycle of the ephemeral PRD-decomposition session.
 *
 * Decomposition runs as a normal INTERACTIVE Claude session (subscription, no
 * `claude -p`), scoped to a single extra ability ({@see self::DECOMPOSE_ABILITY})
 * so the only API thing it can do is submit its plan via the `submit_master_plan`
 * MCP tool. Sandboxed like a worker (read-all, writes confined to the project).
 *
 * Single spawn site shared by the HTTP controller and the auth-error recovery
 * path (AgentServe). Mirrors {@see WorkerPoolService::relaunchOnAuthError()}:
 * a decompose session that 401s ("Please run /login" — a rotated OAuth token,
 * not the scoped MCP token) is otherwise a permanent stall, because the agent's
 * `session:auth_error` is dropped server-side for non-orchestrated sessions.
 */
class DecompositionSessionService
{
    /**
     * Marker ability carried by the scoped token — also the discriminator used
     * to recognise a decompose session in the auth-error recovery path.
     */
    public const DECOMPOSE_ABILITY = 'decompose';

    /** Sandbox mode: never stall on the MCP tool call; writes confined by bwrap. */
    private const PERMISSION_MODE = 'bypassPermissions';

    public function __construct(
        private DecompositionService $decompositionService,
        private CredentialService $credentialService,
        private DecompositionStreamService $decompositionStream,
        private SessionPayloadBuilder $payloadBuilder,
        private MultiAgentSessionService $multiAgentSessionService,
    ) {}

    /**
     * Spawn a decomposition session for a project whose PRD is already stored
     * and whose credential is validated. Returns the created Session.
     *
     * Releases the one-result-per-run lock first so this run can emit its
     * `decompose:result` (see {@see DecompositionStreamService}).
     *
     * @throws \RuntimeException if the credential is unusable (caller maps 422)
     */
    public function launch(SharedProject $project, ClaudeCredential $credential): Session
    {
        // Surface an unusable credential before creating a session row that
        // would only 401 on boot.
        $this->credentialService->getSessionEnv($credential);

        $this->decompositionStream->reset($project->id);

        $scanResult = $project->settings['scan_result'] ?? null;
        $systemPrompt = $this->decompositionService->buildDecompositionSystemPrompt(
            (string) $project->prd,
            $scanResult,
        );

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
            self::PERMISSION_MODE,
            extraAbilities: [self::DECOMPOSE_ABILITY],
            systemPromptOverride: $systemPrompt,
        );

        AgentGateway::send($project->machine_id, 'session:create', $payload);
        broadcast(new SessionCreated($session))->toOthers();

        return $session;
    }

    /**
     * Is this the ephemeral decomposition session? Distinguishes it from the
     * other non-orchestrated project sessions (planning, coordinator) via the
     * `decompose` ability on its scoped token `mcp:{sessionId}`.
     */
    public function isDecomposeSession(Session $session): bool
    {
        if ($session->orchestrated || ! $session->shared_project_id) {
            return false;
        }

        return PersonalAccessToken::where('name', "mcp:{$session->id}")
            ->get()
            ->contains(fn (PersonalAccessToken $t) => in_array(
                self::DECOMPOSE_ABILITY,
                (array) ($t->abilities ?? []),
                true,
            ));
    }

    /**
     * The decompose session's Claude credential returned 401 ("Please run
     * /login"). Renew the (rotating) OAuth token and relaunch the decomposition
     * so it resumes from the stored PRD. If the OAuth refresh itself fails
     * (refresh token dead), notify the owner to re-login instead.
     *
     * A per-project cooldown prevents a relaunch storm if the renewed token is
     * also rejected.
     *
     * @return array{relaunched: bool, refreshed: bool, needs_login: bool, new_session?: string}
     */
    public function relaunchOnAuthError(Session $session): array
    {
        $result = ['relaunched' => false, 'refreshed' => false, 'needs_login' => false];

        $project = $session->shared_project_id
            ? SharedProject::find($session->shared_project_id)
            : null;
        $user = $session->user;
        if (! $project || ! $user || empty($project->prd)) {
            return $result;
        }

        // Cooldown: at most one decompose auth-error relaunch per project / 2 min.
        $cooldownKey = "claudenest:decompose:authrelaunch:{$project->id}";
        if (! Cache::add($cooldownKey, 1, 120)) {
            Log::info('Decompose auth-error relaunch skipped (cooldown)', ['project_id' => $project->id]);

            return $result;
        }

        // Renew the (rotating) OAuth credential. Fall back to the owner's default.
        $credential = $session->credential ?? $user->credentials()->default()->first();
        if ($credential && $credential->auth_type === 'oauth') {
            try {
                $this->credentialService->refreshOAuthToken($credential);
                $result['refreshed'] = true;
            } catch (Throwable $e) {
                $result['needs_login'] = true;
                Log::warning('OAuth refresh failed during decompose auth-error recovery', [
                    'credential_id' => $credential->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Tear down the stalled decompose session in all cases.
        $this->teardown($session);

        if (! $credential || $result['needs_login']) {
            $result['needs_login'] = true;
            event(new SessionNotification(
                $session,
                'Decomposition authentication expired — please re-capture your Claude credentials.',
                null,
                'warning',
                'projectsWorkspace.toasts.reloginTitle',
                'projectsWorkspace.toasts.reloginMessage',
            ));

            return $result;
        }

        // Machine must be online to relaunch; otherwise surface a notification.
        $machine = $project->machine;
        if (! $machine || $machine->status !== 'online') {
            event(new SessionNotification(
                $session,
                'Decomposition could not resume — the machine is offline.',
                null,
                'warning',
            ));

            return $result;
        }

        try {
            $new = $this->launch($project, $credential);
            $result['relaunched'] = true;
            $result['new_session'] = $new->id;

            Log::info('Decompose session relaunched after auth 401', [
                'old_session' => $session->id,
                'new_session' => $new->id,
                'refreshed' => $result['refreshed'],
            ]);
        } catch (Throwable $e) {
            Log::error('Decompose relaunch failed after auth 401', [
                'old_session' => $session->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $result;
    }

    /**
     * Terminate a decompose session: mark terminated, drop its multi-agent
     * binding (instance + scoped token), tell the agent to kill the PTY, and
     * broadcast. Best-effort — never throws.
     */
    private function teardown(Session $session): void
    {
        try {
            $session->markAsTerminated();
            $this->multiAgentSessionService->teardown($session);
            AgentGateway::send($session->machine_id, 'session:terminate', [
                'sessionId' => $session->id,
            ]);
            broadcast(new SessionTerminated($session))->toOthers();
        } catch (Throwable $e) {
            Log::warning('Decompose session teardown failed', [
                'session_id' => $session->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
