<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\SharedProject;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    /**
     * Indicates whether the resource should include detailed fields.
     */
    public bool $detailed = false;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var SharedProject $project */
        $project = $this->resource;

        $data = [
            'id' => $project->id,
            'machine_id' => $project->machine_id,
            'name' => $project->name,
            'project_path' => $project->project_path,
            'summary' => $project->summary,
            'token_usage_percent' => $project->token_usage_percent,
            'is_token_limit_reached' => $project->is_token_limit_reached,
            'active_instances_count' => $project->active_instances_count ?? 0,
            'pending_tasks_count' => $project->pending_tasks_count ?? 0,
            'settings' => $project->settings,
            'created_at' => $project->created_at?->toIso8601String(),
            'updated_at' => $project->updated_at?->toIso8601String(),
        ];

        if ($this->detailed) {
            $data['architecture'] = $project->architecture;
            $data['conventions'] = $project->conventions;
            $data['current_focus'] = $project->current_focus;
            $data['recent_changes'] = $project->recent_changes;
            $data['total_tokens'] = $project->total_tokens;
            $data['max_tokens'] = $project->max_tokens;
        }

        return $data;
    }

    /**
     * Create a new resource instance with detailed fields included.
     */
    public static function detailed(SharedProject $project): self
    {
        $resource = new self($project);
        $resource->detailed = true;

        return $resource;
    }
}
