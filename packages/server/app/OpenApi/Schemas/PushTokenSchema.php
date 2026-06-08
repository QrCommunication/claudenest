<?php

declare(strict_types=1);

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'PushToken',
    title: 'PushToken',
    description: "A push notification token for a user's device",
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'user_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'token', type: 'string', description: 'The push notification token provided by the platform'),
        new OA\Property(property: 'platform', type: 'string', enum: ['ios', 'android', 'web'], description: 'The device platform'),
        new OA\Property(property: 'device_name', type: 'string', description: 'Optional human-readable name for the device', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
    ],
)]
#[OA\Schema(
    schema: 'RegisterPushTokenRequest',
    title: 'RegisterPushTokenRequest',
    type: 'object',
    required: ['token', 'platform'],
    properties: [
        new OA\Property(property: 'token', type: 'string', description: 'The push notification token provided by the platform'),
        new OA\Property(property: 'platform', type: 'string', enum: ['ios', 'android', 'web'], description: 'The device platform'),
        new OA\Property(property: 'device_name', type: 'string', description: 'Optional human-readable name for the device'),
    ],
)]
class PushTokenSchema {}
