<?php

declare(strict_types=1);

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'DiscoveredCommand',
    description: 'A command discovered on a machine',
    type: 'object',
    title: 'DiscoveredCommand',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'name', type: 'string', example: 'artisan:migrate'),
        new OA\Property(property: 'display_name', type: 'string', example: 'Artisan Migrate'),
        new OA\Property(property: 'description', type: 'string', nullable: true),
        new OA\Property(property: 'category', type: 'string', example: 'artisan', nullable: true),
        new OA\Property(property: 'category_color', type: 'string', nullable: true),
        new OA\Property(property: 'signature', type: 'string', nullable: true),
        new OA\Property(
            property: 'parameters',
            type: 'array',
            items: new OA\Items(type: 'object'),
        ),
        new OA\Property(property: 'parameters_count', type: 'integer'),
        new OA\Property(
            property: 'aliases',
            type: 'array',
            items: new OA\Items(type: 'string'),
        ),
        new OA\Property(property: 'has_aliases', type: 'boolean'),
        new OA\Property(
            property: 'examples',
            type: 'array',
            items: new OA\Items(type: 'string'),
        ),
        new OA\Property(property: 'skill_path', type: 'string', nullable: true),
        new OA\Property(property: 'machine_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'discovered_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'discovered_at_human', type: 'string', nullable: true),
        new OA\Property(property: 'created_at_human', type: 'string'),
    ],
)]
#[OA\Schema(
    schema: 'RegisterCommandRequest',
    description: '',
    type: 'object',
    title: 'RegisterCommandRequest',
    required: ['name'],
    properties: [
        new OA\Property(property: 'name', type: 'string', description: 'Unique command identifier'),
        new OA\Property(property: 'description', type: 'string', description: 'Human-readable description'),
        new OA\Property(property: 'category', type: 'string', description: 'Command category for grouping'),
        new OA\Property(property: 'signature', type: 'string', description: 'Command signature with parameter definitions'),
        new OA\Property(
            property: 'parameters',
            type: 'array',
            description: 'Parameter definitions',
            items: new OA\Items(type: 'object'),
        ),
        new OA\Property(
            property: 'aliases',
            type: 'array',
            description: 'Alternative names for the command',
            items: new OA\Items(type: 'string'),
        ),
        new OA\Property(
            property: 'examples',
            type: 'array',
            description: 'Usage examples',
            items: new OA\Items(type: 'string'),
        ),
    ],
)]
#[OA\Schema(
    schema: 'ExecuteCommandRequest',
    description: '',
    type: 'object',
    title: 'ExecuteCommandRequest',
    properties: [
        new OA\Property(property: 'arguments', type: 'object', description: 'Positional arguments to pass to the command'),
        new OA\Property(property: 'options', type: 'object', description: 'Named options to pass to the command'),
    ],
)]
class DiscoveredCommandSchema {}
