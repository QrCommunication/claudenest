<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SummarizationService
{
    private string $baseUrl;
    private string $model;

    public function __construct()
    {
        $this->baseUrl = config('services.ollama.url', 'http://localhost:11434');
        $this->model = config('services.ollama.model', 'mistral');
    }

    /**
     * Summarize text content.
     *
     * @param string $text
     * @param int $maxLength
     * @return string|null
     */
    public function summarize(string $text, int $maxLength = 1000): ?string
    {
        $prompt = "Summarize the following text in {$maxLength} characters or less:\n\n{$text}\n\nSummary:";

        return $this->generate($prompt);
    }

    /**
     * Summarize code changes.
     *
     * @param string $diff
     * @return string|null
     */
    public function summarizeCodeChanges(string $diff): ?string
    {
        $prompt = "Summarize these code changes concisely:\n\n{$diff}\n\nSummary:";

        return $this->generate($prompt, 500);
    }

    /**
     * Generate text from prompt.
     *
     * @param string $prompt
     * @param int|null $maxTokens
     * @return string|null
     */
    public function generate(string $prompt, ?int $maxTokens = null): ?string
    {
        try {
            $response = Http::timeout(60)->post("{$this->baseUrl}/api/generate", [
                'model' => $this->model,
                'prompt' => $prompt,
                'stream' => false,
                'options' => [
                    'num_predict' => $maxTokens ?? 1000,
                    'temperature' => 0.7,
                ],
            ]);

            if ($response->successful()) {
                return trim($response->json('response'));
            }

            Log::warning('Text generation failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Summarization service error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Generate project architecture description.
     *
     * @param array $files
     * @return string|null
     */
    public function generateArchitectureDescription(array $files): ?string
    {
        $fileList = implode("\n", array_slice($files, 0, 50));
        $prompt = "Based on these files, describe the project architecture:\n\n{$fileList}\n\nArchitecture:";

        return $this->generate($prompt, 2000);
    }

    /**
     * Check if the service is available.
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
}
