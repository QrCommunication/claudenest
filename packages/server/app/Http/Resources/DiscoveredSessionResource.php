<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class DiscoveredSessionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'machine_id' => $this->machine_id,
            'session_id' => $this->session_id,
            'project_slug' => $this->project_slug,
            'cwd' => $this->cwd,
            'project_name' => $this->project_name,
            'transcript_path' => $this->transcript_path,
            'is_live' => $this->is_live,
            'pid' => $this->pid,
            'tty' => $this->tty,
            'started_at' => $this->started_at?->toIso8601String(),
            'last_activity_at' => $this->last_activity_at?->toIso8601String(),
            'last_activity_human' => $this->last_activity_at?->diffForHumans(),
            'size_bytes' => $this->size_bytes,
            'last_preview' => $this->last_preview,
            'adopted' => $this->adopted,
            'agent_session_id' => $this->agent_session_id,
        ];
    }
}
