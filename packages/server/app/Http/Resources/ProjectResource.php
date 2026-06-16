<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\SharedProject;
use App\Services\TokenPricingService;
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
            'is_archived' => $project->is_archived,
            'archived_at' => $project->archived_at?->toIso8601String(),
            'has_archived_context' => ! empty($project->archived_context),
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

            // USD cost estimate derived from the project-level token counter. We
            // use estimateFromTotalTokens (input/output split via the configured
            // ratio) rather than a per-session aggregate so the resource stays
            // query-free — the precise per-session breakdown lives in the
            // dedicated GET /projects/{id}/token-budget endpoint.
            $pricing = app(TokenPricingService::class);
            $data['estimated_cost_usd'] = round(
                $pricing->estimateFromTotalTokens(null, (int) $project->total_tokens),
                4,
            );
            $data['cost_currency'] = 'USD';
            $data['pricing_model'] = $pricing->resolveModel(null);
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
