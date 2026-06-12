<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SummarizationService
{
    /**
     * How long Ollama keeps the model loaded after a request. The default
     * (5 min) forces a ~23s cold load on every wizard run; 30 min combined
     * with the scheduled warm-up ping keeps the model permanently hot.
     */
    private const KEEP_ALIVE = '30m';

    private string $baseUrl;
    private string $model;
    private int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.ollama.url', 'http://localhost:11434');
        $this->model = config('services.ollama.model', 'mistral');
        $this->timeout = (int) config('services.ollama.timeout', 240);
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
            $response = Http::timeout($this->timeout)->post("{$this->baseUrl}/api/generate", [
                'model' => $this->model,
                'prompt' => $prompt,
                'stream' => false,
                'keep_alive' => self::KEEP_ALIVE,
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
     * Generate a structured JSON object from a prompt.
     *
     * Uses Ollama's `format: json` constraint so the model emits valid JSON.
     * Returns the decoded array, or null when the call fails or the output
     * is not a JSON object/array — callers must provide their own fallback.
     *
     * @return array<string, mixed>|null
     */
    public function generateJson(string $prompt, int $maxTokens = 600): ?array
    {
        try {
            $response = Http::timeout($this->timeout)->post("{$this->baseUrl}/api/generate", [
                'model' => $this->model,
                'prompt' => $prompt,
                'stream' => false,
                'format' => 'json',
                'keep_alive' => self::KEEP_ALIVE,
                'options' => [
                    'num_predict' => $maxTokens,
                    // Lower temperature than free-form generation: structured
                    // extraction needs schema fidelity, not creativity.
                    'temperature' => 0.3,
                ],
            ]);

            if (!$response->successful()) {
                Log::warning('JSON generation failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $raw = trim((string) $response->json('response'));

            if ($raw === '') {
                return null;
            }

            $decoded = json_decode($raw, true);

            return is_array($decoded) ? $decoded : null;
        } catch (\Exception $e) {
            Log::error('Summarization service error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Best-effort warm-up ping: a 1-token generation that (re)loads the model
     * and refreshes its keep_alive window. Scheduled every 25 minutes so the
     * project-context wizard never pays the ~23s cold load.
     */
    public function warmUp(): void
    {
        try {
            Http::timeout(90)->post("{$this->baseUrl}/api/generate", [
                'model' => $this->model,
                'prompt' => 'ok',
                'stream' => false,
                'keep_alive' => self::KEEP_ALIVE,
                'options' => [
                    'num_predict' => 1,
                ],
            ]);
        } catch (\Exception $e) {
            // Warm-up is opportunistic — never let it pollute the scheduler.
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
