<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMachineRequest extends FormRequest
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
        $machineId = $this->route('machine');

        return [
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('machines')
                    ->where('user_id', $this->user()->id)
                    ->ignore($machineId),
            ],
            'claude_version' => ['nullable', 'string', 'max:50'],
            'claude_path' => ['nullable', 'string', 'max:512'],
            'capabilities' => ['sometimes', 'array'],
            'capabilities.*' => ['string', 'max:100'],
            'max_sessions' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'You already have a machine with this name.',
            'max_sessions.min' => 'Maximum sessions must be at least 1.',
            'max_sessions.max' => 'Maximum sessions cannot exceed 100.',
        ];
    }
}
