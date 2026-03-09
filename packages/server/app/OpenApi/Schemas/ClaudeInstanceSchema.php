<?php

namespace App\OpenApi\Schemas;

/**
 * @OA\Schema(
 *     schema="ClaudeInstance",
 *     type="object",
 *     title="ClaudeInstance",
 *     description="A running Claude Code agent instance attached to a project",
 *     @OA\Property(property="id", type="string", description="Instance identifier"),
 *     @OA\Property(property="project_id", type="string", format="uuid"),
 *     @OA\Property(property="session_id", type="string", nullable=true, format="uuid"),
 *     @OA\Property(property="machine_id", type="string", format="uuid"),
 *     @OA\Property(property="status", type="string", enum={"active", "idle", "busy", "disconnected"}),
 *     @OA\Property(property="current_task_id", type="string", nullable=true, format="uuid"),
 *     @OA\Property(property="context_tokens", type="integer"),
 *     @OA\Property(property="max_context_tokens", type="integer"),
 *     @OA\Property(property="tasks_completed", type="integer"),
 *     @OA\Property(property="connected_at", type="string", format="date-time"),
 *     @OA\Property(property="last_activity_at", type="string", nullable=true, format="date-time"),
 *     @OA\Property(property="disconnected_at", type="string", nullable=true, format="date-time")
 * )
 */
class ClaudeInstanceSchema {}
