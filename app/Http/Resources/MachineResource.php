<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MachineResource extends JsonResource
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
            'platform' => $this->platform,
            'hostname' => $this->hostname,
            'arch' => $this->arch,
            'status' => $this->status,
            'is_online' => $this->is_online,
            'claude_version' => $this->claude_version,
            'agent_version' => $this->agent_version,
            'node_version' => $this->node_version,
            'claude_path' => $this->claude_path,
            'capabilities' => $this->capabilities ?? [],
            'max_sessions' => $this->max_sessions,
            'active_sessions_count' => $this->active_sessions_count ?? 0,
            'can_accept_more_sessions' => $this->canAcceptMoreSessions(),
            'last_seen_at' => $this->last_seen_at?->toIso8601String(),
            'connected_at' => $this->connected_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            // Human-readable timestamps
            'last_seen_human' => $this->last_seen_at?->diffForHumans(),
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
