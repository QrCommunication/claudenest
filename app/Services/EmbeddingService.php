<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EmbeddingService
{
    private string $baseUrl;
    private string $model;

    public function __construct()
    {
        $this->baseUrl = config('services.ollama.url', 'http://localhost:11434');
        $this->model = config('services.ollama.embedding_model', 'nomic-embed-text');
    }

    /**
     * Generate embedding for text.
     *
     * @param string $text
     * @return array|null
     */
    public function generate(string $text): ?array
    {
        try {
            $response = Http::timeout(30)->post("{$this->baseUrl}/api/embeddings", [
                'model' => $this->model,
                'prompt' => $text,
            ]);

            if ($response->successful()) {
                return $response->json('embedding');
            }

            Log::warning('Embedding generation failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Embedding service error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Generate embeddings for multiple texts.
     *
     * @param array $texts
     * @return array
     */
    public function generateBatch(array $texts): array
    {
        $embeddings = [];

        foreach ($texts as $key => $text) {
            $embedding = $this->generate($text);
            if ($embedding) {
                $embeddings[$key] = $embedding;
            }
        }

        return $embeddings;
    }

    /**
     * Calculate cosine similarity between two vectors.
     *
     * @param array $a
     * @param array $b
     * @return float
     */
    public function cosineSimilarity(array $a, array $b): float
    {
        $dotProduct = 0;
        $normA = 0;
        $normB = 0;

        foreach ($a as $i => $value) {
            $dotProduct += $value * ($b[$i] ?? 0);
            $normA += $value * $value;
            $normB += ($b[$i] ?? 0) * ($b[$i] ?? 0);
        }

        if ($normA == 0 || $normB == 0) {
            return 0;
        }

        return $dotProduct / (sqrt($normA) * sqrt($normB));
    }

    /**
     * Check if the embedding service is available.
     *
     * @return bool
     */
    public function isAvailable(): bool
    {
        try {
            $response = Http::timeout(5)->get("{$this->baseUrl}/api/tags");
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get available models from Ollama.
     *
     * @return array
     */
    public function getAvailableModels(): array
    {
        try {
            $response = Http::timeout(10)->get("{$this->baseUrl}/api/tags");

            if ($response->successful()) {
                return $response->json('models', []);
            }

            return [];
        } catch (\Exception $e) {
            Log::error('Failed to get Ollama models', ['error' => $e->getMessage()]);
            return [];
        }
    }
}
