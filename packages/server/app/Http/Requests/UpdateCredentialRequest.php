<?php

namespace App\Http\Requests;

use App\Models\ClaudeCredential;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCredentialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:100', 'regex:/^[a-z0-9-]+$/'],
            'auth_type' => ['sometimes', Rule::in(ClaudeCredential::AUTH_TYPES)],
            'api_key' => ['nullable', 'string'],
            'access_token' => ['nullable', 'string'],
            'refresh_token' => ['nullable', 'string'],
            'expires_at' => ['nullable', 'integer'],
            'claude_dir_mode' => ['sometimes', Rule::in(ClaudeCredential::DIR_MODES)],
        ];
    }
}
