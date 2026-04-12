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
            'progress_percentage' => $this->progress_percentage,
            'started_at' => $this->started_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
