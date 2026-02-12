<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InitiatePairingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * This is a public route (agent not authenticated yet).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'regex:/^[A-Z0-9]{3}-[A-Z0-9]{3}$/'],
            'agent_info' => ['required', 'array'],
            'agent_info.platform' => ['required', 'string', 'in:darwin,win32,linux'],
            'agent_info.hostname' => ['required', 'string', 'max:255'],
            'agent_info.arch' => ['nullable', 'string', 'max:50'],
            'agent_info.node_version' => ['nullable', 'string', 'max:50'],
            'agent_info.agent_version' => ['nullable', 'string', 'max:50'],
            'agent_info.claude_version' => ['nullable', 'string', 'max:50'],
            'agent_info.claude_path' => ['nullable', 'string', 'max:512'],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'code.required' => 'A pairing code is required.',
            'code.regex' => 'The pairing code must be in XXX-XXX format (letters and digits).',
            'agent_info.required' => 'Agent information is required.',
            'agent_info.platform.required' => 'The agent platform is required.',
            'agent_info.platform.in' => 'The platform must be one of: darwin, win32, linux.',
            'agent_info.hostname.required' => 'The agent hostname is required.',
        ];
    }
}
