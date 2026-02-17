<?php

namespace App\OpenApi\Schemas;

/**
 * @OA\Schema(
 *     schema="Skill",
 *     type="object",
 *     title="Skill",
 *     description="A skill registered on a machine",
 *     @OA\Property(property="id", type="string", format="uuid"),
 *     @OA\Property(property="name", type="string", example="code-review"),
 *     @OA\Property(property="display_name", type="string", example="Code Review"),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="category", type="string", nullable=true, example="development"),
 *     @OA\Property(property="category_color", type="string", nullable=true, example="#a855f7"),
 *     @OA\Property(property="path", type="string", example="/skills/code-review"),
 *     @OA\Property(property="version", type="string", nullable=true, example="1.0.0"),
 *     @OA\Property(property="enabled", type="boolean"),
 *     @OA\Property(property="config", type="object", nullable=true),
 *     @OA\Property(
 *         property="tags",
 *         type="array",
 *         @OA\Items(type="string")
 *     ),
 *     @OA\Property(
 *         property="examples",
 *         type="array",
 *         @OA\Items(type="string")
 *     ),
 *     @OA\Property(property="has_config", type="boolean"),
 *     @OA\Property(property="machine_id", type="string", format="uuid"),
 *     @OA\Property(property="discovered_at", type="string", nullable=true, format="date-time"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time"),
 *     @OA\Property(property="discovered_at_human", type="string", nullable=true),
 *     @OA\Property(property="created_at_human", type="string")
 * )
 *
 * @OA\Schema(
 *     schema="RegisterSkillRequest",
 *     type="object",
 *     title="RegisterSkillRequest",
 *     required={"name", "path"},
 *     @OA\Property(property="name", type="string", description="Unique skill identifier"),
 *     @OA\Property(property="path", type="string", description="Filesystem path to the skill"),
 *     @OA\Property(property="description", type="string", description="Human-readable description"),
 *     @OA\Property(property="category", type="string", description="Skill category for grouping"),
 *     @OA\Property(property="version", type="string", description="Skill version"),
 *     @OA\Property(property="config", type="object", description="Skill configuration object"),
 *     @OA\Property(
 *         property="tags",
 *         type="array",
 *         description="Tags for filtering and discovery",
 *         @OA\Items(type="string")
 *     ),
 *     @OA\Property(
 *         property="examples",
 *         type="array",
 *         description="Usage examples",
 *         @OA\Items(type="string")
 *     )
 * )
 */
class SkillSchema {}
