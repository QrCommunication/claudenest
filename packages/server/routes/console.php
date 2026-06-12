<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
*/

// Cleanup expired data daily
Schedule::call(function () {
    // Delete expired file locks
    \App\Models\FileLock::cleanupExpired();

    // Delete expired context chunks
    \App\Models\ContextChunk::cleanupExpired();

    // Delete old activity logs (30 days)
    \App\Models\ActivityLog::cleanup(30);

    // Delete old session logs (90 days)
    \App\Models\SessionLog::where('created_at', '<', now()->subDays(90))->delete();

    // Cleanup expired tokens
    \App\Models\PersonalAccessToken::cleanupExpired();

    info('ClaudeNest cleanup completed');
})->daily();

// Mark offline machines
Schedule::call(function () {
    $timeout = now()->subMinutes(2);

    \App\Models\Machine::where('status', 'online')
        ->where('last_seen_at', '<', $timeout)
        ->update(['status' => 'offline']);
})->everyMinute();

// Multi-agent maintenance: release expired file locks promptly (locks carry a
// ~30 min TTL — the daily cleanup is far too slow for active coordination) and
// let the runner agent reconcile task/epic/sprint statuses on active projects
// (projects with at least one connected Claude instance, capped at 20/run).
Schedule::call(function () {
    \App\Models\FileLock::cleanupExpired();

    $runner = app(\App\Services\RunnerAgentService::class);

    \App\Models\SharedProject::whereHas('claudeInstances', fn ($query) => $query->connected())
        ->limit(20)
        ->get()
        ->each(function (\App\Models\SharedProject $project) use ($runner): void {
            try {
                $updates = $runner->autoUpdateStatuses($project);

                if (count($updates) > 0) {
                    $project->logActivity('runner_auto_update', null, [
                        'updates_count' => count($updates),
                        'updates' => $updates,
                    ]);
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Scheduled runner auto-update failed', [
                    'project_id' => $project->id,
                    'error' => $e->getMessage(),
                ]);
            }
        });
})->everyFiveMinutes()->name('multiagent-maintenance');

// Multi-agent safety net: tear down instances still marked connected while
// their session is dead (covers crashed agents / missed teardown paths).
Schedule::call(function () {
    $service = app(\App\Services\MultiAgentSessionService::class);

    $instances = \App\Models\ClaudeInstance::whereNull('disconnected_at')
        ->whereNotNull('session_id')
        ->with('session')
        ->get();

    foreach ($instances as $instance) {
        $session = $instance->session;

        $sessionDead = $session === null
            || in_array($session->status, ['completed', 'error', 'terminated'], true);

        if (!$sessionDead) {
            continue;
        }

        // Session terminated → immediate teardown. Session row gone → only
        // after a 30 min inactivity grace period (avoid racing transient states).
        $shouldTeardown = $session !== null
            || ($instance->last_activity_at && $instance->last_activity_at->lt(now()->subMinutes(30)));

        if (!$shouldTeardown) {
            continue;
        }

        try {
            if ($session) {
                $service->teardown($session);
            } else {
                $service->teardownInstance($instance);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Multi-agent scheduled teardown failed', [
                'instance_id' => $instance->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
})->everyMinute();

// Proactively refresh OAuth credentials nearing expiration (< 24h) and
// reconnect their active Claude sessions, so long-running sessions never
// hit an expired token mid-task.
Schedule::command('claudenest:refresh-credentials --hours=24')
    ->hourly()
    ->withoutOverlapping()
    ->runInBackground();

// Keep the Ollama model warm: it unloads after 5 min by default and the
// cold load costs ~23s (mistral:7b, CPU). A 1-token ping every 25 min with
// keep_alive=30m means the project-context wizard never pays the cold load.
// (*/25 fires at :00/:25/:50 — every gap stays under the 30 min keep_alive.)
Schedule::call(function () {
    $service = app(\App\Services\SummarizationService::class);

    if (!$service->isAvailable()) {
        return;
    }

    $service->warmUp();
})->cron('*/25 * * * *')->name('ollama-warmup');

// Artisan command for manual cleanup
Artisan::command('claudenest:cleanup', function () {
    $this->info('Running ClaudeNest cleanup...');

    $locks = \App\Models\FileLock::cleanupExpired();
    $this->info("Deleted {$locks} expired file locks");

    $chunks = \App\Models\ContextChunk::cleanupExpired();
    $this->info("Deleted {$chunks} expired context chunks");

    $logs = \App\Models\ActivityLog::cleanup(30);
    $this->info("Deleted old activity logs");

    $sessionLogs = \App\Models\SessionLog::where('created_at', '<', now()->subDays(90))->delete();
    $this->info("Deleted {$sessionLogs} old session logs");

    $tokens = \App\Models\PersonalAccessToken::cleanupExpired();
    $this->info("Deleted {$tokens} expired tokens");

    $this->info('Cleanup completed!');
})->purpose('Run all ClaudeNest cleanup tasks');
