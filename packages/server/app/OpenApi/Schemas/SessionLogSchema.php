<?php

namespace App\OpenApi\Schemas;

/**
 * @OA\Schema(
 *     schema="SessionLog",
 *     type="object",
 *     title="SessionLog",
 *     description="A log entry for a terminal session capturing input, output, errors and system events",
 *     @OA\Property(property="id", type="string", format="uuid"),
 *     @OA\Property(property="session_id", type="string", format="uuid"),
 *     @OA\Property(
 *         property="type",
 *         type="string",
 *         enum={"input", "output", "error", "system"},
 *         example="output"
 *     ),
 *     @OA\Property(property="data", type="string", description="Raw log content"),
 *     @OA\Property(property="metadata", type="object", nullable=true, description="Additional metadata for the log entry"),
 *     @OA\Property(property="created_at", type="string", format="date-time")
 * )
 */
class SessionLogSchema {}
