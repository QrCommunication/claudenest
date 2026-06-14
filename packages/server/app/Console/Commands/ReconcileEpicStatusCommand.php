<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Events\EpicUpdated;
use App\Models\Epic;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Reconciles every epic's persisted status with the live state of its tasks and
 * sprints by replaying {@see Epic::recomputeStatus()}.
 *
 * Production-safe replacement for the ad-hoc `tinker` fix that was previously
 * needed when an epic stayed `in_progress`/`open` after its last task/sprint was
 * finished (the cascade is now wired into Sprint completion, but historical
 * drift still needs a one-shot reconcile).
 *
 * Idempotent by construction: `recomputeStatus()` only persists (and returns
 * true) when something actually changes, so a second run is a no-op — it
 * corrects 0 epics and broadcasts nothing.
 */
class ReconcileEpicStatusCommand extends Command
{
    protected $signature = 'epics:reconcile-status
                            {--project= : Restrict the reconcile to a single project UUID}
                            {--dry-run : Report what would change without persisting or broadcasting}';

    protected $description = 'Recompute every epic status from its tasks/sprints and broadcast EpicUpdated for the ones that drifted';

    public function handle(): int
    {
        $projectId = $this->option('project');
        $dryRun = (bool) $this->option('dry-run');

        $query = Epic::query()
            ->when($projectId !== null, fn ($q) => $q->forProject((string) $projectId))
            ->ordered();

        $total = $query->count();

        if ($total === 0) {
            $this->info($projectId !== null
                ? "No epics found for project {$projectId}."
                : 'No epics found.');

            return self::SUCCESS;
        }

        $scope = $projectId !== null ? "project {$projectId}" : 'all projects';
        $this->info("Reconciling {$total} epic(s) for {$scope}" . ($dryRun ? ' [dry-run]' : '') . '...');

        if ($dryRun) {
            return $this->reconcileDryRun($query->get());
        }

        $corrected = 0;

        foreach ($query->cursor() as $epic) {
            $before = $epic->status;

            if ($epic->recomputeStatus()) {
                $corrected++;
                EpicUpdated::dispatch($epic, 'updated');
                $this->line("  ✓ {$epic->title}: {$before} → {$epic->status}");
            }
        }

        Log::info('Epic status reconcile completed', [
            'project_id' => $projectId,
            'scanned' => $total,
            'corrected' => $corrected,
        ]);

        $this->info("Done: {$corrected}/{$total} epic(s) corrected.");

        return self::SUCCESS;
    }

    /**
     * Predict the reconcile outcome without persisting or broadcasting by
     * replaying the real recompute logic inside a rolled-back transaction —
     * the prediction is therefore identical to a live run.
     *
     * @param  \Illuminate\Support\Collection<int, Epic>  $epics
     */
    private function reconcileDryRun($epics): int
    {
        $wouldCorrect = 0;

        DB::beginTransaction();

        try {
            foreach ($epics as $epic) {
                $before = $epic->status;

                if ($epic->recomputeStatus()) {
                    $wouldCorrect++;
                    $this->line("  [dry-run] {$epic->title}: {$before} → {$epic->status}");
                }
            }
        } finally {
            DB::rollBack();
        }

        $this->info("Dry-run: {$wouldCorrect}/{$epics->count()} epic(s) would be corrected (nothing persisted).");

        return self::SUCCESS;
    }
}
