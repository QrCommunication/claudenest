<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompletePairingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * This is an authenticated route (dashboard user).
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
            'name' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.max' => 'The machine name cannot exceed 255 characters.',
        ];
    }
}
