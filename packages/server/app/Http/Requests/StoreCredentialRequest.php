<?php

namespace App\Http\Requests;

use App\Models\ClaudeCredential;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCredentialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[a-z0-9-]+$/'],
            'auth_type' => ['required', Rule::in(ClaudeCredential::AUTH_TYPES)],
            'api_key' => ['required_if:auth_type,api_key', 'nullable', 'string'],
            'access_token' => ['nullable', 'string'],
            'refresh_token' => ['nullable', 'string'],
            'expires_at' => ['nullable', 'integer'],
            'claude_dir_mode' => ['nullable', Rule::in(ClaudeCredential::DIR_MODES)],
        ];
    }
}
