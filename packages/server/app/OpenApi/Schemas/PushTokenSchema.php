<?php

namespace App\OpenApi\Schemas;

/**
 * @OA\Schema(
 *     schema="PushToken",
 *     type="object",
 *     title="PushToken",
 *     description="A push notification token for a user's device",
 *     @OA\Property(property="id", type="string", format="uuid"),
 *     @OA\Property(property="user_id", type="string", format="uuid"),
 *     @OA\Property(property="token", type="string", description="The push notification token provided by the platform"),
 *     @OA\Property(
 *         property="platform",
 *         type="string",
 *         enum={"ios", "android", "web"},
 *         description="The device platform"
 *     ),
 *     @OA\Property(property="device_name", type="string", nullable=true, description="Optional human-readable name for the device"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 *
 * @OA\Schema(
 *     schema="RegisterPushTokenRequest",
 *     type="object",
 *     title="RegisterPushTokenRequest",
 *     required={"token", "platform"},
 *     @OA\Property(property="token", type="string", description="The push notification token provided by the platform"),
 *     @OA\Property(
 *         property="platform",
 *         type="string",
 *         enum={"ios", "android", "web"},
 *         description="The device platform"
 *     ),
 *     @OA\Property(property="device_name", type="string", description="Optional human-readable name for the device")
 * )
 */
class PushTokenSchema {}
