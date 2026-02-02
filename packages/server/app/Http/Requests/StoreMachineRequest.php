<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMachineRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
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
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('machines')
                    ->where('user_id', $this->user()->id)
                    ->ignore($this->route('machine')),
            ],
            'platform' => [
                'required',
                'string',
                Rule::in(['darwin', 'win32', 'linux']),
            ],
            'hostname' => ['nullable', 'string', 'max:255'],
            'arch' => ['nullable', 'string', 'max:50'],
            'node_version' => ['nullable', 'string', 'max:50'],
            'agent_version' => ['nullable', 'string', 'max:50'],
            'claude_version' => ['nullable', 'string', 'max:50'],
            'claude_path' => ['nullable', 'string', 'max:512'],
            'capabilities' => ['nullable', 'array'],
            'capabilities.*' => ['string', 'max:100'],
            'max_sessions' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The machine name is required.',
            'name.unique' => 'You already have a machine with this name.',
            'platform.required' => 'The platform is required.',
            'platform.in' => 'The platform must be one of: macOS (darwin), Windows (win32), or Linux.',
            'max_sessions.min' => 'Maximum sessions must be at least 1.',
            'max_sessions.max' => 'Maximum sessions cannot exceed 100.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Set default values
        if (!$this->has('max_sessions')) {
            $this->merge(['max_sessions' => 10]);
        }

        if (!$this->has('capabilities')) {
            $this->merge(['capabilities' => []]);
        }
    }
}
