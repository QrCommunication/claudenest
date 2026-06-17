<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Epic;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * When an epic reaches 100%, ask the project's agent to open a pull request for
 * the epic's work (git branch + commit + push + gh pr create on the agent host),
 * mirroring {@see SprintFinalizeService} at the epic granularity.
 *
 * The dispatch records the finalize intent on the epic (`pr_branch` +
 * `finalized_at`); the resulting `pr_url`/`pr_number`/`pr_state` are filled when
 * the agent reports back `epic:finalized`. Best-effort: a missing project path /
 * offline machine never breaks the caller (the finalize endpoint).
 */
class EpicFinalizeService
{
    /**
     * Dispatch the epic's pull request to the agent and stamp the finalize
     * intent. Returns true when the dispatch was actually sent.
     *
     * The `merge` intent (default true) tells the agent to merge the PR after
     * creating it, so the epic's work is shipped — the agent then reports back
     * `prState: merged`, and {@see AgentServe::onEpicFinalized} records the
     * merged state + flips `pr_done`. Pass false to only open the PR.
     */
    public function dispatchPullRequest(Epic $epic, bool $merge = true): bool
    {
        $project = $epic->project;
        if (! $project || ! $project->machine_id || ! $project->project_path) {
            return false;
        }

        $machine = $project->machine;
        if (! $machine || $machine->status !== 'online') {
            Log::info('Epic PR skipped — machine offline', [
                'epic_id' => $epic->id,
                'project_id' => $project->id,
            ]);

            return false;
        }

        $slug = Str::slug($epic->title) ?: 'epic';
        $branch = "claudenest/epic-{$slug}-".substr($epic->id, 0, 8);

        $doneTitles = $epic->tasks()
            ->where('status', 'done')
            ->orderBy('completed_at')
            ->pluck('title');

        $bodyLines = ["## Epic: {$epic->title}", ''];
        if ($epic->description) {
            $bodyLines[] = $epic->description;
            $bodyLines[] = '';
        }
        $bodyLines[] = '### Completed tasks';
        foreach ($doneTitles as $title) {
            $bodyLines[] = "- {$title}";
        }
        $bodyLines[] = '';
        $bodyLines[] = '_Opened automatically by ClaudeNest on epic completion._';

        AgentGateway::send($project->machine_id, 'epic:finalize', [
            'epicId' => $epic->id,
            'projectId' => $project->id,
            'projectPath' => $project->project_path,
            'branch' => $branch,
            'title' => "Epic: {$epic->title}",
            'body' => implode("\n", $bodyLines),
            // Merge intent: the agent merges the PR after opening it so the
            // epic ships in one shot (consumed by createEpicHandlers).
            'merge' => $merge,
        ]);

        // Record the finalize intent so the board reflects "finalizing"; the PR
        // url/number/state arrive when the agent reports epic:finalized.
        $epic->update([
            'pr_branch' => $branch,
            'finalized_at' => now(),
        ]);

        Log::info('Epic PR dispatched to agent', [
            'epic_id' => $epic->id,
            'branch' => $branch,
        ]);

        return true;
    }

    /**
     * Reconcile earlier sibling epics when a later epic is finalized.
     *
     * Finalizing epic N can leave earlier (board-order) epics completed but
     * never shipped — they were `done` yet nobody clicked "Generate PR". This
     * walks the previous siblings (via {@see Epic::scopePreviousSiblings}) that
     * are `done`, still active (not archived) and NOT yet shipped
     * (`pr_done = false`) and dispatches their PR with the same merge intent,
     * so the whole sequence merges together.
     *
     * Convergence: already-shipped siblings (`pr_done = true`) are skipped, so
     * re-finalizing never re-spams merged work. Best-effort — each dispatch is
     * independent (offline machine / missing path just returns false for that
     * sibling). Returns the number of previous-epic PRs actually dispatched.
     */
    public function backfillPreviousEpics(Epic $epic, bool $merge = true): int
    {
        $dispatched = 0;

        $previous = Epic::previousSiblings($epic)
            ->active()
            ->where('status', 'done')
            ->where('pr_done', false)
            ->ordered()
            ->get();

        foreach ($previous as $sibling) {
            if ($this->dispatchPullRequest($sibling, $merge)) {
                $dispatched++;
            }
        }

        if ($dispatched > 0) {
            Log::info('Epic finalize backfilled previous epics', [
                'epic_id' => $epic->id,
                'project_id' => $epic->project_id,
                'count' => $dispatched,
            ]);
        }

        return $dispatched;
    }
}
