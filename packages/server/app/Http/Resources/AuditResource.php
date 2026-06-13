<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Audit-trail entry (an activity_log row) formatted for the public audit view.
 *
 * Exposes the event type, its derived human message/icon/color, the acting
 * instance (actor), the structured details and both ISO + human timestamps so
 * the dashboard can render a readable, paginated audit trail.
 *
 * @mixin ActivityLog
 */
class AuditResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'message' => $this->message,
            'icon' => $this->icon,
            'color' => $this->color,
            'instance_id' => $this->instance_id,
            'details' => $this->details,
            'created_at' => $this->created_at?->toIso8601String(),
            'created_at_human' => $this->created_at?->diffForHumans(),
        ];
    }
}
