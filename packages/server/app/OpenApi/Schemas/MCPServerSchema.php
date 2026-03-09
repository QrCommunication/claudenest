<?php

namespace App\OpenApi\Schemas;

/**
 * @OA\Schema(
 *     schema="MCPServer",
 *     type="object",
 *     title="MCPServer",
 *     description="A Model Context Protocol server registered on a machine",
 *     @OA\Property(property="id", type="string", format="uuid"),
 *     @OA\Property(property="name", type="string", example="filesystem"),
 *     @OA\Property(property="display_name", type="string", example="Filesystem MCP"),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="status", type="string", enum={"running", "stopped", "error", "starting"}),
 *     @OA\Property(property="status_color", type="string", example="#22c55e"),
 *     @OA\Property(property="is_running", type="boolean"),
 *     @OA\Property(property="is_stopped", type="boolean"),
 *     @OA\Property(property="has_errors", type="boolean"),
 *     @OA\Property(property="transport", type="string", enum={"stdio", "sse", "streamable-http"}),
 *     @OA\Property(property="command", type="string", nullable=true, example="npx @modelcontextprotocol/server-filesystem"),
 *     @OA\Property(property="url", type="string", nullable=true, format="url"),
 *     @OA\Property(property="env_vars", type="object", nullable=true),
 *     @OA\Property(
 *         property="tools",
 *         type="array",
 *         @OA\Items(type="object")
 *     ),
 *     @OA\Property(property="tools_count", type="integer"),
 *     @OA\Property(property="config", type="object", nullable=true),
 *     @OA\Property(property="machine_id", type="string", format="uuid"),
 *     @OA\Property(property="uptime", type="integer", nullable=true, description="Uptime in seconds"),
 *     @OA\Property(property="error_message", type="string", nullable=true),
 *     @OA\Property(property="started_at", type="string", nullable=true, format="date-time"),
 *     @OA\Property(property="stopped_at", type="string", nullable=true, format="date-time"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time"),
 *     @OA\Property(property="started_at_human", type="string", nullable=true),
 *     @OA\Property(property="created_at_human", type="string")
 * )
 *
 * @OA\Schema(
 *     schema="RegisterMCPServerRequest",
 *     type="object",
 *     title="RegisterMCPServerRequest",
 *     required={"name", "transport"},
 *     @OA\Property(property="name", type="string", description="Unique MCP server identifier"),
 *     @OA\Property(property="transport", type="string", enum={"stdio", "sse", "streamable-http"}, description="Transport protocol"),
 *     @OA\Property(property="command", type="string", description="Command to launch the server (for stdio transport)"),
 *     @OA\Property(property="url", type="string", description="Server URL (for sse or streamable-http transport)"),
 *     @OA\Property(property="description", type="string", description="Human-readable description"),
 *     @OA\Property(property="env_vars", type="object", description="Environment variables to pass to the server"),
 *     @OA\Property(property="config", type="object", description="Additional server configuration")
 * )
 *
 * @OA\Schema(
 *     schema="ExecuteToolRequest",
 *     type="object",
 *     title="ExecuteToolRequest",
 *     required={"tool_name"},
 *     @OA\Property(property="tool_name", type="string", description="Name of the MCP tool to execute"),
 *     @OA\Property(property="arguments", type="object", description="Arguments to pass to the tool")
 * )
 */
class MCPServerSchema {}
