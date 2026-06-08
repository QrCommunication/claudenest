<?php

declare(strict_types=1);

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Skill',
    title: 'Skill',
    description: 'A skill registered on a machine',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'name', type: 'string', example: 'code-review'),
        new OA\Property(property: 'display_name', type: 'string', example: 'Code Review'),
        new OA\Property(property: 'description', type: 'string', nullable: true),
        new OA\Property(property: 'category', type: 'string', example: 'development', nullable: true),
        new OA\Property(property: 'category_color', type: 'string', example: '#a855f7', nullable: true),
        new OA\Property(property: 'path', type: 'string', example: '/skills/code-review'),
        new OA\Property(property: 'version', type: 'string', example: '1.0.0', nullable: true),
        new OA\Property(property: 'enabled', type: 'boolean'),
        new OA\Property(property: 'config', type: 'object', nullable: true),
        new OA\Property(property: 'tags', type: 'array', items: new OA\Items(type: 'string')),
        new OA\Property(property: 'examples', type: 'array', items: new OA\Items(type: 'string')),
        new OA\Property(property: 'has_config', type: 'boolean'),
        new OA\Property(property: 'machine_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'discovered_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'discovered_at_human', type: 'string', nullable: true),
        new OA\Property(property: 'created_at_human', type: 'string'),
    ],
)]
#[OA\Schema(
    schema: 'RegisterSkillRequest',
    title: 'RegisterSkillRequest',
    type: 'object',
    required: ['name', 'path'],
    properties: [
        new OA\Property(property: 'name', type: 'string', description: 'Unique skill identifier'),
        new OA\Property(property: 'path', type: 'string', description: 'Filesystem path to the skill'),
        new OA\Property(property: 'description', type: 'string', description: 'Human-readable description'),
        new OA\Property(property: 'category', type: 'string', description: 'Skill category for grouping'),
        new OA\Property(property: 'version', type: 'string', description: 'Skill version'),
        new OA\Property(property: 'config', type: 'object', description: 'Skill configuration object'),
        new OA\Property(property: 'tags', type: 'array', description: 'Tags for filtering and discovery', items: new OA\Items(type: 'string')),
        new OA\Property(property: 'examples', type: 'array', description: 'Usage examples', items: new OA\Items(type: 'string')),
    ],
)]
class SkillSchema {}
