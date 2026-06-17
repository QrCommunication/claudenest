<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates the payload for spawning a single orchestrated worker
 * (POST /api/projects/{project}/workers).
 *
 * Mirrors the orchestrator-start validation, scoped to one worker: an
 * optional permission mode and an optional credential the worker runs
 * under. The credential, when provided, MUST belong to the requesting
 * user (IDOR prevention).
 */
class SpawnWorkerRequest extends FormRequest
{
    /**
     * Permission modes accepted by the Claude agent for a worker session.
     * Kept in sync with the orchestrator-start endpoint.
     */
    public const PERMISSION_MODES = ['default', 'plan', 'acceptEdits', 'bypassPermissions'];

    /**
     * Determine if the user is authorized to make this request.
     *
     * Project ownership is enforced by the controller (getUserProject);
     * this request only guards the payload shape.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'permission_mode' => ['nullable', 'string', Rule::in(self::PERMISSION_MODES)],
            // The credential the worker runs under. The selected one is used
            // (not blindly the default) and MUST belong to the requesting user.
            'credential_id' => [
                'nullable',
                'uuid',
                Rule::exists('claude_credentials', 'id')->where('user_id', $this->user()?->id),
            ],
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
            'permission_mode.in' => 'The permission mode must be one of: default, plan, acceptEdits or bypassPermissions.',
            'credential_id.uuid' => 'The credential id must be a valid UUID.',
            'credential_id.exists' => 'The selected credential does not exist or does not belong to you.',
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
            'permission_mode' => 'permission mode',
            'credential_id' => 'credential',
        ];
    }
}
