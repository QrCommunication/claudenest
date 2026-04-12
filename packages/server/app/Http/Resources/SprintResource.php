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
            'total_story_points' => $this->total_story_points,
            'completed_story_points' => $this->completed_story_points,
            'progress_percentage' => $this->progress_percentage,
            'remaining_days' => $this->remaining_days,
            'is_overdue' => $this->is_overdue,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
