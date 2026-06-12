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
    public const MAX_NUDGES_BEFORE_PAUSE = 3;
    public const RECYCLE_TASKS_COMPLETED = 5;
    public const RECYCLE_SESSION_MAX_HOURS = 2;

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

        // (a) A task is claimed and still in progress → push to finish it.
        if ($instance->current_task_id) {
            $task = $instance->currentTask;
            if ($task instanceof SharedTask && $task->status === 'in_progress') {
                $this->nudge($instance, $session, sprintf(
                    "Your task '%s' is still in progress. Finish it and call the claudenest task_complete tool with a summary.",
                    $task->title,
                ));

                return;
            }
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
        if ($instance->tasks_completed >= self::RECYCLE_TASKS_COMPLETED) {
            return true;
        }

        $startedAt = $session->started_at ?? $session->created_at;

        return $startedAt !== null && $startedAt->lt(now()->subHours(self::RECYCLE_SESSION_MAX_HOURS));
    }

    /**
     * @param array<string, mixed> $orchestration
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
        // termination above just freed a plan-cap slot, so the spawn fits.
        $user = $project->user;
        if (! empty($orchestration['active']) && $user) {
            $this->workerPool->spawnWorker(
                $project,
                $user,
                (string) ($orchestration['permission_mode'] ?? WorkerPoolService::DEFAULT_PERMISSION_MODE),
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
            'data' => $text . "\r",
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
        Cache::put(self::pausedKey($instance->id), true, self::NUDGE_COUNTER_TTL_SECONDS);

        Log::warning('Worker loop: pausing worker after repeated nudges without progress', [
            'instance_id' => $instance->id,
            'session_id' => $session->id,
            'nudges' => $nudgeCount,
        ]);

        broadcast(new SessionNotification(
            $session,
            sprintf(
                'Worker %s was paused after %d nudges without progress. Open its terminal to unblock it, or release its task; it resumes automatically on task claim/complete.',
                $instance->id,
                $nudgeCount,
            ),
            'Worker paused',
            'warning',
        ));
    }

    private function allTasksDone(SharedProject $project): bool
    {
        return ! $project->tasks()->where('status', '!=', 'done')->exists();
    }
}
