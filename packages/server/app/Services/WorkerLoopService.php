<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\SessionNotification;
use App\Models\ClaudeInstance;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\SharedTask;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Server-driven worker state machine.
 *
 * Triggered by the Claude Stop hook (POST instances/{i}/heartbeat with
 * status=idle): decides whether the orchestrated worker should be nudged to
 * finish/claim a task, recycled (context budget spent), paused (no progress),
 * or scaled down (no work left). Called fail-safe from the heartbeat — it
 * must never make the heartbeat fail.
 *
 * Suspension: any human input on the session (HTTP input endpoint or WS
 * terminal) suspends the loop for HUMAN_INPUT_SUSPENSION_SECONDS.
 */
class WorkerLoopService
{
    public const HUMAN_INPUT_SUSPENSION_SECONDS = 120;

    public const HUMAN_INPUT_TTL_SECONDS = 300;

    public const NUDGE_DEBOUNCE_SECONDS = 20;

    public const NUDGE_COUNTER_TTL_SECONDS = 3600;

    /**
     * No-progress nudges tolerated before a worker is paused. Sized to absorb
     * a transient Anthropic API rate-limit (which clears within minutes): at
     * the orchestrator:dispatch everyMinute cadence this is ~6 min of retries.
     */
    public const MAX_NUDGES_BEFORE_PAUSE = 6;

    /**
     * A pause is a SHORT cool-down, not a give-up: after it expires the
     * proactive dispatcher resumes the worker with a fresh nudge budget, so a
     * rate-limited worker keeps retrying indefinitely at a throttled cadence
     * (~6 min nudging -> 5 min quiet -> repeat) until it claims a task.
     */
    public const PAUSE_SECONDS = 300;

    /**
     * A connected worker that has emitted no heartbeat for this long is treated
     * as stuck (an active worker heartbeats every ≤30s via PostToolUse). Catches
     * workers frozen at an idle prompt after a rate-limit-ended turn, which the
     * Stop hook never reports. > 3× the 30s PostToolUse window to avoid nudging
     * a worker that is genuinely mid-operation.
     */
    public const STUCK_AFTER_SECONDS = 120;

    /**
     * Recycle a worker after each completed task: terminate it and spawn a
     * fresh session so the next task starts on a clean, un-bloated context.
     * (Recycle only fires when there is claimable work left — see onIdle.)
     */
    public const RECYCLE_TASKS_COMPLETED = 1;

    public const RECYCLE_SESSION_MAX_HOURS = 2;

    /**
     * Grace window before a freshly-claimed in_progress task may be reclaimed as
     * orphaned. Anti-churn: a worker that completes a task is recycled (its
     * session terminated) the instant it reports idle; if it had re-claimed a
     * long task in between, the orphan sweep would otherwise race the volunteer
     * teardown and release that task back to pending — re-claim → re-recycle, up
     * to dozens of times. A task claimed less than this many seconds ago is left
     * alone so the legitimate handoff can settle. See SharedTask::reclaimOrphaned.
     */
    public const RECLAIM_GRACE_SECONDS = 90;

    /**
     * A task is only reclaimed once its worker's session has been terminal
     * (completed/error/terminated) for at least this long — i.e. the worker is
     * genuinely gone, not mid-handoff. A task held behind a session that just
     * flipped terminated (volunteer recycle, replacement spawning) is preserved.
     * Set above RECLAIM_GRACE_SECONDS so a dead session is the binding signal.
     */
    public const RECLAIM_DEAD_SESSION_SECONDS = 120;

    public function __construct(
        private WorkerPoolService $workerPool,
    ) {}

    // ==================== CACHE KEYS (single source of truth) ====================

    public static function humanInputKey(string $sessionId): string
    {
        return "claudenest:session:{$sessionId}:human_input_at";
    }

    public static function nudgesKey(string $instanceId): string
    {
        return "claudenest:instance:{$instanceId}:nudges";
    }

    public static function pausedKey(string $instanceId): string
    {
        return "claudenest:instance:{$instanceId}:paused";
    }

    public static function lastNudgeKey(string $instanceId): string
    {
        return "claudenest:instance:{$instanceId}:last_nudge_at";
    }

    /**
     * Record that a human typed into the session (HTTP input or WS terminal):
     * suspends the orchestration loop for HUMAN_INPUT_SUSPENSION_SECONDS.
     */
    public static function markHumanInput(string $sessionId): void
    {
        Cache::put(self::humanInputKey($sessionId), now()->timestamp, self::HUMAN_INPUT_TTL_SECONDS);
    }

    /**
     * Reset the no-progress state of an instance. Called on task claim and
     * task complete (proven progress) so a paused worker resumes naturally.
     */
    public static function resetNoProgress(string $instanceId): void
    {
        Cache::forget(self::nudgesKey($instanceId));
        Cache::forget(self::pausedKey($instanceId));
    }

    // ==================== STATE MACHINE ====================

    /**
     * Proactive dispatch tick (scheduler, heartbeat-independent).
     *
     * The Stop-hook idle heartbeat is the ONLY trigger of onIdle() — but it
     * does NOT fire when a turn ends on an API error (Anthropic rate-limit):
     * the worker drops back to an idle prompt yet keeps status=busy with a
     * frozen last_activity, so the idle-only filter would never recover it
     * ("blocks after rate-limiting" — observed in prod). This pass therefore
     * ticks every connected orchestrated worker that is either idle OR has
     * gone silent past STUCK_AFTER_SECONDS (no heartbeat = stuck, since an
     * actively working worker emits a PostToolUse heartbeat every ≤30s).
     * onIdle() is internally debounced/paused, so re-running it is safe.
     *
     * @return int number of workers ticked
     */
    public function dispatchProject(SharedProject $project): int
    {
        $orchestration = (array) $project->getSetting('orchestration', []);
        if (empty($orchestration['active'])) {
            return 0;
        }

        // Resume before new: return tasks orphaned by dead workers to the pool
        // (claimed first via prioritized()) before nudging idle workers.
        SharedTask::reclaimOrphaned($project->id);

        $staleBefore = now()->subSeconds(self::STUCK_AFTER_SECONDS);

        // Liveness via the SESSION (running/waiting_input), NOT instance.connected():
        // a transient agent WS drop flips disconnected_at while the worker keeps
        // running, and connected() would then stop nudging a live-but-stuck worker.
        $instances = $project->claudeInstances()
            ->whereHas('session', fn ($query) => $query->where('orchestrated', true)
                ->whereNotIn('status', ['completed', 'error', 'terminated']))
            ->where(function ($query) use ($staleBefore) {
                $query->where('status', 'idle')
                    ->orWhereNull('last_activity_at')
                    ->orWhere('last_activity_at', '<', $staleBefore);
            })
            ->with(['session', 'currentTask'])
            ->get();

        $ticked = 0;
        foreach ($instances as $instance) {
            try {
                $this->onIdle($instance);
                $ticked++;
            } catch (\Throwable $e) {
                Log::warning('Proactive worker dispatch failed', [
                    'instance_id' => $instance->id,
                    'project_id' => $project->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $ticked;
    }

    /**
     * Tick of the worker loop, fired when an instance reports status=idle.
     */
    public function onIdle(ClaudeInstance $instance): void
    {
        $project = $instance->project;
        if (! $project instanceof SharedProject) {
            return;
        }

        $orchestration = (array) $project->getSetting('orchestration', []);
        if (empty($orchestration['active'])) {
            return; // Project is not orchestrated.
        }

        $session = $instance->session;
        if (! $session instanceof Session || ! $session->orchestrated || $session->is_completed) {
            return; // Human session (or already terminated) — never automated.
        }

        if ($this->humanRecentlyTyped($session)) {
            return; // A human took over the terminal — suspend automation.
        }

        if (Cache::get(self::pausedKey($instance->id))) {
            return; // Paused after repeated no-progress nudges.
        }

        // (a) This worker still holds an in-progress task → push to finish it
        // FIRST (resume before claiming anything new). Resolved from the task's
        // assigned_to, NOT instance.current_task_id: the MCP claim path sets the
        // task owner but does not sync that column, so relying on it left
        // rate-limit-stalled workers silently un-nudged (they hold a task but
        // there is no fresh claimable work, so nothing kicked them).
        $ownTask = SharedTask::forProject($project->id)
            ->where('assigned_to', $instance->id)
            ->where('status', 'in_progress')
            ->first();

        if ($ownTask instanceof SharedTask) {
            $this->nudge($instance, $session, sprintf(
                "Your task '%s' is still in progress. Finish it and call the claudenest task_complete tool with a summary.",
                $ownTask->title,
            ));

            return;
        }

        // (b) Claimable pending work exists → recycle a spent worker, else nudge to claim.
        if (SharedTask::getNextAvailable($project->id) !== null) {
            if ($this->shouldRecycle($instance, $session)) {
                $this->recycle($instance, $session, $project, $orchestration);

                return;
            }

            $this->nudge(
                $instance,
                $session,
                'You are idle. Claim your next task with the claudenest task_claim_next tool and work on it.',
            );

            return;
        }

        // (c) No claimable work left → scale down once everything is done.
        if ($this->allTasksDone($project)) {
            Log::info('Worker loop: all tasks done, scaling down worker', [
                'instance_id' => $instance->id,
                'session_id' => $session->id,
                'project_id' => $project->id,
            ]);

            $this->workerPool->terminateWorker($session);
        }
        // Otherwise tasks are in progress/blocked elsewhere — keep the worker warm.
    }

    // ==================== INTERNALS ====================

    private function humanRecentlyTyped(Session $session): bool
    {
        $lastInputAt = Cache::get(self::humanInputKey($session->id));

        return $lastInputAt !== null
            && (now()->timestamp - (int) $lastInputAt) < self::HUMAN_INPUT_SUSPENSION_SECONDS;
    }

    /**
     * Recycle budget: a worker that completed RECYCLE_TASKS_COMPLETED tasks or
     * has been alive for more than RECYCLE_SESSION_MAX_HOURS carries a bloated
     * context — replace it with a fresh session.
     */
    private function shouldRecycle(ClaudeInstance $instance, Session $session): bool
    {
        // Defensive anti-churn guard: never recycle a worker that still owns an
        // in-progress task. onIdle() only reaches the recycle branch once the
        // worker's own task is no longer in_progress, but a task it re-claimed
        // between completion and this tick (the orphan-sweep churn) would still
        // be terminated mid-flight here. Terminating its session then makes the
        // task an "orphan" → released → re-claimed → re-recycled. Bail out.
        $holdsInProgressTask = SharedTask::forProject($instance->project_id)
            ->where('assigned_to', $instance->id)
            ->where('status', 'in_progress')
            ->exists();

        if ($holdsInProgressTask) {
            return false;
        }

        if ($instance->tasks_completed >= self::RECYCLE_TASKS_COMPLETED) {
            return true;
        }

        $startedAt = $session->started_at ?? $session->created_at;

        return $startedAt !== null && $startedAt->lt(now()->subHours(self::RECYCLE_SESSION_MAX_HOURS));
    }

    /**
     * @param  array<string, mixed>  $orchestration
     */
    private function recycle(
        ClaudeInstance $instance,
        Session $session,
        SharedProject $project,
        array $orchestration,
    ): void {
        Log::info('Worker loop: recycling spent worker', [
            'instance_id' => $instance->id,
            'session_id' => $session->id,
            'tasks_completed' => $instance->tasks_completed,
        ]);

        self::resetNoProgress($instance->id);
        $this->workerPool->terminateWorker($session);

        // Spawn the replacement only while orchestration is still active. The
        // termination above just freed a slot, so the spawn fits. Keep the
        // orchestration's selected credential so the recycled worker doesn't
        // silently switch to the default.
        $user = $project->user;
        if (! empty($orchestration['active']) && $user) {
            $this->workerPool->spawnWorker(
                $project,
                $user,
                (string) ($orchestration['permission_mode'] ?? WorkerPoolService::DEFAULT_PERMISSION_MODE),
                isset($orchestration['credential_id']) ? (string) $orchestration['credential_id'] : null,
            );
        }
    }

    /**
     * Send a nudge to the worker terminal via the agent — exact same message
     * shape as SessionController::input (session:input {sessionId, data}).
     * Debounced; after MAX_NUDGES_BEFORE_PAUSE attempts without progress the
     * worker is paused and the dashboard is notified instead.
     */
    private function nudge(ClaudeInstance $instance, Session $session, string $text): void
    {
        // Idempotence: at most one nudge per NUDGE_DEBOUNCE_SECONDS per instance.
        $lastNudgeAt = Cache::get(self::lastNudgeKey($instance->id));
        if ($lastNudgeAt !== null && (now()->timestamp - (int) $lastNudgeAt) < self::NUDGE_DEBOUNCE_SECONDS) {
            return;
        }

        // No-progress counter (reset on task claim/complete). Cache::add only
        // seeds the key when absent, preserving the 1h window TTL.
        Cache::add(self::nudgesKey($instance->id), 0, self::NUDGE_COUNTER_TTL_SECONDS);
        $nudgeCount = (int) Cache::increment(self::nudgesKey($instance->id));

        if ($nudgeCount >= self::MAX_NUDGES_BEFORE_PAUSE) {
            $this->pause($instance, $session, $nudgeCount);

            return;
        }

        AgentGateway::send($session->machine_id, 'session:input', [
            'sessionId' => $session->id,
            'data' => $text."\r",
        ]);

        Cache::put(self::lastNudgeKey($instance->id), now()->timestamp, 60);

        Log::debug('Worker loop: nudge sent', [
            'instance_id' => $instance->id,
            'session_id' => $session->id,
            'nudge_count' => $nudgeCount,
        ]);
    }

    private function pause(ClaudeInstance $instance, Session $session, int $nudgeCount): void
    {
        // Short cool-down (not a give-up): clear the no-progress counter so the
        // dispatcher resumes this worker with a fresh nudge budget once the
        // pause expires. A transient rate-limit thus self-heals; a genuinely
        // stuck worker just retries at a throttled cadence (and a human can
        // open its terminal). resetNoProgress also forgets pausedKey, so set
        // the cool-down AFTER it.
        self::resetNoProgress($instance->id);
        Cache::put(self::pausedKey($instance->id), true, self::PAUSE_SECONDS);

        Log::warning('Worker loop: pausing worker (cool-down) after repeated nudges without progress', [
            'instance_id' => $instance->id,
            'session_id' => $session->id,
            'nudges' => $nudgeCount,
            'cool_down_seconds' => self::PAUSE_SECONDS,
        ]);

        // event() (not broadcast()) so registered listeners fire too — the
        // event is ShouldBroadcast, so it is still broadcast identically.
        event(new SessionNotification(
            $session,
            sprintf(
                'Worker %s made no progress after %d nudges (likely API rate-limit) — cooling down %ds then retrying automatically. Open its terminal to intervene.',
                $instance->id,
                $nudgeCount,
                self::PAUSE_SECONDS,
            ),
            'Worker cooling down',
            'warning',
            titleKey: 'projectChannel.workerCoolingDown.title',
            messageKey: 'projectChannel.workerCoolingDown.message',
            params: [
                'instance' => $instance->id,
                'nudges' => $nudgeCount,
                'seconds' => self::PAUSE_SECONDS,
            ],
        ));
    }

    private function allTasksDone(SharedProject $project): bool
    {
        return ! $project->tasks()->where('status', '!=', 'done')->exists();
    }
}
