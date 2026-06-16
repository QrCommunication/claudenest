<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Events\EpicUpdated;
use App\Events\SprintUpdated;
use App\Models\Epic;
use App\Models\Sprint;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Reconciles the persisted status of every sprint and epic with the live state
 * of their tasks by replaying {@see Sprint::recomputeStatus()} then
 * {@see Epic::recomputeStatus()}.
 *
 * Sprints are reconciled FIRST because an epic only reaches `done` once every
 * sprint its tasks belong to is `completed`/`cancelled` — so a sprint frozen in
 * `planning`/`active` (its tasks all done but never closed) would otherwise keep
 * the epic stuck. This is exactly the historical drift this command repairs.
 *
 * Production-safe replacement for the ad-hoc `tinker` fix that was previously
 * needed when an epic stayed `in_progress`/`open` after its last task/sprint was
 * finished (the cascade is now wired into the task mutation paths, but pre-fix
 * drift still needs a one-shot reconcile).
 *
 * Idempotent by construction: each `recomputeStatus()` only persists (and
 * returns true) when something actually changes, so a second run is a no-op — it
 * corrects 0 records and broadcasts nothing.
 */
class ReconcileEpicStatusCommand extends Command
{
    protected $signature = 'epics:reconcile-status
                            {--project= : Restrict the reconcile to a single project UUID}
                            {--dry-run : Report what would change without persisting or broadcasting}';

    protected $description = 'Recompute every sprint then epic status from their tasks and broadcast updates for the ones that drifted';

    public function handle(): int
    {
        $projectId = $this->option('project');
        $dryRun = (bool) $this->option('dry-run');

        $sprintQuery = Sprint::query()
            ->when($projectId !== null, fn ($q) => $q->forProject((string) $projectId))
            ->ordered();

        $epicQuery = Epic::query()
            ->when($projectId !== null, fn ($q) => $q->forProject((string) $projectId))
            ->ordered();

        $sprintCount = $sprintQuery->count();
        $epicCount = $epicQuery->count();

        if ($sprintCount === 0 && $epicCount === 0) {
            $this->info($projectId !== null
                ? "No sprints or epics found for project {$projectId}."
                : 'No sprints or epics found.');

            return self::SUCCESS;
        }

        $scope = $projectId !== null ? "project {$projectId}" : 'all projects';
        $this->info("Reconciling {$sprintCount} sprint(s) + {$epicCount} epic(s) for {$scope}"
            .($dryRun ? ' [dry-run]' : '').'...');

        if ($dryRun) {
            return $this->reconcileDryRun($sprintQuery->get(), $epicQuery->get());
        }

        // Sprints first: an epic's `done` rule depends on its sprints being closed.
        $sprintsCorrected = 0;
        foreach ($sprintQuery->cursor() as $sprint) {
            $before = $sprint->status;

            if ($sprint->recomputeStatus()) {
                $sprintsCorrected++;
                SprintUpdated::dispatch($sprint, 'updated');
                $this->line("  ✓ sprint {$sprint->name}: {$before} → {$sprint->status}");
            }
        }

        $epicsCorrected = 0;
        foreach ($epicQuery->cursor() as $epic) {
            $before = $epic->status;

            if ($epic->recomputeStatus()) {
                $epicsCorrected++;
                EpicUpdated::dispatch($epic, 'updated');
                $this->line("  ✓ epic {$epic->title}: {$before} → {$epic->status}");
            }
        }

        Log::info('Sprint/epic status reconcile completed', [
            'project_id' => $projectId,
            'sprints_scanned' => $sprintCount,
            'sprints_corrected' => $sprintsCorrected,
            'epics_scanned' => $epicCount,
            'epics_corrected' => $epicsCorrected,
        ]);

        $this->info("Done: {$sprintsCorrected}/{$sprintCount} sprint(s) and {$epicsCorrected}/{$epicCount} epic(s) corrected.");

        return self::SUCCESS;
    }

    /**
     * Predict the reconcile outcome without persisting or broadcasting by
     * replaying the real recompute logic inside a rolled-back transaction —
     * the prediction is therefore identical to a live run (sprints first, so the
     * epic predictions see the recomputed sprint statuses).
     *
     * @param  Collection<int, Sprint>  $sprints
     * @param  Collection<int, Epic>  $epics
     */
    private function reconcileDryRun($sprints, $epics): int
    {
        $sprintsWouldCorrect = 0;
        $epicsWouldCorrect = 0;

        DB::beginTransaction();

        try {
            foreach ($sprints as $sprint) {
                $before = $sprint->status;

                if ($sprint->recomputeStatus()) {
                    $sprintsWouldCorrect++;
                    $this->line("  [dry-run] sprint {$sprint->name}: {$before} → {$sprint->status}");
                }
            }

            foreach ($epics as $epic) {
                $before = $epic->status;

                if ($epic->recomputeStatus()) {
                    $epicsWouldCorrect++;
                    $this->line("  [dry-run] epic {$epic->title}: {$before} → {$epic->status}");
                }
            }
        } finally {
            DB::rollBack();
        }

        $this->info("Dry-run: {$sprintsWouldCorrect}/{$sprints->count()} sprint(s) and "
            ."{$epicsWouldCorrect}/{$epics->count()} epic(s) would be corrected (nothing persisted).");

        return self::SUCCESS;
    }
}
