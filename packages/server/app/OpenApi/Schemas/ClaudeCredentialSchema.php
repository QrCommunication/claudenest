<?php

namespace App\OpenApi\Schemas;

/**
 * @OA\Schema(
 *     schema="ClaudeCredential",
 *     type="object",
 *     title="ClaudeCredential",
 *     description="An encrypted Claude API credential or OAuth token",
 *     @OA\Property(property="id", type="string", format="uuid"),
 *     @OA\Property(property="name", type="string", example="my-api-key"),
 *     @OA\Property(property="auth_type", type="string", enum={"api_key", "oauth"}),
 *     @OA\Property(property="claude_dir_mode", type="string", nullable=true),
 *     @OA\Property(property="is_default", type="boolean"),
 *     @OA\Property(property="masked_key", type="string", nullable=true, example="sk-ant-...xxxx"),
 *     @OA\Property(property="token_status", type="string", enum={"active", "expired", "revoked"}),
 *     @OA\Property(property="is_expired", type="boolean"),
 *     @OA\Property(property="has_refresh_token", type="boolean"),
 *     @OA\Property(property="expires_at", type="string", nullable=true, format="date-time"),
 *     @OA\Property(property="last_used_at", type="string", nullable=true, format="date-time"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time"),
 *     @OA\Property(property="sessions_count", type="integer")
 * )
 *
 * @OA\Schema(
 *     schema="StoreCredentialRequest",
 *     type="object",
 *     title="StoreCredentialRequest",
 *     required={"name", "auth_type"},
 *     @OA\Property(property="name", type="string", description="Display name for the credential"),
 *     @OA\Property(property="auth_type", type="string", enum={"api_key", "oauth"}, description="Authentication type"),
 *     @OA\Property(property="api_key", type="string", description="Required if auth_type is api_key"),
 *     @OA\Property(property="is_default", type="boolean", description="Set this credential as the default")
 * )
 *
 * @OA\Schema(
 *     schema="UpdateCredentialRequest",
 *     type="object",
 *     title="UpdateCredentialRequest",
 *     @OA\Property(property="name", type="string", description="New display name for the credential"),
 *     @OA\Property(property="is_default", type="boolean", description="Set this credential as the default")
 * )
 */
class ClaudeCredentialSchema {}
