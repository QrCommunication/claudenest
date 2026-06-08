<?php

declare(strict_types=1);

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'ActivityLog',
    description: 'An activity log entry tracking agent actions within a project',
    type: 'object',
    title: 'ActivityLog',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'project_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'instance_id', type: 'string', description: 'Claude instance ID that generated the activity', nullable: true),
        new OA\Property(property: 'type', type: 'string', example: 'task_completed'),
        new OA\Property(property: 'details', type: 'object', description: 'Additional details about the activity', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
    ],
)]
class ActivityLogSchema {}
