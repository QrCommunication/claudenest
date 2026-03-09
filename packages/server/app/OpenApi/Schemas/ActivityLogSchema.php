<?php

namespace App\OpenApi\Schemas;

/**
 * @OA\Schema(
 *     schema="ActivityLog",
 *     type="object",
 *     title="ActivityLog",
 *     description="An activity log entry tracking agent actions within a project",
 *     @OA\Property(property="id", type="string", format="uuid"),
 *     @OA\Property(property="project_id", type="string", format="uuid"),
 *     @OA\Property(property="instance_id", type="string", nullable=true, description="Claude instance ID that generated the activity"),
 *     @OA\Property(property="type", type="string", example="task_completed"),
 *     @OA\Property(property="details", type="object", nullable=true, description="Additional details about the activity"),
 *     @OA\Property(property="created_at", type="string", format="date-time")
 * )
 */
class ActivityLogSchema {}
