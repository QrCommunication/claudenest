<?php

declare(strict_types=1);

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'User',
    description: 'Authenticated user resource',
    type: 'object',
    required: ['id', 'name', 'email', 'created_at', 'updated_at'],
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '9d8f3c2a-1b4e-4f7d-a9c6-2e5b8f0d3a71', description: 'Unique identifier for the user'),
        new OA\Property(property: 'name', type: 'string', example: 'John Doe', description: 'Display name of the user'),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'john.doe@example.com', description: 'Email address of the user'),
        new OA\Property(property: 'avatar_url', type: 'string', format: 'url', example: 'https://cdn.example.com/avatars/johndoe.jpg', description: "URL of the user's avatar image", nullable: true),
        new OA\Property(property: 'email_verified_at', type: 'string', format: 'date-time', example: '2024-01-10T08:00:00.000000Z', description: 'Timestamp when the user verified their email address', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', example: '2024-01-01T12:00:00.000000Z', description: 'ISO 8601 timestamp when the user account was created'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', example: '2024-01-15T09:45:00.000000Z', description: 'ISO 8601 timestamp when the user account was last updated'),
    ],
)]
#[OA\Schema(
    schema: 'LoginRequest',
    description: 'Credentials required to authenticate a user',
    type: 'object',
    required: ['email', 'password'],
    properties: [
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'john.doe@example.com', description: "The user's email address"),
        new OA\Property(property: 'password', type: 'string', format: 'password', example: 'secret123', description: "The user's password"),
    ],
)]
#[OA\Schema(
    schema: 'RegisterRequest',
    description: 'Data required to create a new user account',
    type: 'object',
    required: ['name', 'email', 'password', 'password_confirmation'],
    properties: [
        new OA\Property(property: 'name', type: 'string', example: 'John Doe', description: 'Display name for the new account'),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'john.doe@example.com', description: 'Email address for the new account'),
        new OA\Property(property: 'password', type: 'string', format: 'password', example: 'secret123', description: 'Password for the new account (minimum 8 characters)'),
        new OA\Property(property: 'password_confirmation', type: 'string', format: 'password', example: 'secret123', description: 'Must match the password field'),
    ],
)]
class UserSchema {}
