<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\SessionCreated;
use App\Events\SessionNotification;
use App\Events\SessionTerminated;
use App\Exceptions\WorkerPoolException;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Server-driven worker pool.
 *
 * Workers are regular interactive Claude sessions created BY THE SERVER so
 * they go through MultiAgentSessionService::attach() (instance + scoped token
 * + MCP env + system prompt) exactly like human multi-agent sessions. The
 * orchestration state lives in shared_projects.settings['orchestration'];
 * the loop itself is driven by the Stop-hook idle heartbeat (WorkerLoopService).
 */
class WorkerPoolService
{
    /**
     * Orchestrated workers run unattended: bypassPermissions so they never
     * stall on an approval dialog (MCP coordination tools, file edits, Bash).
     * A human-monitored run can still override via the start endpoint.
     */
    public const DEFAULT_PERMISSION_MODE = 'bypassPermissions';

    /**
     * Kickoff user message handed to a freshly spawned worker.
     *
     * CRITICAL: an interactive Claude session launched WITHOUT a first user
     * message never produces an assistant turn, so the Stop hook never fires,
     * so no idle heartbeat is ever sent, so WorkerLoopService::onIdle is never
     * called and the worker sits inert forever (claimable tasks never picked
     * up). This prompt forces the very first turn; from then on the Stop-hook
     * idle heartbeat self-sustains the claim → work → complete loop.
     */
    public const BOOTSTRAP_PROMPT = 'You are an orchestrated worker on this shared project. Start now: call the claudenest MCP tool task_claim_next to claim a task, complete it (edit the files it lists), then call task_complete with a 2-4 sentence summary and files_modified. Immediately claim the next task and repeat. If task_claim_next reports no task available, stop and wait — you will be nudged automatically when new work appears.';

    public function __construct(
        private SessionPayloadBuilder $payloadBuilder,
        private MultiAgentSessionService $multiAgentSessionService,
        private CredentialService $credentialService,
    ) {}

    /**
     * Start orchestration: spawn min(maxWorkers, remaining plan cap,
     * max(1, pending tasks)) workers and persist the orchestration state.
     *
     * @param  bool  $coordinator  allow the incident coordinator
     *                             (CoordinatorService) to spawn ephemeral planning sessions on
     *                             incidents — persisted in settings.orchestration.coordinator.
     * @return array<string, mixed> the orchestrator status (see status())
     *
     * @throws WorkerPoolException machine offline (422) or plan cap reached (403)
     */
    public function start(
        SharedProject $project,
        User $user,
        int $maxWorkers,
        string $permissionMode = self::DEFAULT_PERMISSION_MODE,
        bool $coordinator = true,
    ): array {
        $machine = $project->machine;
        if (! $machine || $machine->status !== 'online') {
            throw WorkerPoolException::machineOffline();
        }

        $remaining = PHP_INT_MAX;
        $cap = $user->concurrentAgentCap();
        if ($cap !== null) {
            $activeSessions = Session::forUser($user->id)->active()->count();
            $remaining = $cap - $activeSessions;

            if ($remaining <= 0) {
                throw WorkerPoolException::planLimitReached($cap);
            }
        }

        // Resume before new: tasks left in_progress by previously-terminated
        // workers return to the claimable pool (and are claimed first via
        // prioritized()) so a relaunch continues that work instead of stranding it.
        SharedTask::reclaimOrphaned($project->id);

        $pendingTasks = $project->tasks()->pending()->count();
        $toSpawn = (int) min($maxWorkers, $remaining, max(1, $pendingTasks));

        $spawned = [];
        for ($i = 0; $i < $toSpawn; $i++) {
            $spawned[] = $this->spawnWorker($project, $user, $permissionMode);
        }

        $project->setSetting('orchestration', [
            'active' => true,
            'max_workers' => $maxWorkers,
            'permission_mode' => $permissionMode,
            'coordinator' => $coordinator,
            'started_at' => now()->toIso8601String(),
        ]);

        Log::info('Worker pool started', [
            'project_id' => $project->id,
            'max_workers' => $maxWorkers,
            'spawned' => count($spawned),
            'permission_mode' => $permissionMode,
            'coordinator' => $coordinator,
        ]);

        return $this->status($project);
    }

    /**
     * Spawn a single orchestrated worker session (interactive mode, default
     * credential of the user) and send the same camelCase session:create
     * payload as SessionController::store.
     */
    public function spawnWorker(
        SharedProject $project,
        User $user,
        string $permissionMode = self::DEFAULT_PERMISSION_MODE,
    ): Session {
        $credential = $user->credentials()->default()->first();

        /** @var Session $session */
        $session = Session::create([
            'machine_id' => $project->machine_id,
            'user_id' => $user->id,
            'shared_project_id' => $project->id,
            'mode' => 'interactive',
            'project_path' => $project->project_path,
            'initial_prompt' => self::BOOTSTRAP_PROMPT,
            'credential_id' => $credential?->id,
            'status' => 'created',
            'orchestrated' => true,
        ]);

        $payload = $this->payloadBuilder->build($session, $project, $permissionMode);

        // Agent payload (camelCase contract) — same channel as human sessions.
        AgentGateway::send($project->machine_id, 'session:create', $payload);

        // Broadcast to dashboard via Reverb (credentials excluded — agent-only)
        broadcast(new SessionCreated($session))->toOthers();

        Log::info('Worker spawned', [
            'project_id' => $project->id,
            'session_id' => $session->id,
        ]);

        return $session;
    }

    /**
     * Stop orchestration: mark the state inactive then terminate every
     * orchestrated session still active on the project.
     */
    public function stop(SharedProject $project): void
    {
        $orchestration = (array) $project->getSetting('orchestration', []);
        $orchestration['active'] = false;
        $orchestration['stopped_at'] = now()->toIso8601String();
        $project->setSetting('orchestration', $orchestration);

        $workers = $this->activeWorkerSessions($project)->get();
        foreach ($workers as $worker) {
            $this->terminateWorker($worker);
        }

        Log::info('Worker pool stopped', [
            'project_id' => $project->id,
            'terminated' => $workers->count(),
        ]);
    }

    /**
     * Terminate a single orchestrated worker session. Mirrors
     * SessionController::destroy: mark terminated → multi-agent teardown
     * (idempotent, never blocking) → session:terminate to the agent →
     * dashboard broadcast.
     */
    public function terminateWorker(Session $session): void
    {
        $session->markAsTerminated();

        try {
            $this->multiAgentSessionService->teardown($session);
        } catch (Throwable $e) {
            Log::warning('Multi-agent teardown failed on worker termination', [
                'session_id' => $session->id,
                'error' => $e->getMessage(),
            ]);
        }

        AgentGateway::send($session->machine_id, 'session:terminate', [
            'sessionId' => $session->id,
        ]);

        broadcast(new SessionTerminated($session))->toOthers();
    }

    /**
     * Recover a worker whose Claude credential 401'd ("Please run /login").
     *
     * Claude OAuth tokens rotate on refresh, so a worker spawned before another
     * refresh ends up holding a revoked access token → 401. We renew the
     * credential (rotating token), terminate the stuck worker, reclaim its
     * in-progress task, and spawn a fresh worker — whose bootstrap prompt makes
     * it resume that very task. If the OAuth refresh itself fails (refresh token
     * dead), we cannot relaunch headless: notify the owner to re-login.
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
        if (! $project || ! $user) {
            return $result;
        }

        // Cooldown: at most one auth-error relaunch per project per 2 minutes.
        $cooldownKey = "claudenest:authrelaunch:{$project->id}";
        if (! \Illuminate\Support\Facades\Cache::add($cooldownKey, 1, 120)) {
            Log::info('Auth-error relaunch skipped (cooldown)', ['project_id' => $project->id]);

            return $result;
        }

        // Renew the (rotating) OAuth credential.
        $credential = $session->credential ?? $user->credentials()->default()->first();
        if ($credential && $credential->auth_type === 'oauth') {
            try {
                $this->credentialService->refreshOAuthToken($credential);
                $result['refreshed'] = true;
            } catch (Throwable $e) {
                $result['needs_login'] = true;
                Log::warning('OAuth refresh failed during auth-error recovery', [
                    'credential_id' => $credential->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $orchestration = (array) $project->getSetting('orchestration', []);
        $permissionMode = $orchestration['permission_mode'] ?? self::DEFAULT_PERMISSION_MODE;

        // Stop the stuck worker and return its in-progress task to the pool.
        $this->terminateWorker($session);
        SharedTask::reclaimOrphaned($project->id);

        if ($result['needs_login']) {
            // No usable credential — surface a re-login prompt to the owner.
            event(new SessionNotification(
                $session,
                'Worker authentication expired — please re-capture your Claude credentials.',
                null,
                'warning',
                'projectsWorkspace.toasts.reloginTitle',
                'projectsWorkspace.toasts.reloginMessage',
            ));

            return $result;
        }

        // Fresh worker: new scoped MCP token + renewed credential env; its
        // bootstrap prompt claims the reclaimed task → resume.
        $new = $this->spawnWorker($project, $user, $permissionMode);
        $result['relaunched'] = true;
        $result['new_session'] = $new->id;

        Log::info('Worker relaunched after auth 401', [
            'old_session' => $session->id,
            'new_session' => $new->id,
            'refreshed' => $result['refreshed'],
        ]);

        return $result;
    }

    /**
     * Orchestrator status: active workers (orchestrated sessions + their
     * instances), task counters and the persisted orchestration settings.
     *
     * Keeps the legacy `status`/`workers`/`pendingTasks`/`completedTasks`
     * keys consumed by the dashboard orchestrator store.
     *
     * @return array<string, mixed>
     */
    public function status(SharedProject $project): array
    {
        $project->refresh();

        $orchestration = (array) $project->getSetting('orchestration', []);
        $active = (bool) ($orchestration['active'] ?? false);

        $workers = $this->activeWorkerSessions($project)
            ->with(['claudeInstance.currentTask'])
            ->get()
            ->map(function (Session $session): array {
                $instance = $session->claudeInstance;

                return [
                    'id' => $instance?->id ?? MultiAgentSessionService::instanceIdFor($session),
                    'sessionId' => $session->id,
                    'status' => $instance?->status ?? $session->status,
                    'currentTaskId' => $instance?->current_task_id,
                    'currentTaskTitle' => $instance?->currentTask?->title,
                    'tasksCompleted' => (int) ($instance?->tasks_completed ?? 0),
                ];
            })
            ->values()
            ->all();

        $tasks = [
            'pending' => $project->tasks()->pending()->count(),
            'in_progress' => $project->tasks()->inProgress()->count(),
            'done' => $project->tasks()->done()->count(),
        ];

        return [
            'status' => $active ? 'running' : 'stopped',
            'active' => $active,
            'workers' => $workers,
            'tasks' => $tasks,
            'pendingTasks' => $tasks['pending'],
            'completedTasks' => $tasks['done'],
            'orchestration' => $orchestration,
        ];
    }

    /**
     * Active (non-terminal) orchestrated sessions of a project.
     */
    private function activeWorkerSessions(SharedProject $project): Builder
    {
        return Session::where('shared_project_id', $project->id)
            ->orchestrated()
            ->active();
    }
}
