<?php

declare(strict_types=1);

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'MetaObject',
    description: 'Standard metadata included in every API response',
    type: 'object',
    required: ['timestamp', 'request_id'],
    properties: [
        new OA\Property(
            property: 'timestamp',
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000000Z',
            description: 'ISO 8601 UTC timestamp of the response',
        ),
        new OA\Property(
            property: 'request_id',
            type: 'string',
            example: '65a5b3c2e4b0a',
            description: 'Unique identifier for the request, echoed from X-Request-ID header or auto-generated',
        ),
    ],
)]
#[OA\Schema(
    schema: 'PaginationObject',
    description: 'Pagination metadata for paginated list responses',
    type: 'object',
    required: ['current_page', 'last_page', 'per_page', 'total'],
    properties: [
        new OA\Property(
            property: 'current_page',
            type: 'integer',
            example: 1,
            description: 'The current page number (1-indexed)',
        ),
        new OA\Property(
            property: 'last_page',
            type: 'integer',
            example: 5,
            description: 'The total number of pages available',
        ),
        new OA\Property(
            property: 'per_page',
            type: 'integer',
            example: 15,
            description: 'The number of items returned per page',
        ),
        new OA\Property(
            property: 'total',
            type: 'integer',
            example: 73,
            description: 'The total number of items across all pages',
        ),
    ],
)]
#[OA\Schema(
    schema: 'SuccessResponse',
    description: 'Abstract base shape shared by all successful API responses',
    type: 'object',
    required: ['success', 'meta'],
    properties: [
        new OA\Property(
            property: 'success',
            type: 'boolean',
            example: true,
            description: 'Indicates the request completed successfully',
        ),
        new OA\Property(
            property: 'meta',
            ref: '#/components/schemas/MetaObject',
        ),
    ],
)]
#[OA\Schema(
    schema: 'ErrorResponse',
    description: 'Standard envelope for all error responses',
    type: 'object',
    required: ['success', 'error', 'meta'],
    properties: [
        new OA\Property(
            property: 'success',
            type: 'boolean',
            example: false,
            description: 'Always false for error responses',
        ),
        new OA\Property(
            property: 'error',
            type: 'object',
            description: 'Error details',
            properties: [
                new OA\Property(
                    property: 'code',
                    type: 'string',
                    example: 'MACHINE_NOT_FOUND',
                    description: 'Machine-readable error code',
                ),
                new OA\Property(
                    property: 'message',
                    type: 'string',
                    example: 'The requested resource was not found.',
                    description: 'Human-readable error message',
                ),
            ],
        ),
        new OA\Property(
            property: 'meta',
            ref: '#/components/schemas/MetaObject',
        ),
    ],
)]
#[OA\Schema(
    schema: 'DeletedResponse',
    description: 'Response returned after a successful DELETE operation',
    type: 'object',
    required: ['success', 'data', 'meta'],
    properties: [
        new OA\Property(
            property: 'success',
            type: 'boolean',
            example: true,
            description: 'Indicates the resource was deleted successfully',
        ),
        new OA\Property(
            property: 'data',
            nullable: true,
            example: null,
            description: 'Always null for delete operations',
        ),
        new OA\Property(
            property: 'meta',
            ref: '#/components/schemas/MetaObject',
        ),
    ],
)]
#[OA\Schema(
    schema: 'PaginatedResponse',
    description: 'Standard envelope for paginated list responses',
    type: 'object',
    required: ['success', 'data', 'meta'],
    properties: [
        new OA\Property(
            property: 'success',
            type: 'boolean',
            example: true,
            description: 'Indicates the request completed successfully',
        ),
        new OA\Property(
            property: 'data',
            type: 'array',
            description: 'Array of resource objects for the current page',
            items: new OA\Items(type: 'object'),
        ),
        new OA\Property(
            property: 'meta',
            type: 'object',
            description: 'Response metadata including request info and pagination state',
            properties: [
                new OA\Property(
                    property: 'timestamp',
                    type: 'string',
                    format: 'date-time',
                    example: '2024-01-15T10:30:00.000000Z',
                    description: 'ISO 8601 UTC timestamp of the response',
                ),
                new OA\Property(
                    property: 'request_id',
                    type: 'string',
                    example: '65a5b3c2e4b0a',
                    description: 'Unique identifier for the request',
                ),
                new OA\Property(
                    property: 'pagination',
                    ref: '#/components/schemas/PaginationObject',
                ),
            ],
        ),
    ],
)]
class Common {}
