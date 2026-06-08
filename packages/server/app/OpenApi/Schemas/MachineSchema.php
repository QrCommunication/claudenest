<?php

declare(strict_types=1);

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Machine',
    description: 'Machine (agent host) resource',
    type: 'object',
    title: 'Machine',
    required: ['id', 'name', 'display_name', 'platform', 'hostname', 'status', 'is_online', 'max_sessions', 'active_sessions_count', 'can_accept_more_sessions', 'created_at', 'updated_at', 'created_at_human'],
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'Unique identifier for the machine'),
        new OA\Property(property: 'name', type: 'string', example: 'my-macbook', description: 'Slug-style identifier for the machine'),
        new OA\Property(property: 'display_name', type: 'string', example: 'My MacBook', description: 'Human-readable display name for the machine'),
        new OA\Property(property: 'platform', type: 'string', enum: ['darwin', 'win32', 'linux'], example: 'darwin', description: 'Operating system platform of the machine'),
        new OA\Property(property: 'hostname', type: 'string', example: 'Johns-MacBook-Pro.local', description: 'System hostname of the machine'),
        new OA\Property(property: 'arch', type: 'string', nullable: true, example: 'arm64', description: 'CPU architecture (e.g. x64, arm64)'),
        new OA\Property(property: 'status', type: 'string', enum: ['online', 'offline', 'connecting'], example: 'online', description: 'Current connection status of the machine'),
        new OA\Property(property: 'is_online', type: 'boolean', example: true, description: "Convenience boolean derived from status === 'online'"),
        new OA\Property(property: 'claude_version', type: 'string', nullable: true, example: '1.2.3', description: 'Version of Claude Code installed on the machine'),
        new OA\Property(property: 'agent_version', type: 'string', nullable: true, example: '1.0.0', description: 'Version of the ClaudeNest agent installed on the machine'),
        new OA\Property(property: 'node_version', type: 'string', nullable: true, example: '20.11.0', description: 'Node.js version running on the machine'),
        new OA\Property(property: 'claude_path', type: 'string', nullable: true, example: '/usr/local/bin/claude', description: 'Absolute path to the Claude Code binary on the machine'),
        new OA\Property(property: 'capabilities', type: 'object', nullable: true, description: "Free-form JSON object describing the machine's feature capabilities", example: ['mcp' => true, 'rag' => true, 'file_locking' => true]),
        new OA\Property(property: 'max_sessions', type: 'integer', example: 10, description: 'Maximum number of concurrent sessions allowed on this machine'),
        new OA\Property(property: 'active_sessions_count', type: 'integer', example: 2, description: 'Number of currently active sessions on the machine'),
        new OA\Property(property: 'can_accept_more_sessions', type: 'boolean', example: true, description: 'True when active_sessions_count < max_sessions and machine is online'),
        new OA\Property(property: 'last_seen_at', type: 'string', format: 'date-time', nullable: true, example: '2024-01-15T10:28:00.000000Z', description: 'ISO 8601 timestamp of the last agent heartbeat received'),
        new OA\Property(property: 'connected_at', type: 'string', format: 'date-time', nullable: true, example: '2024-01-15T10:00:00.000000Z', description: 'ISO 8601 timestamp when the agent last established a connection'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2024-01-01T12:00:00.000000Z', description: 'ISO 8601 timestamp when the machine was registered'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2024-01-15T10:28:00.000000Z', description: 'ISO 8601 timestamp of the last record update'),
        new OA\Property(property: 'last_seen_human', type: 'string', nullable: true, example: '2 minutes ago', description: 'Human-readable relative time since the last agent heartbeat'),
        new OA\Property(property: 'created_at_human', type: 'string', example: '3 days ago', description: 'Human-readable relative time since the machine was registered'),
    ],
)]
#[OA\Schema(
    schema: 'StoreMachineRequest',
    description: 'Payload for registering a new machine',
    type: 'object',
    title: 'StoreMachineRequest',
    required: ['name', 'platform'],
    properties: [
        new OA\Property(property: 'name', type: 'string', example: 'my-macbook', description: 'Unique slug-style identifier for the machine (within the user account)'),
        new OA\Property(property: 'platform', type: 'string', enum: ['darwin', 'win32', 'linux'], example: 'darwin', description: 'Operating system platform of the machine'),
        new OA\Property(property: 'hostname', type: 'string', example: 'Johns-MacBook-Pro.local', description: 'System hostname of the machine'),
        new OA\Property(property: 'capabilities', type: 'object', description: "Free-form JSON object describing the machine's feature capabilities", example: ['mcp' => true, 'rag' => true]),
        new OA\Property(property: 'max_sessions', type: 'integer', example: 10, description: 'Maximum number of concurrent sessions allowed on this machine'),
    ],
)]
#[OA\Schema(
    schema: 'UpdateMachineRequest',
    description: 'Payload for updating an existing machine. All fields are optional.',
    type: 'object',
    title: 'UpdateMachineRequest',
    properties: [
        new OA\Property(property: 'name', type: 'string', example: 'my-macbook', description: 'Unique slug-style identifier for the machine (within the user account)'),
        new OA\Property(property: 'platform', type: 'string', enum: ['darwin', 'win32', 'linux'], example: 'darwin', description: 'Operating system platform of the machine'),
        new OA\Property(property: 'hostname', type: 'string', example: 'Johns-MacBook-Pro.local', description: 'System hostname of the machine'),
        new OA\Property(property: 'capabilities', type: 'object', description: "Free-form JSON object describing the machine's feature capabilities", example: ['mcp' => true, 'rag' => true]),
        new OA\Property(property: 'max_sessions', type: 'integer', example: 10, description: 'Maximum number of concurrent sessions allowed on this machine'),
    ],
)]
class MachineSchema {}
