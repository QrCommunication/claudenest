<?php

namespace App\Services;

use App\Models\ContextChunk;
use App\Models\SharedProject;

class ContextRAGService
{
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
        $estimatedTokens = ceil(strlen($content) / 4);
        $project->addTokens($estimatedTokens);

        return $chunk;
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
}
