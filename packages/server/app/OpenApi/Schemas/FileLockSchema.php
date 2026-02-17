<?php

namespace App\OpenApi\Schemas;

/**
 * @OA\Schema(
 *     schema="FileLock",
 *     type="object",
 *     title="FileLock",
 *     description="A file lock preventing concurrent edits by multiple agents",
 *     @OA\Property(property="id", type="string", format="uuid"),
 *     @OA\Property(property="project_id", type="string", format="uuid"),
 *     @OA\Property(property="path", type="string", example="src/auth.ts"),
 *     @OA\Property(property="locked_by", type="string", description="Claude instance ID"),
 *     @OA\Property(property="reason", type="string", nullable=true, example="Editing authentication module"),
 *     @OA\Property(property="locked_at", type="string", format="date-time"),
 *     @OA\Property(property="expires_at", type="string", format="date-time")
 * )
 *
 * @OA\Schema(
 *     schema="CreateFileLockRequest",
 *     type="object",
 *     title="CreateFileLockRequest",
 *     required={"path", "locked_by"},
 *     @OA\Property(property="path", type="string", description="Path of the file to lock"),
 *     @OA\Property(property="locked_by", type="string", description="Claude instance ID requesting the lock"),
 *     @OA\Property(property="reason", type="string", description="Optional reason for locking the file"),
 *     @OA\Property(property="expires_in", type="integer", description="Minutes until expiry", default=30)
 * )
 *
 * @OA\Schema(
 *     schema="BulkFileLockRequest",
 *     type="object",
 *     title="BulkFileLockRequest",
 *     required={"paths", "locked_by"},
 *     @OA\Property(
 *         property="paths",
 *         type="array",
 *         description="List of file paths to lock",
 *         @OA\Items(type="string")
 *     ),
 *     @OA\Property(property="locked_by", type="string", description="Claude instance ID requesting the locks"),
 *     @OA\Property(property="reason", type="string", description="Optional reason for locking the files")
 * )
 */
class FileLockSchema {}
