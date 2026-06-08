<?php

declare(strict_types=1);

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'ContextChunk',
    description: 'A RAG context chunk stored with a pgvector embedding for semantic retrieval',
    type: 'object',
    required: ['id', 'project_id', 'content', 'type', 'files', 'importance_score', 'created_at'],
    properties: [
        new OA\Property(
            property: 'id',
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
            description: 'Unique identifier of the context chunk',
        ),
        new OA\Property(
            property: 'project_id',
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440001',
            description: 'ID of the parent shared project',
        ),
        new OA\Property(
            property: 'content',
            type: 'string',
            description: 'Text content of the chunk; this is the text that was embedded and can be retrieved semantically',
        ),
        new OA\Property(
            property: 'type',
            type: 'string',
            example: 'code',
            description: 'Logical type of the chunk (e.g. code, decision, summary, error)',
        ),
        new OA\Property(
            property: 'instance_id',
            type: 'string',
            description: 'ID of the Claude instance that created the chunk',
            nullable: true,
        ),
        new OA\Property(
            property: 'task_id',
            type: 'string',
            format: 'uuid',
            description: 'ID of the task this chunk is associated with',
            nullable: true,
        ),
        new OA\Property(
            property: 'files',
            type: 'array',
            description: 'List of file paths referenced by this chunk',
            items: new OA\Items(type: 'string'),
        ),
        new OA\Property(
            property: 'importance_score',
            type: 'number',
            format: 'float',
            example: 0.5,
            minimum: 0,
            maximum: 1,
            description: 'Normalised importance weight between 0 (low) and 1 (high) used when ranking results',
        ),
        new OA\Property(
            property: 'expires_at',
            type: 'string',
            format: 'date-time',
            example: '2024-02-15T10:30:00.000000Z',
            description: 'ISO 8601 timestamp after which the chunk should be considered stale and eligible for pruning',
            nullable: true,
        ),
        new OA\Property(
            property: 'created_at',
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000000Z',
            description: 'ISO 8601 timestamp of when the chunk was created',
        ),
    ],
)]
#[OA\Schema(
    schema: 'CreateChunkRequest',
    description: 'Payload for adding a new context chunk to a shared project',
    type: 'object',
    required: ['content', 'type'],
    properties: [
        new OA\Property(
            property: 'content',
            type: 'string',
            description: 'Text content to embed and store as a context chunk',
        ),
        new OA\Property(
            property: 'type',
            type: 'string',
            example: 'code',
            description: 'Logical type of the chunk (e.g. code, decision, summary, error)',
        ),
        new OA\Property(
            property: 'files',
            type: 'array',
            description: 'List of file paths referenced by this chunk',
            items: new OA\Items(type: 'string'),
        ),
        new OA\Property(
            property: 'importance_score',
            type: 'number',
            format: 'float',
            example: 0.5,
            description: 'Normalised importance weight between 0 and 1; defaults to 0.5 when omitted',
        ),
        new OA\Property(
            property: 'instance_id',
            type: 'string',
            description: 'ID of the Claude instance creating the chunk',
            nullable: true,
        ),
        new OA\Property(
            property: 'task_id',
            type: 'string',
            description: 'UUID of the task this chunk is associated with',
            nullable: true,
        ),
    ],
)]
#[OA\Schema(
    schema: 'ContextQueryRequest',
    description: 'Payload for performing a semantic similarity search over a project\'s context chunks',
    type: 'object',
    required: ['query'],
    properties: [
        new OA\Property(
            property: 'query',
            type: 'string',
            example: 'How is authentication implemented?',
            description: 'Natural-language query string that will be embedded and matched against stored chunks',
        ),
        new OA\Property(
            property: 'limit',
            type: 'integer',
            example: 10,
            default: 10,
            description: 'Maximum number of chunks to return; defaults to 10',
        ),
        new OA\Property(
            property: 'type',
            type: 'string',
            example: 'code',
            description: 'Optional chunk type filter; when provided only chunks of this type are searched',
            nullable: true,
        ),
    ],
)]
class ContextChunkSchema {}
