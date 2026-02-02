<?php

namespace App\Http\Resources;

use App\Models\Session;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionResource extends JsonResource
{
    /**
     * Indicates whether the resource should include logs.
     */
    public bool $includeLogs = false;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Session $session */
        $session = $this->resource;

        $data = [
            'id' => $session->id,
            'machine_id' => $session->machine_id,
            'user_id' => $session->user_id,
            'mode' => $session->mode,
            'project_path' => $session->project_path,
            'initial_prompt' => $session->initial_prompt,
            'status' => $session->status,
            'is_running' => $session->is_running,
            'is_completed' => $session->is_completed,
            'pid' => $session->pid,
            'exit_code' => $session->exit_code,
            'pty_size' => $session->pty_size,
            'total_tokens' => $session->total_tokens,
            'total_cost' => $session->total_cost,
            'duration' => $session->duration,
            'formatted_duration' => $session->formatted_duration,
            'started_at' => $session->started_at?->toIso8601String(),
            'completed_at' => $session->completed_at?->toIso8601String(),
            'created_at' => $session->created_at?->toIso8601String(),
            'updated_at' => $session->updated_at?->toIso8601String(),
            
            // Computed fields
            'machine' => $session->relationLoaded('machine') 
                ? [
                    'id' => $session->machine->id,
                    'name' => $session->machine->display_name,
                    'status' => $session->machine->status,
                ] 
                : null,
        ];

        if ($this->includeLogs) {
            $data['recent_logs'] = $session->logs()
                ->orderBy('created_at', 'desc')
                ->limit(100)
                ->get()
                ->map(fn ($log) => [
                    'id' => $log->id,
                    'type' => $log->type,
                    'data' => $log->data,
                    'metadata' => $log->metadata,
                    'created_at' => $log->created_at?->toIso8601String(),
                ])
                ->reverse()
                ->values();
        }

        return $data;
    }

    /**
     * Create a new resource instance with logs included.
     */
    public static function withLogs(Session $session): self
    {
        $resource = new self($session);
        $resource->includeLogs = true;
        return $resource;
    }
}
