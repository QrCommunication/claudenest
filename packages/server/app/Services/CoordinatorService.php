<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\SessionCreated;
use App\Events\SessionNotification;
use App\Models\Session;
use App\Models\SharedProject;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Event-driven multi-agent coordinator.
 *
 * On orchestration incidents (task thrashing, lock contention, sprint
 * review) the server spawns an EPHEMERAL interactive Claude session whose
 * role is to reorganise the PLAN through the claudenest MCP planning tools
 * and broadcast its recommendations. It never spawns workers itself and
 * never edits project files — scaling decisions stay with the human.
 *
 * Same session:create mechanics as PlanningController::createSession
 * (scoped token with the 'planning' ability via SessionPayloadBuilder,
 * default credential of the project owner, non-orchestrated session).
 */
class CoordinatorService
{
    public const INCIDENT_TASK_THRASHING = 'task_thrashing';

    public const INCIDENT_LOCK_CONTENTION = 'lock_contention';

    public const INCIDENT_SPRINT_REVIEW = 'sprint_review';

    /** Minimum delay between two coordinator spawns on a project (budget). */
    public const SPAWN_BUDGET_SECONDS = 3600;

    /** Upper bound on the "active coordinator" cache flag (self-cleaning). */
    private const ACTIVE_FLAG_TTL_SECONDS = 7200;

    public function __construct(
        private SessionPayloadBuilder $payloadBuilder,
    ) {}

    /**
     * Report an orchestration incident. Spawns a coordinator session only
     * when every guard passes (orchestration active — or sprint_review
     * opt-in —, coordinator enabled, hourly budget, no coordinator already
     * running). Never throws: failures are logged, the calling action is
     * never broken by coordination.
     *
     * @param array<string, mixed> $context incident data (task/path/sprint)
     */
    public function reportIncident(SharedProject $project, string $type, array $context = []): void
    {
        $orchestration = (array) $project->getSetting('orchestration', []);

        // Guard 1 — orchestration must be active, except sprint_review which
        // is allowed outside orchestration when explicitly opted in via
        // settings.coordinator.on_sprint_review (default false).
        if (empty($orchestration['active'])) {
            if ($type !== self::INCIDENT_SPRINT_REVIEW) {
                return;
            }

            $coordinatorSettings = (array) $project->getSetting('coordinator', []);
            if (empty($coordinatorSettings['on_sprint_review'])) {
                return;
            }
        }

        // Guard 2 — coordinator kill-switch (enabled by default).
        if (! ($orchestration['coordinator'] ?? true)) {
            return;
        }

        // Guard 3 — budget: at most one coordinator spawn per hour per
        // project. The key carries the spawn timestamp with a 1h TTL, so
        // its mere presence means "last spawn < 1h ago".
        if (Cache::has(self::lastSpawnKey($project->id))) {
            Log::debug('Coordinator: incident dropped (spawn budget)', [
                'project_id' => $project->id,
                'incident_type' => $type,
            ]);

            return;
        }

        // Guard 4 — never run two coordinators at once on a project.
        if ($this->hasActiveCoordinator($project)) {
            Log::debug('Coordinator: incident dropped (coordinator already active)', [
                'project_id' => $project->id,
                'incident_type' => $type,
            ]);

            return;
        }

        // Environmental constraints — same as PlanningController::createSession.
        $machine = $project->machine;
        if (! $machine || $machine->status !== 'online') {
            Log::debug('Coordinator: incident dropped (machine offline)', [
                'project_id' => $project->id,
                'incident_type' => $type,
            ]);

            return;
        }

        $user = $project->user;
        $cap = $user->concurrentAgentCap();
        if ($cap !== null && Session::forUser($user->id)->active()->count() >= $cap) {
            Log::debug('Coordinator: incident dropped (plan cap reached)', [
                'project_id' => $project->id,
                'incident_type' => $type,
                'cap' => $cap,
            ]);

            return;
        }

        try {
            $this->spawnCoordinator($project, $type, $context);
        } catch (Throwable $e) {
            Log::warning('Coordinator spawn failed', [
                'project_id' => $project->id,
                'incident_type' => $type,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Spawn the ephemeral coordinator session (interactive, NOT orchestrated,
     * default credential of the project owner) and notify the project.
     *
     * @param array<string, mixed> $context incident data used in the prompt
     */
    public function spawnCoordinator(SharedProject $project, string $type, array $context = []): Session
    {
        $user = $project->user;
        $credential = $user->credentials()->default()->first();

        /** @var Session $session */
        $session = Session::create([
            'machine_id' => $project->machine_id,
            'user_id' => $user->id,
            'shared_project_id' => $project->id,
            'mode' => 'interactive',
            'project_path' => $project->project_path,
            'initial_prompt' => $this->buildIncidentPrompt($type, $context),
            'credential_id' => $credential?->id,
            'status' => 'created',
            'orchestrated' => false,
        ]);

        $payload = $this->payloadBuilder->build(
            $session,
            $project,
            'default',
            extraAbilities: ['planning'],
            systemPromptOverride: $this->buildCoordinatorSystemPrompt($project, $type),
        );

        // Agent payload (camelCase contract) — mcpEnv carries the scoped
        // token: agent-only via AgentGateway, NEVER broadcast nor in resources.
        AgentGateway::send($project->machine_id, 'session:create', $payload);

        broadcast(new SessionCreated($session))->toOthers();

        // Budget + single-coordinator flags (read back by the guards).
        Cache::put(self::lastSpawnKey($project->id), now()->timestamp, self::SPAWN_BUDGET_SECONDS);
        Cache::put(self::activeSessionKey($project->id), $session->id, self::ACTIVE_FLAG_TTL_SECONDS);

        // event() (not broadcast()) so registered listeners fire too — the
        // event is ShouldBroadcast, so it is still broadcast identically.
        event(new SessionNotification(
            $session,
            sprintf(
                "Incident '%s' detected — a coordinator session was spawned to reorganise the plan (session %s).",
                $type,
                $session->id,
            ),
            'Coordinator session started',
            'warning',
        ));

        $project->logActivity('coordinator_spawned', null, [
            'session_id' => $session->id,
            'incident_type' => $type,
            'context' => $context,
        ]);

        Log::info('Coordinator spawned', [
            'project_id' => $project->id,
            'session_id' => $session->id,
            'incident_type' => $type,
        ]);

        return $session;
    }

    /**
     * Coordinator role prompt — plan surgery only, no code edits, no worker
     * spawning (the human decides on scaling).
     */
    private function buildCoordinatorSystemPrompt(SharedProject $project, string $type): string
    {
        return "You are an incident coordinator for project {$project->name}. "
            . "An incident was detected: {$type}. "
            . 'Investigate using claudenest MCP tools (task_list, context_query, project_info, backlog_stats), '
            . 'then fix the PLAN — not the code: reassign/split/reprioritise tasks (task_update, task_decompose, task_release), '
            . 'record findings (context_add), and broadcast a short recommendation to the team (broadcast_message). '
            . 'You cannot spawn workers; if more workers are needed, say so in the broadcast and the human will decide. '
            . 'Do NOT edit project files. Finish by summarising what you changed in this terminal.';
    }

    /**
     * Initial prompt: human-readable incident description (task/file/sprint
     * involved) followed by the raw context for traceability.
     *
     * @param array<string, mixed> $context
     */
    private function buildIncidentPrompt(string $type, array $context): string
    {
        $lead = match ($type) {
            self::INCIDENT_TASK_THRASHING => sprintf(
                'Incident: task thrashing — task "%s" (%s) has been released %s times%s. Investigate why workers keep abandoning it and fix the plan.',
                $context['task_title'] ?? 'unknown',
                $context['task_id'] ?? 'unknown',
                $context['release_count'] ?? '2+',
                isset($context['reason']) && $context['reason'] !== null && $context['reason'] !== ''
                    ? sprintf(' (last reason: %s)', $context['reason'])
                    : '',
            ),
            self::INCIDENT_LOCK_CONTENTION => sprintf(
                'Incident: lock contention — %s conflicting lock attempts on "%s" within 10 minutes (held by %s, requested by %s). Find the overlapping tasks and reorganise them so they stop competing for this file.',
                $context['conflict_count'] ?? '3+',
                $context['path'] ?? 'unknown',
                $context['holder'] ?? 'unknown',
                $context['requester'] ?? 'unknown',
            ),
            self::INCIDENT_SPRINT_REVIEW => sprintf(
                'Incident: sprint review — sprint "%s" (%s) was just completed (velocity: %s). Review the outcome and prepare the backlog for what comes next.',
                $context['sprint_name'] ?? 'unknown',
                $context['sprint_id'] ?? 'unknown',
                $context['velocity'] ?? 'unknown',
            ),
            default => sprintf('Incident: %s. Investigate and fix the plan.', $type),
        };

        if ($context === []) {
            return $lead;
        }

        return $lead . "\n\nIncident context: " . json_encode($context, JSON_UNESCAPED_SLASHES);
    }

    /**
     * True when the coordinator session tracked in cache is still active.
     * Stale flags (terminated/failed sessions) are cleared on the way.
     */
    private function hasActiveCoordinator(SharedProject $project): bool
    {
        $sessionId = Cache::get(self::activeSessionKey($project->id));
        if (! $sessionId) {
            return false;
        }

        $stillActive = Session::query()
            ->whereKey($sessionId)
            ->active()
            ->exists();

        if (! $stillActive) {
            Cache::forget(self::activeSessionKey($project->id));
        }

        return $stillActive;
    }

    private static function lastSpawnKey(string $projectId): string
    {
        return "claudenest:coordinator:{$projectId}:last_spawn";
    }

    private static function activeSessionKey(string $projectId): string
    {
        return "claudenest:coordinator:{$projectId}:session";
    }
}
