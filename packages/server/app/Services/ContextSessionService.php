<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\SessionCreated;
use App\Models\Session;
use App\Models\SharedProject;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Spawns an ephemeral INTERACTIVE Claude session that generates a project's
 * onboarding context (summary / architecture / conventions / current_focus)
 * by reading the actual codebase, then saves it via the `project_context_set`
 * MCP tool (PATCH /projects/{id}/context — allowed by the base `multiagent`
 * scope).
 *
 * Replaces the previous Ollama (mistral:7b) summarization, which took minutes
 * on a CPU host and, run inline in applyMasterPlan, blocked the request past
 * the reverse-proxy timeout → 502, leaving the sprints/tasks uncreated. This
 * spawn is fire-and-forget (a single AgentGateway message): the plan applies
 * and returns immediately while the session fills the context in the background.
 *
 * Sandboxed like a worker (bypassPermissions; bwrap confines writes to the
 * project). Best-effort: every failure is swallowed so it can NEVER block plan
 * application.
 */
class ContextSessionService
{
    /** Sandbox mode: full autonomy so it can read the project and call the tool. */
    private const PERMISSION_MODE = 'bypassPermissions';

    public function __construct(
        private CredentialService $credentialService,
        private SessionPayloadBuilder $payloadBuilder,
    ) {}

    /**
     * Launch a background context-generation session for a project whose
     * context is not yet populated. Returns the created Session, or null when
     * skipped (already onboarded, no usable credential, or any failure).
     */
    public function launch(SharedProject $project): ?Session
    {
        try {
            // Already onboarded — never spawn a (billable) session for nothing.
            if ($this->hasContext($project)) {
                return null;
            }

            $user = $project->user;
            $credential = $user?->credentials()->default()->first()
                ?? $user?->credentials()->first();

            if ($credential === null) {
                Log::info('Context session skipped: no credential', ['project_id' => $project->id]);

                return null;
            }

            // Surface an unusable credential before creating a session row.
            $this->credentialService->getSessionEnv($credential);

            $session = Session::create([
                'machine_id' => $project->machine_id,
                'user_id' => $project->user_id,
                'shared_project_id' => $project->id,
                'mode' => 'interactive',
                'project_path' => $project->project_path,
                'initial_prompt' => 'Generate this project\'s onboarding context as instructed, '
                    .'then save it with the project_context_set tool. Do not edit any files.',
                'credential_id' => $credential->id,
                'status' => 'created',
                'orchestrated' => false,
            ]);

            $payload = $this->payloadBuilder->build(
                $session,
                $project,
                self::PERMISSION_MODE,
                systemPromptOverride: $this->buildSystemPrompt($project),
            );

            AgentGateway::send($project->machine_id, 'session:create', $payload);
            broadcast(new SessionCreated($session))->toOthers();

            return $session;
        } catch (Throwable $e) {
            Log::warning('Context session launch failed (non-blocking)', [
                'project_id' => $project->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /** True once any context field is populated. */
    private function hasContext(SharedProject $project): bool
    {
        return trim((string) $project->summary) !== ''
            && trim((string) $project->architecture) !== ''
            && trim((string) $project->conventions) !== '';
    }

    private function buildSystemPrompt(SharedProject $project): string
    {
        $name = trim((string) $project->name);
        $prd = trim((string) $project->prd);

        $prdBlock = $prd !== ''
            ? "The product brief (PRD) for this project:\n\n{$prd}\n\n"
            : '';

        return <<<PROMPT
            You are onboarding the project "{$name}". Explore the codebase in the
            current working directory (read files, list the structure, inspect the
            package manifests and configs) to understand it.

            {$prdBlock}Then produce a concise onboarding context and SAVE it by calling the
            `project_context_set` MCP tool exactly once with these fields:

            - summary: 2-4 sentences — what this project is and does.
            - architecture: the main layers/modules, the stack, and how they fit.
            - conventions: the coding conventions, structure, and patterns to follow.
            - current_focus: what a contributor should work on first.

            Keep each field tight and factual — no preamble, no markdown headings.
            Do NOT edit, create, or delete any files. After the tool call succeeds,
            stop.
            PROMPT;
    }
}
