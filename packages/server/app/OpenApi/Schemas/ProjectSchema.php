<?php

declare(strict_types=1);

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'SharedProject',
    description: 'A shared project that coordinates multiple Claude instances',
    type: 'object',
    required: ['id', 'user_id', 'machine_id', 'name', 'project_path', 'total_tokens', 'max_tokens', 'created_at', 'updated_at'],
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000', description: 'Unique identifier of the project'),
        new OA\Property(property: 'user_id', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001', description: 'ID of the user who owns the project'),
        new OA\Property(property: 'machine_id', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440002', description: 'ID of the machine hosting the project'),
        new OA\Property(property: 'name', type: 'string', example: 'my-project', description: 'Human-readable project name'),
        new OA\Property(property: 'project_path', type: 'string', example: '/home/user/projects/my-app', description: 'Absolute path to the project directory on the host machine'),
        new OA\Property(property: 'summary', type: 'string', description: 'Free-text summary of the project', nullable: true),
        new OA\Property(property: 'architecture', type: 'string', description: 'Architecture notes shared across Claude instances', nullable: true),
        new OA\Property(property: 'conventions', type: 'string', description: 'Coding conventions and standards for the project', nullable: true),
        new OA\Property(property: 'current_focus', type: 'string', description: 'Description of what the project is currently focused on', nullable: true),
        new OA\Property(property: 'recent_changes', type: 'string', description: 'Summary of recent changes made to the project', nullable: true),
        new OA\Property(property: 'total_tokens', type: 'integer', example: 0, description: 'Total tokens consumed by context operations for this project'),
        new OA\Property(property: 'max_tokens', type: 'integer', example: 100000, description: 'Maximum allowed token budget for the project'),
        new OA\Property(property: 'settings', type: 'object', description: 'Arbitrary project-level settings stored as a JSON object', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2024-01-15T10:30:00.000000Z', description: 'ISO 8601 timestamp of when the project was created'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2024-01-15T12:00:00.000000Z', description: 'ISO 8601 timestamp of the last update'),
    ],
)]
#[OA\Schema(
    schema: 'CreateProjectRequest',
    description: 'Payload for creating a new shared project',
    type: 'object',
    required: ['name', 'project_path'],
    properties: [
        new OA\Property(property: 'name', type: 'string', example: 'my-project', description: 'Human-readable project name'),
        new OA\Property(property: 'project_path', type: 'string', example: '/home/user/projects/my-app', description: 'Absolute path to the project directory on the host machine'),
        new OA\Property(property: 'summary', type: 'string', description: 'Free-text summary of the project', nullable: true),
        new OA\Property(property: 'architecture', type: 'string', description: 'Architecture notes shared across Claude instances', nullable: true),
        new OA\Property(property: 'conventions', type: 'string', description: 'Coding conventions and standards for the project', nullable: true),
    ],
)]
#[OA\Schema(
    schema: 'UpdateProjectRequest',
    description: 'Payload for updating an existing shared project; all fields are optional',
    type: 'object',
    properties: [
        new OA\Property(property: 'name', type: 'string', example: 'my-project', description: 'Human-readable project name'),
        new OA\Property(property: 'project_path', type: 'string', example: '/home/user/projects/my-app', description: 'Absolute path to the project directory on the host machine'),
        new OA\Property(property: 'summary', type: 'string', description: 'Free-text summary of the project', nullable: true),
        new OA\Property(property: 'architecture', type: 'string', description: 'Architecture notes shared across Claude instances', nullable: true),
        new OA\Property(property: 'conventions', type: 'string', description: 'Coding conventions and standards for the project', nullable: true),
    ],
)]
class ProjectSchema {}
