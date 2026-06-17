<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EpicResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'title' => $this->title,
            'description' => $this->description,
            'color' => $this->color,
            'icon' => $this->icon,
            'status' => $this->status,
            'priority' => $this->priority,
            'sort_order' => $this->sort_order,
            'tasks_count' => $this->tasks_count,
            'completed_tasks_count' => $this->completed_tasks_count,
            // "Remaining" reuses SharedTask::scopeRemaining (not done AND not
            // stranded in a closed sprint) chained after the archived-epic
            // exclusion, mirroring SprintResource and keeping the three counters
            // (total/completed/remaining) on the same archive-aware visible set.
            'remaining_tasks_count' => $this->remaining_tasks_count,
            'progress_percentage' => $this->progress_percentage,
            // AI decomposition state (idle|pending|running|ready|failed; null = never decomposed).
            // Canonical contract mirrored by the migration, Epic casts/helpers and the TS Epic type.
            'decomposition_status' => $this->decomposition_status,
            'decomposition_session_id' => $this->decomposition_session_id,
            'decomposition_error' => $this->decomposition_error,
            'decomposed_at' => $this->decomposed_at?->toIso8601String(),
            // Archive state (NULL archived_at = active).
            'archived_at' => $this->archived_at?->toIso8601String(),
            'is_archived' => $this->is_archived,
            // Epic-level pull request (finalize flow). pr_state: open|merged|closed;
            // null = no PR opened yet. Canonical contract mirrored by the Epic model
            // CHECK, EpicFinalizeService and the TS Epic type.
            'pr_url' => $this->pr_url,
            'pr_number' => $this->pr_number,
            'pr_state' => $this->pr_state,
            'pr_branch' => $this->pr_branch,
            'has_pull_request' => $this->has_pull_request,
            'finalized_at' => $this->finalized_at?->toIso8601String(),
            // Terminal "this epic's PR is merged/shipped" marker (default false).
            // Distinct from pr_state (live GitHub lifecycle): pr_done drives the
            // board hiding the Generate-PR button and the epic-merge backfill.
            // Canonical contract mirrored by the migration, Epic cast and TS type.
            'pr_done' => $this->pr_done,
            'started_at' => $this->started_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
