<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Sprint;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * On sprint completion, ask the project's agent to open a pull request for the
 * sprint's work (git branch + commit + push + gh pr create on the agent host).
 * Best-effort: a missing remote / offline machine never breaks completion.
 */
class SprintFinalizeService
{
    public function dispatchPullRequest(Sprint $sprint): void
    {
        $project = $sprint->project;
        if (! $project || ! $project->machine_id || ! $project->project_path) {
            return;
        }

        $machine = $project->machine;
        if (! $machine || $machine->status !== 'online') {
            Log::info('Sprint PR skipped — machine offline', [
                'sprint_id' => $sprint->id,
                'project_id' => $project->id,
            ]);

            return;
        }

        $slug = Str::slug($sprint->name) ?: 'sprint';
        $branch = "claudenest/sprint-{$slug}-".substr($sprint->id, 0, 8);

        $doneTitles = $sprint->tasks()
            ->where('status', 'done')
            ->orderBy('completed_at')
            ->pluck('title');

        $bodyLines = ["## Sprint: {$sprint->name}", ''];
        if ($sprint->goal) {
            $bodyLines[] = "**Goal:** {$sprint->goal}";
            $bodyLines[] = '';
        }
        if ($sprint->velocity !== null) {
            $bodyLines[] = "**Velocity:** {$sprint->velocity} story points";
            $bodyLines[] = '';
        }
        $bodyLines[] = '### Completed tasks';
        foreach ($doneTitles as $title) {
            $bodyLines[] = "- {$title}";
        }
        $bodyLines[] = '';
        $bodyLines[] = '_Opened automatically by ClaudeNest on sprint completion._';

        AgentGateway::send($project->machine_id, 'sprint:finalize', [
            'sprintId' => $sprint->id,
            'projectId' => $project->id,
            'projectPath' => $project->project_path,
            'branch' => $branch,
            'title' => "Sprint: {$sprint->name}",
            'body' => implode("\n", $bodyLines),
        ]);

        Log::info('Sprint PR dispatched to agent', [
            'sprint_id' => $sprint->id,
            'branch' => $branch,
        ]);
    }
}
