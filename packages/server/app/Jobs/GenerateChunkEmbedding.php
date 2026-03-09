<?php

namespace App\Jobs;

use App\Models\ContextChunk;
use App\Services\EmbeddingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateChunkEmbedding implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        public ContextChunk $chunk
    ) {
        $this->onQueue('embeddings');
    }

    public function handle(EmbeddingService $embeddingService): void
    {
        if ($this->chunk->embedding !== null) {
            return;
        }

        $embedding = $embeddingService->generate($this->chunk->content);

        if ($embedding) {
            $this->chunk->setEmbedding($embedding);
            Log::debug('Embedding generated for chunk', ['chunk_id' => $this->chunk->id]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::warning('Failed to generate embedding for chunk', [
            'chunk_id' => $this->chunk->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
