<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CredentialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'auth_type' => $this->auth_type,
            'claude_dir_mode' => $this->claude_dir_mode,
            'is_default' => $this->is_default,
            'masked_key' => $this->masked_key,
            'token_status' => $this->token_status,
            'is_expired' => $this->is_expired,
            'has_refresh_token' => $this->has_refresh_token,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'last_used_at' => $this->last_used_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
            'sessions_count' => $this->whenCounted('sessions'),
        ];
    }
}
