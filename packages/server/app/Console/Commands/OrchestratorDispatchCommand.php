<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\SharedProject;
use App\Services\WorkerLoopService;
use Illuminate\Console\Command;

/**
 * Heartbeat-independent safety net for the server-driven worker pool.
 *
 * The worker loop bootstraps solely from the Stop-hook idle heartbeat
 * (WorkerLoopService::onIdle). When that heartbeat never arrives — a worker
 * spawned without an initial prompt, a crashed turn, a dropped POST — the pool
 * sits idle while claimable tasks pile up. This scheduled pass walks every
 * project whose orchestration is active and proactively ticks its idle workers,
 * recovering a stuck pool without re-spawning anything.
 */
class OrchestratorDispatchCommand extends Command
{
    protected $signature = 'orchestrator:dispatch';

    protected $description = 'Proactively dispatch idle orchestrated workers to claimable tasks (heartbeat-independent).';

    public function handle(WorkerLoopService $loop): int
    {
        $projects = SharedProject::query()
            ->where('settings->orchestration->active', true)
            ->get();

        $ticked = 0;
        foreach ($projects as $project) {
            $ticked += $loop->dispatchProject($project);
        }

        $this->info("orchestrator:dispatch — {$ticked} idle worker(s) ticked across {$projects->count()} active orchestration(s).");

        return self::SUCCESS;
    }
}
