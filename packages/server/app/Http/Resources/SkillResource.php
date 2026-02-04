<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SkillResource extends JsonResource
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
            'category' => $this->category,
            'category_color' => $this->category_color,
            'path' => $this->path,
            'version' => $this->version,
            'enabled' => $this->enabled,
            'config' => $this->config ?? [],
            'tags' => $this->tags ?? [],
            'examples' => $this->examples ?? [],
            'has_config' => $this->has_config,
            'machine_id' => $this->machine_id,
            'discovered_at' => $this->discovered_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            // Human-readable timestamps
            'discovered_at_human' => $this->discovered_at?->diffForHumans(),
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
