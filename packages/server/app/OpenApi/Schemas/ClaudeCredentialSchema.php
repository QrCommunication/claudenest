<?php

declare(strict_types=1);

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'ClaudeCredential',
    description: 'An encrypted Claude API credential or OAuth token',
    type: 'object',
    title: 'ClaudeCredential',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'name', type: 'string', example: 'my-api-key'),
        new OA\Property(property: 'auth_type', type: 'string', enum: ['api_key', 'oauth']),
        new OA\Property(property: 'claude_dir_mode', type: 'string', nullable: true),
        new OA\Property(property: 'is_default', type: 'boolean'),
        new OA\Property(property: 'masked_key', type: 'string', example: 'sk-ant-...xxxx', nullable: true),
        new OA\Property(property: 'token_status', type: 'string', enum: ['active', 'expired', 'revoked']),
        new OA\Property(property: 'is_expired', type: 'boolean'),
        new OA\Property(property: 'has_refresh_token', type: 'boolean'),
        new OA\Property(property: 'expires_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'last_used_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'sessions_count', type: 'integer'),
    ],
)]
#[OA\Schema(
    schema: 'StoreCredentialRequest',
    description: '',
    type: 'object',
    title: 'StoreCredentialRequest',
    required: ['name', 'auth_type'],
    properties: [
        new OA\Property(property: 'name', type: 'string', description: 'Display name for the credential'),
        new OA\Property(property: 'auth_type', type: 'string', enum: ['api_key', 'oauth'], description: 'Authentication type'),
        new OA\Property(property: 'api_key', type: 'string', description: 'Required if auth_type is api_key'),
        new OA\Property(property: 'is_default', type: 'boolean', description: 'Set this credential as the default'),
    ],
)]
#[OA\Schema(
    schema: 'UpdateCredentialRequest',
    description: '',
    type: 'object',
    title: 'UpdateCredentialRequest',
    properties: [
        new OA\Property(property: 'name', type: 'string', description: 'New display name for the credential'),
        new OA\Property(property: 'is_default', type: 'boolean', description: 'Set this credential as the default'),
    ],
)]
class ClaudeCredentialSchema {}
