<?php

namespace Tests\Feature\Api;

use App\Models\ContextChunk;
use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use App\Services\ContextRAGService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Automatic RAG ingestion on task completion: the completion summary becomes
 * a searchable 'task_completion' context chunk via ContextRAGService, and a
 * RAG/embedding failure must never fail the completion itself.
 */
class TaskCompletionIngestionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private SharedProject $project;

    private SharedTask $task;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $machine = Machine::factory()->for($this->user)->create();
        $this->project = SharedProject::factory()->for($this->user)->for($machine)->create();
        $this->task = SharedTask::factory()->for($this->project, 'project')->claimed()->create([
            'title' => 'Implement login',
            'assigned_to' => 'inst-worker-1',
        ]);
    }

    #[Test]
    public function completing_a_task_ingests_a_task_completion_chunk(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/tasks/{$this->task->id}/complete", [
                'instance_id' => 'inst-worker-1',
                'summary' => 'Added JWT login with refresh tokens',
                'files_modified' => ['src/auth.ts', 'src/jwt.ts'],
            ]);

        $response->assertOk()->assertJsonPath('data.status', 'done');

        $chunk = ContextChunk::where('project_id', $this->project->id)
            ->where('type', 'task_completion')
            ->firstOrFail();

        $this->assertSame('Implement login: Added JWT login with refresh tokens', $chunk->content);
        $this->assertSame($this->task->id, $chunk->task_id);
        $this->assertSame('inst-worker-1', $chunk->instance_id);
        $this->assertSame(['src/auth.ts', 'src/jwt.ts'], $chunk->files);
        $this->assertEqualsWithDelta(0.7, (float) $chunk->importance_score, 0.001);
        $this->assertNotNull($chunk->expires_at);
    }

    #[Test]
    public function completion_succeeds_even_when_rag_ingestion_throws(): void
    {
        $this->mock(ContextRAGService::class)
            ->shouldReceive('addContext')
            ->once()
            ->andThrow(new \RuntimeException('Ollama exploded'));

        $response = $this->actingAs($this->user)
            ->postJson("/api/tasks/{$this->task->id}/complete", [
                'instance_id' => 'inst-worker-1',
                'summary' => 'Done anyway',
            ]);

        $response->assertOk()->assertJsonPath('data.status', 'done');

        $this->assertSame('done', $this->task->fresh()->status);
        $this->assertSame(0, ContextChunk::where('type', 'task_completion')->count());
    }
}
