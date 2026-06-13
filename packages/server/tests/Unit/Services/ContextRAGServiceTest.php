<?php

namespace Tests\Unit\Services;

use PHPUnit\Framework\Attributes\Test;

use App\Models\ContextChunk;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Sprint;
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
    public function record_task_completion_creates_chunk_and_updates_living_context(): void
    {
        $this->embeddingService->shouldReceive('isAvailable')->andReturn(false);

        $project = SharedProject::factory()->create([
            'recent_changes' => '',
            'current_focus' => '',
        ]);

        $sprint = Sprint::create([
            'project_id' => $project->id,
            'name' => 'Foundation',
            'status' => 'active',
            'sort_order' => 0,
        ]);

        $done = SharedTask::factory()->for($project, 'project')->create([
            'title' => 'Build auth',
            'status' => 'done',
            'sprint_id' => $sprint->id,
        ]);
        SharedTask::factory()->for($project, 'project')->create([
            'title' => 'Build dashboard UI',
            'status' => 'pending',
            'priority' => 'high',
            'sprint_id' => $sprint->id,
        ]);

        $this->service->recordTaskCompletion(
            $project,
            $done,
            'Added JWT login with refresh tokens',
            ['src/auth.ts'],
            'inst-worker-1',
        );

        // 1. Searchable RAG chunk.
        $this->assertDatabaseHas('context_chunks', [
            'project_id' => $project->id,
            'type' => 'task_completion',
            'task_id' => $done->id,
        ]);

        // 2. Living structured context.
        $project->refresh();
        $this->assertStringContainsString('Build auth', (string) $project->recent_changes);
        $this->assertStringContainsString('Added JWT login', (string) $project->recent_changes);
        $this->assertStringContainsString('Sprint: Foundation', (string) $project->current_focus);
        $this->assertStringContainsString('1/2 tasks done', (string) $project->current_focus);
        $this->assertStringContainsString('Next up: Build dashboard UI', (string) $project->current_focus);
    }

    #[Test]
    public function record_task_completion_caps_the_recent_changes_log(): void
    {
        $this->embeddingService->shouldReceive('isAvailable')->andReturn(false);

        $existing = collect(range(1, 20))
            ->map(fn (int $i) => "- [2026-06-01] Old task {$i} — done")
            ->implode("\n");

        $project = SharedProject::factory()->create(['recent_changes' => $existing]);
        $task = SharedTask::factory()->for($project, 'project')->create([
            'title' => 'Newest task',
            'status' => 'done',
        ]);

        $this->service->recordTaskCompletion($project, $task, 'fresh work', [], 'inst-1');

        $project->refresh();
        $lines = array_filter(explode("\n", (string) $project->recent_changes));
        $this->assertLessThanOrEqual(15, count($lines));
        $this->assertStringContainsString('Newest task', $lines[array_key_first($lines)]);
    }

    #[Test]
    public function record_task_completion_swallows_rag_failure_but_still_updates_context(): void
    {
        $this->embeddingService->shouldReceive('isAvailable')->andReturn(true);
        $this->embeddingService->shouldReceive('generate')
            ->andThrow(new \RuntimeException('Ollama exploded'));

        $project = SharedProject::factory()->create(['recent_changes' => '']);
        $task = SharedTask::factory()->for($project, 'project')->create([
            'title' => 'Resilient task',
            'status' => 'done',
        ]);

        // Must not throw despite the embedding failure inside addContext().
        $this->service->recordTaskCompletion($project, $task, 'done anyway', [], 'inst-1');

        // The RAG chunk was not created (addContext threw before persisting)...
        $this->assertSame(0, ContextChunk::where('type', 'task_completion')->count());
        // ...but the living context is independent and still refreshed.
        $project->refresh();
        $this->assertStringContainsString('Resilient task', (string) $project->recent_changes);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
