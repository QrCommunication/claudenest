<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSessionRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'project_path' => ['nullable', 'string', 'max:512'],
            'mode' => ['required', 'string', Rule::in(['interactive', 'headless', 'oneshot'])],
            'initial_prompt' => ['nullable', 'string'],
            'pty_size' => ['nullable', 'array'],
            'pty_size.cols' => ['nullable', 'integer', 'min:20', 'max:500'],
            'pty_size.rows' => ['nullable', 'integer', 'min:10', 'max:200'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'mode.required' => 'The session mode is required.',
            'mode.in' => 'The session mode must be one of: interactive, headless, or oneshot.',
            'project_path.max' => 'The project path cannot exceed 512 characters.',
            'pty_size.cols.min' => 'Terminal columns must be at least 20.',
            'pty_size.cols.max' => 'Terminal columns cannot exceed 500.',
            'pty_size.rows.min' => 'Terminal rows must be at least 10.',
            'pty_size.rows.max' => 'Terminal rows cannot exceed 200.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'project_path' => 'project path',
            'mode' => 'session mode',
            'initial_prompt' => 'initial prompt',
            'pty_size.cols' => 'columns',
            'pty_size.rows' => 'rows',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('mode')) {
            $this->merge([
                'mode' => strtolower($this->input('mode')),
            ]);
        }
    }
}
