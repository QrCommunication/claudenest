<?php

declare(strict_types=1);

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'SessionLog',
    title: 'SessionLog',
    description: 'A log entry for a terminal session capturing input, output, errors and system events',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'session_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'type', type: 'string', enum: ['input', 'output', 'error', 'system'], example: 'output'),
        new OA\Property(property: 'data', type: 'string', description: 'Raw log content'),
        new OA\Property(property: 'metadata', type: 'object', description: 'Additional metadata for the log entry', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
    ],
)]
class SessionLogSchema {}
