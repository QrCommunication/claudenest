<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\SharedTask;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var SharedTask $task */
        $task = $this->resource;

        return [
            'id' => $task->id,
            'project_id' => $task->project_id,
            'title' => $task->title,
            'description' => $task->description,
            'priority' => $task->priority,
            'status' => $task->status,
            'is_claimed' => $task->is_claimed,
            'is_completed' => $task->is_completed,
            'is_blocked' => $task->is_blocked,
            'assigned_to' => $task->assigned_to,
            'claimed_at' => $task->claimed_at?->toIso8601String(),
            'completed_at' => $task->completed_at?->toIso8601String(),
            'created_at' => $task->created_at->toIso8601String(),
            'updated_at' => $task->updated_at->toIso8601String(),
            'wave' => $task->wave,
            'epic_id' => $task->epic_id,
            'sprint_id' => $task->sprint_id,
            'parent_id' => $task->parent_id,
            'story_points' => $task->story_points,
            'due_date' => $task->due_date?->format('Y-m-d'),
            'sort_order' => $task->sort_order,
            'labels' => $task->labels ?? [],
            'has_subtasks' => $task->has_subtasks,
            'subtasks_count' => $task->subtasks_count,
            'completed_subtasks_count' => $task->completed_subtasks_count,
            'files' => $task->files,
            'estimated_tokens' => $task->estimated_tokens,
            'dependencies' => $task->dependencies,
            'blocked_by' => $task->blocked_by,
            'completion_summary' => $task->completion_summary,
            'files_modified' => $task->files_modified,
            'created_by' => $task->created_by,
            'duration' => $task->duration,
        ];
    }
}
