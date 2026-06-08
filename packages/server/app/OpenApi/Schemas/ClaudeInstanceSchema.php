<?php

declare(strict_types=1);

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'ClaudeInstance',
    description: 'A running Claude Code agent instance attached to a project',
    type: 'object',
    title: 'ClaudeInstance',
    properties: [
        new OA\Property(property: 'id', type: 'string', description: 'Instance identifier'),
        new OA\Property(property: 'project_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'session_id', type: 'string', format: 'uuid', nullable: true),
        new OA\Property(property: 'machine_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'status', type: 'string', enum: ['active', 'idle', 'busy', 'disconnected']),
        new OA\Property(property: 'current_task_id', type: 'string', format: 'uuid', nullable: true),
        new OA\Property(property: 'context_tokens', type: 'integer'),
        new OA\Property(property: 'max_context_tokens', type: 'integer'),
        new OA\Property(property: 'tasks_completed', type: 'integer'),
        new OA\Property(property: 'connected_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'last_activity_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'disconnected_at', type: 'string', format: 'date-time', nullable: true),
    ],
)]
class ClaudeInstanceSchema {}
