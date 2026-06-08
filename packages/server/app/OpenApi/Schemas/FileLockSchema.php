<?php

declare(strict_types=1);

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'FileLock',
    description: 'A file lock preventing concurrent edits by multiple agents',
    type: 'object',
    title: 'FileLock',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'project_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'path', type: 'string', example: 'src/auth.ts'),
        new OA\Property(property: 'locked_by', type: 'string', description: 'Claude instance ID'),
        new OA\Property(property: 'reason', type: 'string', example: 'Editing authentication module', nullable: true),
        new OA\Property(property: 'locked_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'expires_at', type: 'string', format: 'date-time'),
    ],
)]
#[OA\Schema(
    schema: 'CreateFileLockRequest',
    description: '',
    type: 'object',
    title: 'CreateFileLockRequest',
    required: ['path', 'locked_by'],
    properties: [
        new OA\Property(property: 'path', type: 'string', description: 'Path of the file to lock'),
        new OA\Property(property: 'locked_by', type: 'string', description: 'Claude instance ID requesting the lock'),
        new OA\Property(property: 'reason', type: 'string', description: 'Optional reason for locking the file'),
        new OA\Property(property: 'expires_in', type: 'integer', default: 30, description: 'Minutes until expiry'),
    ],
)]
#[OA\Schema(
    schema: 'BulkFileLockRequest',
    description: '',
    type: 'object',
    title: 'BulkFileLockRequest',
    required: ['paths', 'locked_by'],
    properties: [
        new OA\Property(
            property: 'paths',
            type: 'array',
            description: 'List of file paths to lock',
            items: new OA\Items(type: 'string'),
        ),
        new OA\Property(property: 'locked_by', type: 'string', description: 'Claude instance ID requesting the locks'),
        new OA\Property(property: 'reason', type: 'string', description: 'Optional reason for locking the files'),
    ],
)]
class FileLockSchema {}
