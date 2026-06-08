<?php

declare(strict_types=1);

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'SharedTask',
    description: 'A task within a shared project that can be claimed and worked on by a Claude instance',
    type: 'object',
    required: ['id', 'project_id', 'title', 'priority', 'status', 'dependencies', 'files', 'files_modified', 'created_at', 'updated_at'],
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000', description: 'Unique identifier of the task'),
        new OA\Property(property: 'project_id', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001', description: 'ID of the parent shared project'),
        new OA\Property(property: 'title', type: 'string', example: 'Implement authentication', description: 'Short title summarising the task'),
        new OA\Property(property: 'description', type: 'string', description: 'Detailed description of what the task entails', nullable: true),
        new OA\Property(property: 'priority', type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'medium', description: 'Priority level of the task'),
        new OA\Property(property: 'status', type: 'string', enum: ['pending', 'in_progress', 'blocked', 'review', 'done'], example: 'pending', description: 'Current lifecycle status of the task'),
        new OA\Property(property: 'assigned_to', type: 'string', description: 'ID of the Claude instance that has claimed this task', nullable: true),
        new OA\Property(property: 'claimed_at', type: 'string', format: 'date-time', example: '2024-01-15T10:30:00.000000Z', description: 'ISO 8601 timestamp of when the task was claimed', nullable: true),
        new OA\Property(property: 'dependencies', type: 'array', description: 'List of task IDs that must be completed before this task can start', items: new OA\Items(type: 'string', format: 'uuid')),
        new OA\Property(property: 'blocked_by', type: 'string', description: 'Human-readable explanation of why the task is currently blocked', nullable: true),
        new OA\Property(property: 'files', type: 'array', description: 'List of file paths related to this task', items: new OA\Items(type: 'string')),
        new OA\Property(property: 'estimated_tokens', type: 'integer', example: 5000, description: 'Estimated number of tokens required to complete the task', nullable: true),
        new OA\Property(property: 'completed_at', type: 'string', format: 'date-time', example: '2024-01-15T14:00:00.000000Z', description: 'ISO 8601 timestamp of when the task was completed', nullable: true),
        new OA\Property(property: 'completion_summary', type: 'string', description: 'Summary of work done when the task was marked complete', nullable: true),
        new OA\Property(property: 'files_modified', type: 'array', description: 'List of file paths that were modified while completing the task', items: new OA\Items(type: 'string')),
        new OA\Property(property: 'created_by', type: 'string', description: 'ID of the Claude instance or user that created the task', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2024-01-15T09:00:00.000000Z', description: 'ISO 8601 timestamp of when the task was created'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2024-01-15T12:00:00.000000Z', description: 'ISO 8601 timestamp of the last update'),
    ],
)]
#[OA\Schema(
    schema: 'CreateTaskRequest',
    description: 'Payload for creating a new task within a shared project',
    type: 'object',
    required: ['title'],
    properties: [
        new OA\Property(property: 'title', type: 'string', example: 'Implement authentication', description: 'Short title summarising the task'),
        new OA\Property(property: 'description', type: 'string', description: 'Detailed description of what the task entails', nullable: true),
        new OA\Property(property: 'priority', type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'medium', description: 'Priority level of the task; defaults to medium when omitted'),
        new OA\Property(property: 'dependencies', type: 'array', description: 'List of task IDs that must be completed before this task can start', items: new OA\Items(type: 'string', format: 'uuid')),
        new OA\Property(property: 'files', type: 'array', description: 'List of file paths related to this task', items: new OA\Items(type: 'string')),
        new OA\Property(property: 'estimated_tokens', type: 'integer', example: 5000, description: 'Estimated number of tokens required to complete the task', nullable: true),
    ],
)]
#[OA\Schema(
    schema: 'CompleteTaskRequest',
    description: 'Payload for marking a task as completed',
    type: 'object',
    required: ['completion_summary'],
    properties: [
        new OA\Property(property: 'completion_summary', type: 'string', example: 'Implemented JWT-based authentication with refresh tokens.', description: 'Summary of the work done to complete the task'),
        new OA\Property(property: 'files_modified', type: 'array', description: 'List of file paths that were modified while completing the task', items: new OA\Items(type: 'string')),
    ],
)]
class TaskSchema {}
