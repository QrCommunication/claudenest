<?php

namespace App\Http\Requests;

use App\Models\PushToken;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePushTokenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Expo push tokens: ExponentPushToken[xxxx] or ExpoPushToken[xxxx]
            'token' => [
                'required',
                'string',
                'max:255',
                'regex:/^Expo(nent)?PushToken\[[A-Za-z0-9+\/_=-]+\]$/',
            ],
            'platform' => ['nullable', Rule::in(PushToken::PLATFORMS)],
            'device_name' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'token.regex' => 'The token must be a valid Expo push token (ExponentPushToken[...]).',
        ];
    }
}
