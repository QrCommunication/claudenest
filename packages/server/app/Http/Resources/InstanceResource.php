<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ClaudeInstance;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InstanceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var ClaudeInstance $instance */
        $instance = $this->resource;

        return [
            'id' => $instance->id,
            'project_id' => $instance->project_id,
            'machine_id' => $instance->machine_id,
            'session_id' => $instance->session_id,
            'status' => $instance->status,
            'current_task_id' => $instance->current_task_id,
            'context_tokens' => $instance->context_tokens,
            'max_context_tokens' => $instance->max_context_tokens,
            'context_usage_percent' => $instance->context_usage_percent,
            'tasks_completed' => $instance->tasks_completed,
            'is_connected' => $instance->is_connected,
            'connected_at' => $instance->connected_at?->toIso8601String(),
            'last_activity_at' => $instance->last_activity_at?->toIso8601String(),
        ];
    }
}
