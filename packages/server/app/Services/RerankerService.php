<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Reranking service for improving RAG precision.
 * 
 * Uses bge-reranker-base via Ollama to reorder retrieval results
 * based on query-document relevance scores.
 */
class RerankerService
{
    private string $baseUrl;
    private ?string $model;

    public function __construct()
    {
        $this->baseUrl = config('services.ollama.url', 'http://localhost:11434');
        $this->model = config('services.ollama.reranker_model');
    }

    /**
     * Check if reranking is enabled and available.
     */
    public function isEnabled(): bool
    {
        return !empty($this->model);
    }

    /**
     * Check if the reranker model is available.
     */
    public function isAvailable(): bool
    {
        if (!$this->isEnabled()) {
            return false;
        }

        try {
            $response = Http::timeout(5)->get("{$this->baseUrl}/api/tags");
            if (!$response->successful()) {
                return false;
            }

            $models = $response->json('models', []);
            foreach ($models as $model) {
                if (str_contains($model['name'] ?? '', $this->model)) {
                    return true;
                }
            }

            return false;
        } catch (\Exception $e) {
            Log::warning('Reranker availability check failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Rerank documents based on query relevance.
     *
     * @param string $query The search query
     * @param array $documents Array of documents with 'id' and 'content'
     * @param int $topK Number of top results to return
     * @return array Reordered documents
     */
    public function rerank(string $query, array $documents, int $topK = 5): array
    {
        // Return original if reranking disabled or no documents
        if (!$this->isEnabled() || empty($documents)) {
            return array_slice($documents, 0, $topK);
        }

        try {
            // Score each document against the query
            $scored = [];
            foreach ($documents as $doc) {
                $score = $this->scoreRelevance($query, $doc['content']);
                $scored[] = [
                    'doc' => $doc,
                    'score' => $score,
                ];
            }

            // Sort by score descending
            usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);

            // Return top K documents
            return array_map(
                fn($item) => $item['doc'],
                array_slice($scored, 0, $topK)
            );
        } catch (\Exception $e) {
            Log::error('Reranking failed', [
                'error' => $e->getMessage(),
                'query' => substr($query, 0, 100),
                'doc_count' => count($documents),
            ]);

            // Fallback: return original order
            return array_slice($documents, 0, $topK);
        }
    }

    /**
     * Score the relevance of a document to a query.
     *
     * @param string $query
     * @param string $document
     * @return float Relevance score (0-1, higher is better)
     */
    private function scoreRelevance(string $query, string $document): float
    {
        try {
            // Build prompt for reranker model
            $prompt = $this->buildRerankPrompt($query, $document);

            // Call Ollama API
            $response = Http::timeout(15)->post("{$this->baseUrl}/api/generate", [
                'model' => $this->model,
                'prompt' => $prompt,
                'stream' => false,
                'options' => [
                    'temperature' => 0.0, // Deterministic for scoring
                    'num_predict' => 10,  // Short response expected
                ],
            ]);

            if (!$response->successful()) {
                Log::warning('Reranker scoring request failed', [
                    'status' => $response->status(),
                    'body' => substr($response->body(), 0, 200),
                ]);
                return 0.5; // Neutral score on failure
            }

            $result = $response->json('response', '');
            return $this->parseScore($result);

        } catch (\Exception $e) {
            Log::warning('Reranker scoring error', ['error' => $e->getMessage()]);
            return 0.5; // Neutral score on error
        }
    }

    /**
     * Build prompt for reranking.
     * 
     * Format follows standard cross-encoder pattern:
     * Query [SEP] Document → Relevance Score
     */
    private function buildRerankPrompt(string $query, string $document): string
    {
        // Truncate document to avoid token limits
        $maxDocLength = 500;
        if (strlen($document) > $maxDocLength) {
            $document = substr($document, 0, $maxDocLength) . '...';
        }

        return <<<PROMPT
Rate how relevant this document is to the query on a scale of 0-10.

Query: {$query}

Document: {$document}

Respond with ONLY a number from 0 to 10, where:
- 0 = completely irrelevant
- 5 = somewhat relevant
- 10 = highly relevant and directly answers the query

Score:
PROMPT;
    }

    /**
     * Parse relevance score from model response.
     *
     * @param string $response
     * @return float Normalized score 0-1
     */
    private function parseScore(string $response): float
    {
        // Extract first number from response
        if (preg_match('/(\d+(?:\.\d+)?)/', trim($response), $matches)) {
            $score = (float) $matches[1];
            
            // Normalize to 0-1 range (assuming 0-10 scale)
            if ($score <= 10) {
                return $score / 10.0;
            }
            
            // If score > 10, assume 0-100 scale
            if ($score <= 100) {
                return $score / 100.0;
            }
        }

        // Default: neutral score if parsing fails
        Log::debug('Failed to parse reranker score', ['response' => $response]);
        return 0.5;
    }

    /**
     * Batch rerank multiple queries.
     *
     * @param array $queries Array of ['query' => string, 'documents' => array]
     * @param int $topK
     * @return array
     */
    public function rerankBatch(array $queries, int $topK = 5): array
    {
        $results = [];

        foreach ($queries as $item) {
            $query = $item['query'];
            $documents = $item['documents'];
            
            $results[] = [
                'query' => $query,
                'documents' => $this->rerank($query, $documents, $topK),
            ];
        }

        return $results;
    }
}
