<?php

namespace App\OpenApi\Schemas;

/**
 * @OA\Schema(
 *     schema="DiscoveredCommand",
 *     type="object",
 *     title="DiscoveredCommand",
 *     description="A command discovered on a machine",
 *     @OA\Property(property="id", type="string", format="uuid"),
 *     @OA\Property(property="name", type="string", example="artisan:migrate"),
 *     @OA\Property(property="display_name", type="string", example="Artisan Migrate"),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="category", type="string", nullable=true, example="artisan"),
 *     @OA\Property(property="category_color", type="string", nullable=true),
 *     @OA\Property(property="signature", type="string", nullable=true),
 *     @OA\Property(
 *         property="parameters",
 *         type="array",
 *         @OA\Items(type="object")
 *     ),
 *     @OA\Property(property="parameters_count", type="integer"),
 *     @OA\Property(
 *         property="aliases",
 *         type="array",
 *         @OA\Items(type="string")
 *     ),
 *     @OA\Property(property="has_aliases", type="boolean"),
 *     @OA\Property(
 *         property="examples",
 *         type="array",
 *         @OA\Items(type="string")
 *     ),
 *     @OA\Property(property="skill_path", type="string", nullable=true),
 *     @OA\Property(property="machine_id", type="string", format="uuid"),
 *     @OA\Property(property="discovered_at", type="string", nullable=true, format="date-time"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time"),
 *     @OA\Property(property="discovered_at_human", type="string", nullable=true),
 *     @OA\Property(property="created_at_human", type="string")
 * )
 *
 * @OA\Schema(
 *     schema="RegisterCommandRequest",
 *     type="object",
 *     title="RegisterCommandRequest",
 *     required={"name"},
 *     @OA\Property(property="name", type="string", description="Unique command identifier"),
 *     @OA\Property(property="description", type="string", description="Human-readable description"),
 *     @OA\Property(property="category", type="string", description="Command category for grouping"),
 *     @OA\Property(property="signature", type="string", description="Command signature with parameter definitions"),
 *     @OA\Property(
 *         property="parameters",
 *         type="array",
 *         description="Parameter definitions",
 *         @OA\Items(type="object")
 *     ),
 *     @OA\Property(
 *         property="aliases",
 *         type="array",
 *         description="Alternative names for the command",
 *         @OA\Items(type="string")
 *     ),
 *     @OA\Property(
 *         property="examples",
 *         type="array",
 *         description="Usage examples",
 *         @OA\Items(type="string")
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="ExecuteCommandRequest",
 *     type="object",
 *     title="ExecuteCommandRequest",
 *     @OA\Property(property="arguments", type="object", description="Positional arguments to pass to the command"),
 *     @OA\Property(property="options", type="object", description="Named options to pass to the command")
 * )
 */
class DiscoveredCommandSchema {}
