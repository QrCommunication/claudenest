<?php

namespace App\OpenApi\Schemas;

/**
 * @OA\Schema(
 *     schema="SharedTask",
 *     type="object",
 *     description="A task within a shared project that can be claimed and worked on by a Claude instance",
 *     required={"id", "project_id", "title", "priority", "status", "dependencies", "files", "files_modified", "created_at", "updated_at"},
 *     @OA\Property(
 *         property="id",
 *         type="string",
 *         format="uuid",
 *         example="550e8400-e29b-41d4-a716-446655440000",
 *         description="Unique identifier of the task"
 *     ),
 *     @OA\Property(
 *         property="project_id",
 *         type="string",
 *         format="uuid",
 *         example="550e8400-e29b-41d4-a716-446655440001",
 *         description="ID of the parent shared project"
 *     ),
 *     @OA\Property(
 *         property="title",
 *         type="string",
 *         example="Implement authentication",
 *         description="Short title summarising the task"
 *     ),
 *     @OA\Property(
 *         property="description",
 *         type="string",
 *         nullable=true,
 *         description="Detailed description of what the task entails"
 *     ),
 *     @OA\Property(
 *         property="priority",
 *         type="string",
 *         enum={"low", "medium", "high", "critical"},
 *         example="medium",
 *         description="Priority level of the task"
 *     ),
 *     @OA\Property(
 *         property="status",
 *         type="string",
 *         enum={"pending", "in_progress", "blocked", "review", "done"},
 *         example="pending",
 *         description="Current lifecycle status of the task"
 *     ),
 *     @OA\Property(
 *         property="assigned_to",
 *         type="string",
 *         nullable=true,
 *         description="ID of the Claude instance that has claimed this task"
 *     ),
 *     @OA\Property(
 *         property="claimed_at",
 *         type="string",
 *         format="date-time",
 *         nullable=true,
 *         example="2024-01-15T10:30:00.000000Z",
 *         description="ISO 8601 timestamp of when the task was claimed"
 *     ),
 *     @OA\Property(
 *         property="dependencies",
 *         type="array",
 *         description="List of task IDs that must be completed before this task can start",
 *         @OA\Items(
 *             type="string",
 *             format="uuid"
 *         )
 *     ),
 *     @OA\Property(
 *         property="blocked_by",
 *         type="string",
 *         nullable=true,
 *         description="Human-readable explanation of why the task is currently blocked"
 *     ),
 *     @OA\Property(
 *         property="files",
 *         type="array",
 *         description="List of file paths related to this task",
 *         @OA\Items(type="string")
 *     ),
 *     @OA\Property(
 *         property="estimated_tokens",
 *         type="integer",
 *         nullable=true,
 *         example=5000,
 *         description="Estimated number of tokens required to complete the task"
 *     ),
 *     @OA\Property(
 *         property="completed_at",
 *         type="string",
 *         format="date-time",
 *         nullable=true,
 *         example="2024-01-15T14:00:00.000000Z",
 *         description="ISO 8601 timestamp of when the task was completed"
 *     ),
 *     @OA\Property(
 *         property="completion_summary",
 *         type="string",
 *         nullable=true,
 *         description="Summary of work done when the task was marked complete"
 *     ),
 *     @OA\Property(
 *         property="files_modified",
 *         type="array",
 *         description="List of file paths that were modified while completing the task",
 *         @OA\Items(type="string")
 *     ),
 *     @OA\Property(
 *         property="created_by",
 *         type="string",
 *         nullable=true,
 *         description="ID of the Claude instance or user that created the task"
 *     ),
 *     @OA\Property(
 *         property="created_at",
 *         type="string",
 *         format="date-time",
 *         example="2024-01-15T09:00:00.000000Z",
 *         description="ISO 8601 timestamp of when the task was created"
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
 *     schema="CreateTaskRequest",
 *     type="object",
 *     description="Payload for creating a new task within a shared project",
 *     required={"title"},
 *     @OA\Property(
 *         property="title",
 *         type="string",
 *         example="Implement authentication",
 *         description="Short title summarising the task"
 *     ),
 *     @OA\Property(
 *         property="description",
 *         type="string",
 *         nullable=true,
 *         description="Detailed description of what the task entails"
 *     ),
 *     @OA\Property(
 *         property="priority",
 *         type="string",
 *         enum={"low", "medium", "high", "critical"},
 *         example="medium",
 *         description="Priority level of the task; defaults to medium when omitted"
 *     ),
 *     @OA\Property(
 *         property="dependencies",
 *         type="array",
 *         description="List of task IDs that must be completed before this task can start",
 *         @OA\Items(
 *             type="string",
 *             format="uuid"
 *         )
 *     ),
 *     @OA\Property(
 *         property="files",
 *         type="array",
 *         description="List of file paths related to this task",
 *         @OA\Items(type="string")
 *     ),
 *     @OA\Property(
 *         property="estimated_tokens",
 *         type="integer",
 *         nullable=true,
 *         example=5000,
 *         description="Estimated number of tokens required to complete the task"
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="CompleteTaskRequest",
 *     type="object",
 *     description="Payload for marking a task as completed",
 *     required={"completion_summary"},
 *     @OA\Property(
 *         property="completion_summary",
 *         type="string",
 *         example="Implemented JWT-based authentication with refresh tokens.",
 *         description="Summary of the work done to complete the task"
 *     ),
 *     @OA\Property(
 *         property="files_modified",
 *         type="array",
 *         description="List of file paths that were modified while completing the task",
 *         @OA\Items(type="string")
 *     )
 * )
 */
class TaskSchema {}
