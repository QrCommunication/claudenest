<?php

namespace Tests\Unit\Services;

use App\Services\EmbeddingService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class EmbeddingServiceTest extends TestCase
{
    private EmbeddingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->service = new EmbeddingService();
    }

    /** @test */
    public function can_generate_embedding_from_text(): void
    {
        Http::fake([
            '*/api/embeddings' => Http::response([
                'embedding' => array_fill(0, 384, 0.1),
            ], 200),
        ]);

        $text = 'This is a test text for embedding generation';
        $embedding = $this->service->generate($text);

        $this->assertIsArray($embedding);
        $this->assertCount(384, $embedding);
        $this->assertIsFloat($embedding[0]);
    }

    /** @test */
    public function returns_null_when_ollama_unavailable(): void
    {
        Http::fake([
            '*/api/embeddings' => Http::response(null, 500),
        ]);

        $text = 'This is a test text';
        $embedding = $this->service->generate($text);

        $this->assertNull($embedding);
    }

    /** @test */
    public function can_check_if_service_is_available(): void
    {
        Http::fake([
            '*/api/tags' => Http::response(['models' => []], 200),
        ]);

        $isAvailable = $this->service->isAvailable();

        $this->assertTrue($isAvailable);
    }

    /** @test */
    public function service_unavailable_when_ollama_not_running(): void
    {
        Http::fake([
            '*/api/tags' => Http::response(null, 500),
        ]);

        $isAvailable = $this->service->isAvailable();

        $this->assertFalse($isAvailable);
    }

    /** @test */
    public function truncates_long_text_before_embedding(): void
    {
        Http::fake([
            '*/api/embeddings' => Http::response([
                'embedding' => array_fill(0, 384, 0.1),
            ], 200),
        ]);

        $longText = str_repeat('Lorem ipsum dolor sit amet ', 1000);
        $embedding = $this->service->generate($longText);

        $this->assertNotNull($embedding);
        $this->assertCount(384, $embedding);
    }

    /** @test */
    public function handles_empty_text(): void
    {
        $embedding = $this->service->generate('');

        $this->assertNull($embedding);
    }

    /** @test */
    public function can_batch_generate_embeddings(): void
    {
        Http::fake([
            '*/api/embeddings' => Http::response([
                'embedding' => array_fill(0, 384, 0.1),
            ], 200),
        ]);

        $texts = [
            'First text',
            'Second text',
            'Third text',
        ];

        $embeddings = $this->service->batchGenerate($texts);

        $this->assertIsArray($embeddings);
        $this->assertCount(3, $embeddings);
        $this->assertCount(384, $embeddings[0]);
    }

    /** @test */
    public function normalizes_embedding_vectors(): void
    {
        Http::fake([
            '*/api/embeddings' => Http::response([
                'embedding' => [1.0, 2.0, 3.0, 4.0],
            ], 200),
        ]);

        $embedding = $this->service->generate('test', normalize: true);

        // Check if normalized (magnitude should be ~1)
        $magnitude = sqrt(array_sum(array_map(fn($x) => $x * $x, $embedding)));
        $this->assertEqualsWithDelta(1.0, $magnitude, 0.001);
    }
}
