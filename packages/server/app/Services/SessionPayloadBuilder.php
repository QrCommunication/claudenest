<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ClaudeCredential;
use App\Models\Session;
use App\Models\SharedProject;

/**
 * Builds the camelCase `session:create` payload sent to the agent.
 *
 * Single source of truth shared by SessionController::store (human sessions)
 * and WorkerPoolService::spawnWorker (orchestrated workers): credential env
 * resolution, multi-agent attach (instance + scoped token + MCP env + system
 * prompt) and permission mode.
 *
 * mcpEnv carries a scoped Sanctum token: agent-only via AgentGateway, NEVER
 * broadcast nor included in API resources.
 */
class SessionPayloadBuilder
{
    public function __construct(
        private CredentialService $credentialService,
        private MultiAgentSessionService $multiAgentSessionService,
    ) {}

    /**
     * @param array<int, string> $extraAbilities extra functional abilities for
     *        the scoped token (forwarded to MultiAgentSessionService::attach).
     * @param string|null $systemPromptOverride replaces the default worker
     *        prompt (identity + collaboration rules) — used by role-specific
     *        sessions such as the planning agent.
     *
     * @return array<string, mixed>
     */
    public function build(
        Session $session,
        ?SharedProject $project = null,
        ?string $permissionMode = null,
        array $extraAbilities = [],
        ?string $systemPromptOverride = null,
    ): array {
        $payload = [
            'sessionId' => $session->id,
            'mode' => $session->mode,
            'projectPath' => $session->project_path,
            'initialPrompt' => $session->initial_prompt,
            'ptySize' => $session->pty_size,
            'credentialEnv' => $this->resolveCredentialEnv($session),
        ];

        if ($project) {
            $multiAgent = $this->multiAgentSessionService->attach($session, $project, $extraAbilities);

            $payload['sharedProjectId'] = $project->id;
            $payload['instanceId'] = $multiAgent['instanceId'];
            $payload['mcpEnv'] = $multiAgent['mcpEnv'];
            $payload['appendSystemPrompt'] = $systemPromptOverride ?? $multiAgent['appendSystemPrompt'];
        }

        if ($permissionMode !== null && $permissionMode !== '') {
            $payload['permissionMode'] = $permissionMode;
        }

        return $payload;
    }

    /**
     * @return array<string, string>
     */
    private function resolveCredentialEnv(Session $session): array
    {
        if (! $session->credential_id) {
            return [];
        }

        $credential = ClaudeCredential::where('user_id', $session->user_id)
            ->find($session->credential_id);

        if (! $credential) {
            return [];
        }

        return $this->credentialService->getSessionEnv($credential);
    }
}
