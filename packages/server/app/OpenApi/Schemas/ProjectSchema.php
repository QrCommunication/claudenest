<?php

namespace App\OpenApi\Schemas;

/**
 * @OA\Schema(
 *     schema="SharedProject",
 *     type="object",
 *     description="A shared project that coordinates multiple Claude instances",
 *     required={"id", "user_id", "machine_id", "name", "project_path", "total_tokens", "max_tokens", "created_at", "updated_at"},
 *     @OA\Property(
 *         property="id",
 *         type="string",
 *         format="uuid",
 *         example="550e8400-e29b-41d4-a716-446655440000",
 *         description="Unique identifier of the project"
 *     ),
 *     @OA\Property(
 *         property="user_id",
 *         type="string",
 *         format="uuid",
 *         example="550e8400-e29b-41d4-a716-446655440001",
 *         description="ID of the user who owns the project"
 *     ),
 *     @OA\Property(
 *         property="machine_id",
 *         type="string",
 *         format="uuid",
 *         example="550e8400-e29b-41d4-a716-446655440002",
 *         description="ID of the machine hosting the project"
 *     ),
 *     @OA\Property(
 *         property="name",
 *         type="string",
 *         example="my-project",
 *         description="Human-readable project name"
 *     ),
 *     @OA\Property(
 *         property="project_path",
 *         type="string",
 *         example="/home/user/projects/my-app",
 *         description="Absolute path to the project directory on the host machine"
 *     ),
 *     @OA\Property(
 *         property="summary",
 *         type="string",
 *         nullable=true,
 *         description="Free-text summary of the project"
 *     ),
 *     @OA\Property(
 *         property="architecture",
 *         type="string",
 *         nullable=true,
 *         description="Architecture notes shared across Claude instances"
 *     ),
 *     @OA\Property(
 *         property="conventions",
 *         type="string",
 *         nullable=true,
 *         description="Coding conventions and standards for the project"
 *     ),
 *     @OA\Property(
 *         property="current_focus",
 *         type="string",
 *         nullable=true,
 *         description="Description of what the project is currently focused on"
 *     ),
 *     @OA\Property(
 *         property="recent_changes",
 *         type="string",
 *         nullable=true,
 *         description="Summary of recent changes made to the project"
 *     ),
 *     @OA\Property(
 *         property="total_tokens",
 *         type="integer",
 *         example=0,
 *         description="Total tokens consumed by context operations for this project"
 *     ),
 *     @OA\Property(
 *         property="max_tokens",
 *         type="integer",
 *         example=100000,
 *         description="Maximum allowed token budget for the project"
 *     ),
 *     @OA\Property(
 *         property="settings",
 *         type="object",
 *         nullable=true,
 *         description="Arbitrary project-level settings stored as a JSON object"
 *     ),
 *     @OA\Property(
 *         property="created_at",
 *         type="string",
 *         format="date-time",
 *         example="2024-01-15T10:30:00.000000Z",
 *         description="ISO 8601 timestamp of when the project was created"
 *     ),
 *     @OA\Property(
 *         property="updated_at",
 *         type="string",
 *         format="date-time",
 *         example="2024-01-15T12:00:00.000000Z",
 *         description="ISO 8601 timestamp of the last update"
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="CreateProjectRequest",
 *     type="object",
 *     description="Payload for creating a new shared project",
 *     required={"name", "project_path"},
 *     @OA\Property(
 *         property="name",
 *         type="string",
 *         example="my-project",
 *         description="Human-readable project name"
 *     ),
 *     @OA\Property(
 *         property="project_path",
 *         type="string",
 *         example="/home/user/projects/my-app",
 *         description="Absolute path to the project directory on the host machine"
 *     ),
 *     @OA\Property(
 *         property="summary",
 *         type="string",
 *         nullable=true,
 *         description="Free-text summary of the project"
 *     ),
 *     @OA\Property(
 *         property="architecture",
 *         type="string",
 *         nullable=true,
 *         description="Architecture notes shared across Claude instances"
 *     ),
 *     @OA\Property(
 *         property="conventions",
 *         type="string",
 *         nullable=true,
 *         description="Coding conventions and standards for the project"
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="UpdateProjectRequest",
 *     type="object",
 *     description="Payload for updating an existing shared project; all fields are optional",
 *     @OA\Property(
 *         property="name",
 *         type="string",
 *         example="my-project",
 *         description="Human-readable project name"
 *     ),
 *     @OA\Property(
 *         property="project_path",
 *         type="string",
 *         example="/home/user/projects/my-app",
 *         description="Absolute path to the project directory on the host machine"
 *     ),
 *     @OA\Property(
 *         property="summary",
 *         type="string",
 *         nullable=true,
 *         description="Free-text summary of the project"
 *     ),
 *     @OA\Property(
 *         property="architecture",
 *         type="string",
 *         nullable=true,
 *         description="Architecture notes shared across Claude instances"
 *     ),
 *     @OA\Property(
 *         property="conventions",
 *         type="string",
 *         nullable=true,
 *         description="Coding conventions and standards for the project"
 *     )
 * )
 */
class ProjectSchema {}
