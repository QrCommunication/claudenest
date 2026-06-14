<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SprintResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'name' => $this->name,
            'goal' => $this->goal,
            'status' => $this->status,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'velocity' => $this->velocity,
            'capacity' => $this->capacity,
            'sort_order' => $this->sort_order,
            'tasks_count' => $this->tasks_count,
            'completed_tasks_count' => $this->completed_tasks_count,
            // "Remaining" reuses SharedTask::scopeRemaining as the single source of
            // truth (not done AND not stranded in a closed sprint) so the detail
            // view stays consistent with the project/sprint stats counters.
            'remaining_tasks_count' => $this->tasks()->remaining()->count(),
            'total_story_points' => $this->total_story_points,
            'completed_story_points' => $this->completed_story_points,
            'progress_percentage' => $this->progress_percentage,
            'remaining_days' => $this->remaining_days,
            'is_overdue' => $this->is_overdue,
            // Embedded task list — only serialized when the relation is eager-loaded
            // (sprint detail endpoint). The paginated index listing stays lightweight.
            'tasks' => $this->whenLoaded('tasks', fn () => $this->tasks
                ->map(fn ($task) => [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->status,
                    'priority' => $task->priority,
                    'story_points' => $task->story_points,
                    'assigned_to' => $task->assigned_to,
                ])
                ->values()),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
