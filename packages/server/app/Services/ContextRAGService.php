<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ContextChunk;
use App\Models\SharedProject;
use App\Models\SharedTask;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ContextRAGService
{
    /**
     * Rolling recent-changes log size: how many of the most recent task
     * completions are kept in the project's living context.
     */
    private const MAX_RECENT_CHANGES = 15;

    /**
     * Minimum delay between two global-summary regenerations per project. The
     * summary is rebuilt from accumulated completions via Ollama, which is too
     * costly to run on every single completion during a burst; one refresh per
     * window keeps it current while the rolling recent_changes log captures
     * every completion in between.
     */
    private const SUMMARY_REFRESH_THROTTLE_SECONDS = 90;

    private EmbeddingService $embeddingService;
    private SummarizationService $summarizationService;

    public function __construct(
        EmbeddingService $embeddingService,
        SummarizationService $summarizationService
    ) {
        $this->embeddingService = $embeddingService;
        $this->summarizationService = $summarizationService;
    }

    /**
     * Add context chunk to project.
     *
     * @param SharedProject $project
     * @param string $content
     * @param string $type
     * @param array $metadata
     * @return ContextChunk|null
     */
    public function addContext(
        SharedProject $project,
        string $content,
        string $type,
        array $metadata = []
    ): ?ContextChunk {
        // Generate embedding if service available
        $embedding = null;
        if ($this->embeddingService->isAvailable()) {
            $embedding = $this->embeddingService->generate($content);
        }

        $chunk = ContextChunk::create([
            'project_id' => $project->id,
            'content' => $content,
            'type' => $type,
            'instance_id' => $metadata['instance_id'] ?? null,
            'task_id' => $metadata['task_id'] ?? null,
            'files' => $metadata['files'] ?? [],
            'importance_score' => $metadata['importance_score'] ?? 0.5,
            'expires_at' => $metadata['expires_at'] ?? now()->addDays(
                $project->getSetting('contextRetentionDays', 30)
            ),
        ]);

        if ($embedding) {
            $chunk->setEmbedding($embedding);
        }

        // Update project token count
        $estimatedTokens = (int) ceil(strlen($content) / 4);
        $project->addTokens($estimatedTokens);

        return $chunk;
    }

    /**
     * Record a completed task into the project's LIVING context.
     *
     * Two effects, both best-effort (a failure here must never fail the task
     * completion that triggered it):
     *  1. A searchable `task_completion` RAG chunk (embedded when Ollama is up).
     *  2. The structured living context — a rolling `recent_changes` log and a
     *     refreshed `current_focus` (sprint progress + next task). Both are
     *     injected into every recycled worker's prompt via compileContext(),
     *     so the global context reflects real progress, never a stale snapshot.
     */
    public function recordTaskCompletion(
        SharedProject $project,
        SharedTask $task,
        string $summary,
        array $filesModified = [],
        ?string $instanceId = null,
    ): void {
        try {
            $this->addContext(
                $project,
                "{$task->title}: {$summary}",
                'task_completion',
                [
                    'instance_id' => $instanceId,
                    'task_id' => $task->id,
                    'files' => $filesModified,
                    'importance_score' => 0.7,
                ],
            );
        } catch (\Throwable $e) {
            Log::warning('Task completion RAG ingestion failed', [
                'task_id' => $task->id,
                'project_id' => $project->id,
                'error' => $e->getMessage(),
            ]);
        }

        try {
            $this->refreshLivingContext($project, $task, $summary, $filesModified);
        } catch (\Throwable $e) {
            Log::warning('Living context refresh failed on task completion', [
                'task_id' => $task->id,
                'project_id' => $project->id,
                'error' => $e->getMessage(),
            ]);
        }

        try {
            $this->refreshGlobalSummary($project);
        } catch (\Throwable $e) {
            Log::warning('Global summary refresh failed on task completion', [
                'task_id' => $task->id,
                'project_id' => $project->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Regenerate the project's GLOBAL summary from the work completed so far,
     * so the high-level summary keeps pace with the project instead of staying
     * frozen at creation. Throttled (see SUMMARY_REFRESH_THROTTLE_SECONDS) and
     * best-effort — never blocks task completion.
     */
    private function refreshGlobalSummary(SharedProject $project): void
    {
        if (! $this->summarizationService->isAvailable()) {
            return;
        }

        $throttleKey = "claudenest:summary_refresh:{$project->id}";
        if (! Cache::add($throttleKey, 1, self::SUMMARY_REFRESH_THROTTLE_SECONDS)) {
            return;
        }

        $project->refresh();

        $recent = $project->contextChunks()
            ->where('type', 'task_completion')
            ->active()
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->pluck('content')
            ->implode("\n");

        if (trim($recent) === '') {
            return;
        }

        $current = trim((string) $project->summary);
        $prompt = <<<PROMPT
You maintain the living summary of a software project named "{$project->name}".
Update the project summary so it reflects the latest completed work. Keep it to
ONE concise paragraph (3-5 sentences) describing what the project IS and its
current state. Output ONLY the summary text — no preamble, no markdown headers.

## Current summary
{$current}

## Recently completed work
{$recent}
PROMPT;

        $updated = $this->summarizationService->generate($prompt, 600);
        if ($updated && trim($updated) !== '') {
            $project->update(['summary' => Str::limit(trim($updated), 2000)]);
        }
    }

    /**
     * Maintain the project's living structured context after a completion:
     * prepend to a bounded recent-changes log and recompute the current focus
     * from real task/sprint state.
     *
     * @param array<int, string> $filesModified
     */
    private function refreshLivingContext(
        SharedProject $project,
        SharedTask $task,
        string $summary,
        array $filesModified,
    ): void {
        $fileCount = count($filesModified);
        $filesNote = $fileCount > 0
            ? ' (' . $fileCount . ' file' . ($fileCount === 1 ? '' : 's') . ')'
            : '';

        $entry = sprintf(
            '- [%s] %s — %s%s',
            now()->toDateString(),
            Str::limit($task->title, 80),
            Str::limit(trim($summary), 140),
            $filesNote,
        );

        $existing = array_values(array_filter(
            preg_split('/\r?\n/', (string) $project->recent_changes) ?: [],
            static fn ($line) => trim((string) $line) !== '',
        ));

        $log = array_slice(array_merge([$entry], $existing), 0, self::MAX_RECENT_CHANGES);

        // Live focus from real state: active sprint progress + next pending task.
        $total = SharedTask::forProject($project->id)->count();
        $done = SharedTask::forProject($project->id)->where('status', 'done')->count();

        $next = SharedTask::forProject($project->id)
            ->pending()
            ->orderByRaw("CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END")
            ->orderBy('sort_order')
            ->first(['title']);

        $activeSprint = $project->sprints()
            ->where('status', 'active')
            ->orderBy('sort_order')
            ->first(['name']);

        $focus = sprintf(
            '%s — %d/%d tasks done.%s',
            $activeSprint ? "Sprint: {$activeSprint->name}" : 'Backlog',
            $done,
            $total,
            $next ? " Next up: {$next->title}." : ' All tasks complete.',
        );

        $project->update([
            'recent_changes' => implode("\n", $log),
            'current_focus' => Str::limit($focus, 500),
        ]);
    }

    /**
     * Search context for relevant information.
     *
     * @param string $projectId
     * @param string $query
     * @param int $limit
     * @return array
     */
    public function search(string $projectId, string $query, int $limit = 10): array
    {
        // Try embedding-based search first
        if ($this->embeddingService->isAvailable()) {
            $embedding = $this->embeddingService->generate($query);

            if ($embedding) {
                $chunks = ContextChunk::findSimilar($projectId, $embedding, $limit, 0.6);

                if ($chunks->count() > 0) {
                    return $chunks->toArray();
                }
            }
        }

        // Fallback to text search
        return ContextChunk::semanticSearch($projectId, $query, $limit)->toArray();
    }

    /**
     * Compile context for Claude instance.
     *
     * @param SharedProject $project
     * @param string $instanceId
     * @param int $maxTokens
     * @return string
     */
    public function compileContext(SharedProject $project, string $instanceId, int $maxTokens = 8000): string
    {
        $sections = [];
        $usedTokens = 0;

        // 1. Add project summary (always include)
        if (!empty($project->summary)) {
            $summaryTokens = ceil(strlen($project->summary) / 4);
            if ($summaryTokens + $usedTokens <= $maxTokens) {
                $sections[] = "# Project Summary\n{$project->summary}";
                $usedTokens += $summaryTokens;
            }
        }

        // 2. Add architecture
        if (!empty($project->architecture)) {
            $archTokens = ceil(strlen($project->architecture) / 4);
            if ($archTokens + $usedTokens <= $maxTokens) {
                $sections[] = "# Architecture\n{$project->architecture}";
                $usedTokens += $archTokens;
            }
        }

        // 3. Add conventions
        if (!empty($project->conventions)) {
            $convTokens = ceil(strlen($project->conventions) / 4);
            if ($convTokens + $usedTokens <= $maxTokens) {
                $sections[] = "# Conventions\n{$project->conventions}";
                $usedTokens += $convTokens;
            }
        }

        // 3b. Current focus — live: refreshed on every task completion so a
        // recycled worker reads the real state (sprint progress + next task),
        // not the static snapshot captured at decomposition time.
        if (!empty($project->current_focus)) {
            $focusTokens = ceil(strlen($project->current_focus) / 4);
            if ($focusTokens + $usedTokens <= $maxTokens) {
                $sections[] = "# Current Focus\n{$project->current_focus}";
                $usedTokens += $focusTokens;
            }
        }

        // 3c. Recent changes — live rolling log of completed tasks.
        if (!empty($project->recent_changes)) {
            $changesTokens = ceil(strlen($project->recent_changes) / 4);
            if ($changesTokens + $usedTokens <= $maxTokens) {
                $sections[] = "# Recent Changes\n{$project->recent_changes}";
                $usedTokens += $changesTokens;
            }
        }

        // 4. Add recent high-importance chunks
        $remainingTokens = $maxTokens - $usedTokens;
        if ($remainingTokens > 500) {
            $chunks = $project->contextChunks()
                ->active()
                ->highImportance(0.7)
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get();

            $chunkContent = [];
            foreach ($chunks as $chunk) {
                $chunkTokens = ceil(strlen($chunk->content) / 4);
                if ($chunkTokens + $usedTokens <= $maxTokens) {
                    $chunkContent[] = $chunk->content;
                    $usedTokens += $chunkTokens;
                } else {
                    break;
                }
            }

            if (!empty($chunkContent)) {
                $sections[] = "# Recent Context\n" . implode("\n\n", $chunkContent);
            }
        }

        return implode("\n\n---\n\n", $sections);
    }

    /**
     * Summarize and update project context.
     *
     * @param SharedProject $project
     * @return void
     */
    public function summarizeContext(SharedProject $project): void
    {
        if (!$this->summarizationService->isAvailable()) {
            return;
        }

        // Get recent chunks
        $chunks = $project->contextChunks()
            ->active()
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->pluck('content')
            ->implode("\n\n");

        if (empty($chunks)) {
            return;
        }

        // Update summary
        $summary = $this->summarizationService->summarize($chunks, 2000);
        if ($summary) {
            $project->update(['recent_changes' => $summary]);
        }
    }

    /**
     * Clean up expired chunks.
     *
     * @return int
     */
    public function cleanup(): int
    {
        return ContextChunk::cleanupExpired();
    }

    /**
     * Update the importance score of a single context chunk.
     */
    public function updateImportanceScore(ContextChunk $chunk, float $score): ContextChunk
    {
        $chunk->update(['importance_score' => $score]);

        return $chunk;
    }

    /**
     * Aggregate statistics for a project's context chunks.
     *
     * @return array{total_chunks: int, by_type: array<string, int>}
     */
    public function getStatistics(SharedProject $project): array
    {
        $byType = $project->contextChunks()
            ->toBase()
            ->selectRaw('type, count(*) as aggregate_count')
            ->groupBy('type')
            ->pluck('aggregate_count', 'type')
            ->map(fn ($count) => (int) $count)
            ->all();

        return [
            'total_chunks' => array_sum($byType),
            'by_type' => $byType,
        ];
    }
}
