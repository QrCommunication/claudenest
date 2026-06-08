<?php

namespace Tests\Unit\Services;

use App\Models\ContextChunk;
use App\Models\SharedProject;
use App\Services\ContextRAGService;
use App\Services\EmbeddingService;
use App\Services\SummarizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class ContextRAGServiceTest extends TestCase
{
    use RefreshDatabase;

    private ContextRAGService $service;
    private $embeddingService;
    private $summarizationService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->embeddingService = Mockery::mock(EmbeddingService::class);
        $this->summarizationService = Mockery::mock(SummarizationService::class);

        $this->service = new ContextRAGService(
            $this->embeddingService,
            $this->summarizationService
        );
    }

    /** @test */
    public function can_add_context_chunk_with_embedding(): void
    {
        $project = SharedProject::factory()->create();

        $this->embeddingService
            ->shouldReceive('isAvailable')
            ->once()
            ->andReturn(true);

        $this->embeddingService
            ->shouldReceive('generate')
            ->once()
            ->andReturn(array_fill(0, 384, 0.1));

        $chunk = $this->service->addContext(
            $project,
            'This is test context content',
            'context_update',
            ['instance_id' => 'test-instance']
        );

        $this->assertNotNull($chunk);
        $this->assertEquals('This is test context content', $chunk->content);
        $this->assertEquals('context_update', $chunk->type);
        $this->assertEquals('test-instance', $chunk->instance_id);
        $this->assertDatabaseHas('context_chunks', [
            'id' => $chunk->id,
            'project_id' => $project->id,
        ]);
    }

    /** @test */
    public function can_add_context_without_embedding_when_service_unavailable(): void
    {
        $project = SharedProject::factory()->create();

        $this->embeddingService
            ->shouldReceive('isAvailable')
            ->once()
            ->andReturn(false);

        $chunk = $this->service->addContext(
            $project,
            'Test content',
            'decision'
        );

        $this->assertNotNull($chunk);
        $this->assertDatabaseHas('context_chunks', [
            'id' => $chunk->id,
            'content' => 'Test content',
        ]);
    }

    /** @test */
    public function search_returns_array_of_results(): void
    {
        $project = SharedProject::factory()->create();

        ContextChunk::factory()->count(5)->for($project, 'project')->create();

        $this->embeddingService
            ->shouldReceive('isAvailable')
            ->andReturn(true);

        $this->embeddingService
            ->shouldReceive('generate')
            ->with('authentication')
            ->andReturn(array_fill(0, 384, 0.1));

        $results = $this->service->search($project->id, 'authentication', 3);

        $this->assertIsArray($results);
        $this->assertLessThanOrEqual(3, count($results));
    }

    /** @test */
    public function search_returns_empty_when_no_matching_context(): void
    {
        $project = SharedProject::factory()->create();

        $this->embeddingService
            ->shouldReceive('isAvailable')
            ->andReturn(true);

        $this->embeddingService
            ->shouldReceive('generate')
            ->andReturn(array_fill(0, 384, 0.1));

        $results = $this->service->search($project->id, 'nonexistent topic');

        $this->assertIsArray($results);
        $this->assertEmpty($results);
    }

    /** @test */
    public function can_compile_context_for_instance(): void
    {
        $project = SharedProject::factory()->create();

        ContextChunk::factory()->count(3)->for($project, 'project')->create([
            'type' => 'summary',
            'importance_score' => 0.9,
        ]);

        $compiled = $this->service->compileContext($project, 'instance-123');

        $this->assertIsString($compiled);
        $this->assertNotEmpty($compiled);
    }

    /** @test */
    public function compiled_context_respects_token_limit(): void
    {
        $project = SharedProject::factory()->create(['max_tokens' => 1000]);

        ContextChunk::factory()->count(50)->for($project, 'project')->create([
            'content' => str_repeat('Lorem ipsum ', 100),
        ]);

        $compiled = $this->service->compileContext($project, 'instance-123', maxTokens: 500);

        // Rough token count check (1 token ≈ 4 chars)
        $estimatedTokens = strlen($compiled) / 4;
        $this->assertLessThan(600, $estimatedTokens);
    }

    /** @test */
    public function can_prune_expired_context(): void
    {
        $project = SharedProject::factory()->create();

        ContextChunk::factory()->count(3)->for($project, 'project')->create([
            'expires_at' => now()->subDays(1),
        ]);

        ContextChunk::factory()->count(2)->for($project, 'project')->create([
            'expires_at' => now()->addDays(1),
        ]);

        $pruned = $this->service->cleanup();

        $this->assertEquals(3, $pruned);
        $this->assertDatabaseCount('context_chunks', 2);
    }

    /** @test */
    public function can_update_context_importance_scores(): void
    {
        $project = SharedProject::factory()->create();

        $chunk = ContextChunk::factory()->for($project, 'project')->create([
            'importance_score' => 0.5,
        ]);

        $this->service->updateImportanceScore($chunk, 0.9);

        $chunk->refresh();
        $this->assertEquals(0.9, $chunk->importance_score);
    }

    /** @test */
    public function can_get_context_statistics(): void
    {
        $project = SharedProject::factory()->create();

        ContextChunk::factory()->count(5)->for($project, 'project')->create(['type' => 'decision']);
        ContextChunk::factory()->count(3)->for($project, 'project')->create(['type' => 'summary']);

        $stats = $this->service->getStatistics($project);

        $this->assertIsArray($stats);
        $this->assertEquals(8, $stats['total_chunks']);
        $this->assertArrayHasKey('by_type', $stats);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
