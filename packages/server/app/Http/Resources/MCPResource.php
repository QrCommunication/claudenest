<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MCPResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'display_name' => $this->display_name,
            'description' => $this->description,
            'status' => $this->status,
            'status_color' => $this->status_color,
            'is_running' => $this->is_running,
            'is_stopped' => $this->is_stopped,
            'has_errors' => $this->has_errors,
            'transport' => $this->transport,
            'command' => $this->command,
            'url' => $this->url,
            'env_vars' => $this->env_vars ?? [],
            'tools' => $this->tools ?? [],
            'tools_count' => $this->tools_count,
            'config' => $this->config ?? [],
            'machine_id' => $this->machine_id,
            'uptime' => $this->uptime,
            'error_message' => $this->error_message,
            'started_at' => $this->started_at?->toIso8601String(),
            'stopped_at' => $this->stopped_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            // Human-readable timestamps
            'started_at_human' => $this->started_at?->diffForHumans(),
            'created_at_human' => $this->created_at?->diffForHumans(),
        ];
    }

    /**
     * Get additional data that should be returned with the resource array.
     *
     * @return array<string, mixed>
     */
    public function with(Request $request): array
    {
        return [
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ];
    }
}
