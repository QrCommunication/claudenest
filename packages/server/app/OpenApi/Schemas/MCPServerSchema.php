<?php

declare(strict_types=1);

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'MCPServer',
    title: 'MCPServer',
    description: 'A Model Context Protocol server registered on a machine',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'name', type: 'string', example: 'filesystem'),
        new OA\Property(property: 'display_name', type: 'string', example: 'Filesystem MCP'),
        new OA\Property(property: 'description', type: 'string', nullable: true),
        new OA\Property(property: 'status', type: 'string', enum: ['running', 'stopped', 'error', 'starting']),
        new OA\Property(property: 'status_color', type: 'string', example: '#22c55e'),
        new OA\Property(property: 'is_running', type: 'boolean'),
        new OA\Property(property: 'is_stopped', type: 'boolean'),
        new OA\Property(property: 'has_errors', type: 'boolean'),
        new OA\Property(property: 'transport', type: 'string', enum: ['stdio', 'sse', 'streamable-http']),
        new OA\Property(property: 'command', type: 'string', example: 'npx @modelcontextprotocol/server-filesystem', nullable: true),
        new OA\Property(property: 'url', type: 'string', format: 'url', nullable: true),
        new OA\Property(property: 'env_vars', type: 'object', nullable: true),
        new OA\Property(property: 'tools', type: 'array', items: new OA\Items(type: 'object')),
        new OA\Property(property: 'tools_count', type: 'integer'),
        new OA\Property(property: 'config', type: 'object', nullable: true),
        new OA\Property(property: 'machine_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'uptime', type: 'integer', description: 'Uptime in seconds', nullable: true),
        new OA\Property(property: 'error_message', type: 'string', nullable: true),
        new OA\Property(property: 'started_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'stopped_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'started_at_human', type: 'string', nullable: true),
        new OA\Property(property: 'created_at_human', type: 'string'),
    ],
)]
#[OA\Schema(
    schema: 'RegisterMCPServerRequest',
    title: 'RegisterMCPServerRequest',
    type: 'object',
    required: ['name', 'transport'],
    properties: [
        new OA\Property(property: 'name', type: 'string', description: 'Unique MCP server identifier'),
        new OA\Property(property: 'transport', type: 'string', enum: ['stdio', 'sse', 'streamable-http'], description: 'Transport protocol'),
        new OA\Property(property: 'command', type: 'string', description: 'Command to launch the server (for stdio transport)'),
        new OA\Property(property: 'url', type: 'string', description: 'Server URL (for sse or streamable-http transport)'),
        new OA\Property(property: 'description', type: 'string', description: 'Human-readable description'),
        new OA\Property(property: 'env_vars', type: 'object', description: 'Environment variables to pass to the server'),
        new OA\Property(property: 'config', type: 'object', description: 'Additional server configuration'),
    ],
)]
#[OA\Schema(
    schema: 'ExecuteToolRequest',
    title: 'ExecuteToolRequest',
    type: 'object',
    required: ['tool_name'],
    properties: [
        new OA\Property(property: 'tool_name', type: 'string', description: 'Name of the MCP tool to execute'),
        new OA\Property(property: 'arguments', type: 'object', description: 'Arguments to pass to the tool'),
    ],
)]
class MCPServerSchema {}
