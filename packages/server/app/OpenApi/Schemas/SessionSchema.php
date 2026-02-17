<?php

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

/**
 * @OA\Schema(
 *     schema="Session",
 *     type="object",
 *     description="Terminal session resource",
 *     required={"id", "machine_id", "user_id", "mode", "status", "is_running", "is_completed", "pty_size", "created_at", "updated_at"},
 *     @OA\Property(
 *         property="id",
 *         type="string",
 *         format="uuid",
 *         example="7c9e6679-7425-40de-944b-e07fc1f90ae7",
 *         description="Unique identifier for the session"
 *     ),
 *     @OA\Property(
 *         property="machine_id",
 *         type="string",
 *         format="uuid",
 *         example="3fa85f64-5717-4562-b3fc-2c963f66afa6",
 *         description="UUID of the machine hosting this session"
 *     ),
 *     @OA\Property(
 *         property="user_id",
 *         type="string",
 *         format="uuid",
 *         example="9d8f3c2a-1b4e-4f7d-a9c6-2e5b8f0d3a71",
 *         description="UUID of the user who owns this session"
 *     ),
 *     @OA\Property(
 *         property="mode",
 *         type="string",
 *         enum={"interactive", "headless", "oneshot"},
 *         example="interactive",
 *         description="Execution mode of the session"
 *     ),
 *     @OA\Property(
 *         property="project_path",
 *         type="string",
 *         nullable=true,
 *         example="/home/user/projects/myapp",
 *         description="Absolute working directory path for the session on the remote machine"
 *     ),
 *     @OA\Property(
 *         property="initial_prompt",
 *         type="string",
 *         nullable=true,
 *         example="Review the authentication module and suggest improvements",
 *         description="Initial prompt sent to Claude Code when the session starts"
 *     ),
 *     @OA\Property(
 *         property="status",
 *         type="string",
 *         enum={"pending", "starting", "running", "paused", "completed", "failed", "terminated"},
 *         example="running",
 *         description="Current lifecycle status of the session"
 *     ),
 *     @OA\Property(
 *         property="is_running",
 *         type="boolean",
 *         example=true,
 *         description="True when status is 'running'"
 *     ),
 *     @OA\Property(
 *         property="is_completed",
 *         type="boolean",
 *         example=false,
 *         description="True when status is one of: completed, failed, terminated"
 *     ),
 *     @OA\Property(
 *         property="pid",
 *         type="integer",
 *         nullable=true,
 *         example=12345,
 *         description="Process ID of the PTY process on the remote machine"
 *     ),
 *     @OA\Property(
 *         property="exit_code",
 *         type="integer",
 *         nullable=true,
 *         example=0,
 *         description="Exit code of the process once the session ends"
 *     ),
 *     @OA\Property(
 *         property="pty_size",
 *         type="object",
 *         description="Terminal dimensions for the PTY",
 *         required={"cols", "rows"},
 *         @OA\Property(
 *             property="cols",
 *             type="integer",
 *             example=220,
 *             description="Number of terminal columns"
 *         ),
 *         @OA\Property(
 *             property="rows",
 *             type="integer",
 *             example=50,
 *             description="Number of terminal rows"
 *         )
 *     ),
 *     @OA\Property(
 *         property="total_tokens",
 *         type="integer",
 *         nullable=true,
 *         example=15420,
 *         description="Total number of tokens consumed by the session"
 *     ),
 *     @OA\Property(
 *         property="total_cost",
 *         type="number",
 *         format="float",
 *         nullable=true,
 *         example=0.0462,
 *         description="Estimated cost of the session in USD"
 *     ),
 *     @OA\Property(
 *         property="credential_id",
 *         type="string",
 *         format="uuid",
 *         nullable=true,
 *         example="b1e2c3d4-5678-4abc-9def-0123456789ab",
 *         description="UUID of the credential used for this session, or null to use the default"
 *     ),
 *     @OA\Property(
 *         property="duration",
 *         type="integer",
 *         nullable=true,
 *         example=330,
 *         description="Duration of the session in seconds"
 *     ),
 *     @OA\Property(
 *         property="formatted_duration",
 *         type="string",
 *         nullable=true,
 *         example="5m 30s",
 *         description="Human-readable duration of the session"
 *     ),
 *     @OA\Property(
 *         property="started_at",
 *         type="string",
 *         format="date-time",
 *         nullable=true,
 *         example="2024-01-15T10:00:00.000000Z",
 *         description="ISO 8601 timestamp when the session process started"
 *     ),
 *     @OA\Property(
 *         property="completed_at",
 *         type="string",
 *         format="date-time",
 *         nullable=true,
 *         example="2024-01-15T10:05:30.000000Z",
 *         description="ISO 8601 timestamp when the session process ended"
 *     ),
 *     @OA\Property(
 *         property="created_at",
 *         type="string",
 *         format="date-time",
 *         example="2024-01-15T09:59:55.000000Z",
 *         description="ISO 8601 timestamp when the session record was created"
 *     ),
 *     @OA\Property(
 *         property="updated_at",
 *         type="string",
 *         format="date-time",
 *         example="2024-01-15T10:05:30.000000Z",
 *         description="ISO 8601 timestamp when the session record was last updated"
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="CreateSessionRequest",
 *     type="object",
 *     description="Payload for creating a new terminal session on a machine",
 *     required={"mode"},
 *     @OA\Property(
 *         property="mode",
 *         type="string",
 *         enum={"interactive", "headless", "oneshot"},
 *         example="interactive",
 *         description="Execution mode: interactive (PTY attached), headless (background), oneshot (single prompt)"
 *     ),
 *     @OA\Property(
 *         property="project_path",
 *         type="string",
 *         example="/home/user/projects/myapp",
 *         description="Absolute working directory path on the remote machine"
 *     ),
 *     @OA\Property(
 *         property="initial_prompt",
 *         type="string",
 *         example="Review the authentication module and suggest improvements",
 *         description="Initial prompt to send to Claude Code on session start (required for headless/oneshot modes)"
 *     ),
 *     @OA\Property(
 *         property="credential_id",
 *         type="string",
 *         format="uuid",
 *         example="b1e2c3d4-5678-4abc-9def-0123456789ab",
 *         description="UUID of a specific credential to use for this session. Omit to use the user's default credential."
 *     )
 * )
 */
class SessionSchema {}
