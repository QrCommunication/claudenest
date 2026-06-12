<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ClaudeInstance;
use App\Models\FileLock;
use App\Models\PersonalAccessToken;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Binds an interactive Claude session to a shared project (multi-agent mode).
 *
 * attach():   registers a ClaudeInstance for the session, mints a scoped
 *             Sanctum token (NEVER the machine `mn_` token — that one
 *             authenticates the whole user), and builds the MCP env +
 *             system-prompt addendum forwarded to the agent (identity +
 *             collaboration rules + compiled project context + open tasks).
 * teardown(): idempotent cleanup — disconnect the instance, release its
 *             file locks, revoke the scoped token.
 */
class MultiAgentSessionService
{
    /**
     * Hard cap applied to the final assembled system prompt, in tokens
     * (approximated at CHARS_PER_TOKEN characters per token).
     */
    private const PROMPT_TOKEN_BUDGET = 4000;

    /**
     * Token budget handed to ContextRAGService::compileContext() — kept below
     * PROMPT_TOKEN_BUDGET so identity, rules and open tasks always fit.
     */
    private const CONTEXT_TOKEN_BUDGET = 3000;

    private const CHARS_PER_TOKEN = 4;

    private const OPEN_TASKS_LIMIT = 10;

    private const PRIORITY_DESC_SQL = "CASE priority WHEN 'critical' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 WHEN 'low' THEN 1 ELSE 0 END DESC";

    public function __construct(
        private OrchestratorService $orchestratorService,
        private ContextRAGService $contextRAGService,
    ) {}

    /**
     * Attach a session to a shared project.
     *
     * @param array<int, string> $extraAbilities additional functional abilities
     *        granted to the scoped token besides 'multiagent' (e.g. 'planning'
     *        widens the RestrictScopedTokens allowlist to epics/sprints/task
     *        edition). The 'project:{id}' scoping ability is always appended.
     *
     * @return array{instanceId: string, mcpEnv: array<string, string>, appendSystemPrompt: string}
     */
    public function attach(Session $session, SharedProject $project, array $extraAbilities = []): array
    {
        $instanceId = self::instanceIdFor($session);

        $instance = $this->orchestratorService->registerInstance(
            $instanceId,
            $project->id,
            $session->machine_id,
            $session->id,
        );

        // Functional abilities (project scoping excluded — it is an internal
        // server-side restriction, not a capability the MCP needs to know).
        $abilities = array_values(array_unique(array_merge(['multiagent'], $extraAbilities)));

        // Scoped Sanctum token: multi-agent abilities only, bound to this
        // project. Restricted server-side by the RestrictScopedTokens middleware.
        $token = PersonalAccessToken::createForUser(
            $session->user_id,
            self::tokenNameFor($session),
            array_merge($abilities, ["project:{$project->id}"]),
        );

        return [
            'instanceId' => $instance->id,
            'mcpEnv' => [
                'CLAUDENEST_API_URL' => rtrim((string) config('app.url'), '/') . '/api',
                'CLAUDENEST_TOKEN' => $token['plainTextToken'],
                'CLAUDENEST_PROJECT_ID' => $project->id,
                'CLAUDENEST_INSTANCE_ID' => $instance->id,
                'CLAUDENEST_SESSION_ID' => $session->id,
                'CLAUDENEST_PROJECT_PATH' => (string) $project->project_path,
                // CSV of functional abilities — consumed by the agent-side MCP
                // to expose the matching toolset (e.g. "multiagent,planning").
                'CLAUDENEST_ABILITIES' => implode(',', $abilities),
            ],
            'appendSystemPrompt' => $this->buildSystemPrompt($instance->id, $project),
        ];
    }

    /**
     * Tear down the multi-agent binding of a session. Idempotent: safe to call
     * multiple times and from multiple paths (destroy, agent exit, scheduler).
     */
    public function teardown(Session $session): void
    {
        $instance = ClaudeInstance::find(self::instanceIdFor($session));

        if ($instance) {
            $this->disconnectAndReleaseLocks($instance);
        }

        $this->revokeScopedTokens($session->user_id, $session->id);
    }

    /**
     * Tear down an orphaned instance whose Session row may no longer exist
     * (scheduler safety net).
     */
    public function teardownInstance(ClaudeInstance $instance): void
    {
        $this->disconnectAndReleaseLocks($instance);

        if ($instance->session_id) {
            PersonalAccessToken::where('tokenable_type', User::class)
                ->where('name', 'mcp:' . $instance->session_id)
                ->delete();
        }
    }

    public static function instanceIdFor(Session $session): string
    {
        return "inst-{$session->id}";
    }

    public static function tokenNameFor(Session $session): string
    {
        return "mcp:{$session->id}";
    }

    private function disconnectAndReleaseLocks(ClaudeInstance $instance): void
    {
        // handleInstanceDisconnect marks the instance disconnected and releases
        // its claimed task — but NOT its file locks, hence the explicit release.
        if ($instance->is_connected) {
            $this->orchestratorService->handleInstanceDisconnect($instance->id);
        }

        if ($instance->project_id) {
            FileLock::releaseByInstance($instance->project_id, $instance->id);
        }
    }

    private function revokeScopedTokens(string $userId, string $sessionId): void
    {
        PersonalAccessToken::forUser($userId)
            ->where('name', "mcp:{$sessionId}")
            ->delete();
    }

    private function buildSystemPrompt(string $instanceId, SharedProject $project): string
    {
        // Exclude the instance we just registered from the "others" count.
        $activeCount = max(0, $project->claudeInstances()->connected()->count() - 1);

        $prompt = <<<PROMPT
You are Claude instance {$instanceId} working on shared project "{$project->name}" ({$activeCount} other instances may be active).
Collaboration rules:
- Before coding, claim a task: use the claudenest MCP tool task_claim_next (or task_claim).
- File locks are enforced automatically by hooks; if an edit is denied, the file is owned by another instance — pick different work.
- When done, call task_complete with a 2-4 sentence summary and files_modified.
- Record important decisions with context_add. Use context_query to learn what other instances did.
- Use broadcast_message for anything other instances must know immediately.
PROMPT;

        // Context enrichment is best-effort: each section is built fail-safe
        // (empty string on failure) so attach() can never break because of it.
        $contextSection = $this->buildProjectContextSection($project, $instanceId);
        if ($contextSection !== '') {
            $prompt .= "\n\n" . $contextSection;
        }

        $tasksSection = $this->buildOpenTasksSection($project);
        if ($tasksSection !== '') {
            $prompt .= "\n\n" . $tasksSection;
        }

        return $this->truncateToTokenBudget($prompt);
    }

    /**
     * "## Project context" section from the RAG-compiled project context
     * (summary, architecture, conventions, recent high-importance chunks).
     *
     * Fail-safe: on any failure the section is omitted (warning logged) so
     * identity + rules are always delivered.
     */
    private function buildProjectContextSection(SharedProject $project, string $instanceId): string
    {
        try {
            $context = $this->contextRAGService->compileContext(
                $project,
                $instanceId,
                self::CONTEXT_TOKEN_BUDGET,
            );
        } catch (Throwable $e) {
            Log::warning('Multi-agent prompt: project context compilation failed, section omitted', [
                'project_id' => $project->id,
                'instance_id' => $instanceId,
                'error' => $e->getMessage(),
            ]);

            return '';
        }

        if (trim($context) === '') {
            return '';
        }

        return "## Project context\n" . $context;
    }

    /**
     * "## Open tasks (top 10)" section: pending tasks of the project ordered
     * by priority (critical first) then sort_order, in a compact one-line
     * format: `- {short_id} [{priority}] {title} (files: ...)`.
     *
     * Fail-safe: on any failure the section is omitted (warning logged).
     */
    private function buildOpenTasksSection(SharedProject $project): string
    {
        try {
            $tasks = SharedTask::forProject($project->id)
                ->pending()
                ->orderByRaw(self::PRIORITY_DESC_SQL)
                ->orderBy('sort_order')
                ->limit(self::OPEN_TASKS_LIMIT)
                ->get(['id', 'priority', 'title', 'files']);
        } catch (Throwable $e) {
            Log::warning('Multi-agent prompt: open tasks listing failed, section omitted', [
                'project_id' => $project->id,
                'error' => $e->getMessage(),
            ]);

            return '';
        }

        if ($tasks->isEmpty()) {
            return '';
        }

        $lines = $tasks->map(function (SharedTask $task): string {
            $line = sprintf('- %s [%s] %s', substr($task->id, 0, 8), $task->priority, $task->title);

            if (!empty($task->files)) {
                $line .= ' (files: ' . implode(', ', $task->files) . ')';
            }

            return $line;
        });

        return "## Open tasks (top 10)\n" . $lines->implode("\n");
    }

    /**
     * Hard cap on the prompt size, approximated at CHARS_PER_TOKEN characters
     * per token. Truncates cleanly on the last full line and appends a
     * "[context truncated]" marker; the result never exceeds the byte budget.
     */
    private function truncateToTokenBudget(string $text, int $maxTokens = self::PROMPT_TOKEN_BUDGET): string
    {
        $maxChars = $maxTokens * self::CHARS_PER_TOKEN;

        if (strlen($text) <= $maxChars) {
            return $text;
        }

        $suffix = "\n[context truncated]";
        $cut = substr($text, 0, max(0, $maxChars - strlen($suffix)));

        // Cut on a line boundary so we never leave a dangling half-line.
        $lastNewline = strrpos($cut, "\n");
        if ($lastNewline !== false && $lastNewline > 0) {
            $cut = substr($cut, 0, $lastNewline);
        }

        return rtrim($cut) . $suffix;
    }
}
