<?php

namespace Tests\Unit\Services;

use PHPUnit\Framework\Attributes\Test;

use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\User;
use App\Services\ContextRAGService;
use App\Services\MultiAgentSessionService;
use App\Services\OrchestratorService;
use Mockery;
use RuntimeException;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MultiAgentSessionServiceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: Session, 1: SharedProject}
     */
    private function makeAttachFixtures(array $projectAttributes = []): array
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();
        $project = SharedProject::factory()->for($user)->for($machine)->create($projectAttributes);
        $session = Session::factory()->for($machine)->for($user)->create();

        return [$session, $project];
    }

    private function makeService(?ContextRAGService $contextRAGService = null): MultiAgentSessionService
    {
        return new MultiAgentSessionService(
            app(OrchestratorService::class),
            $contextRAGService ?? app(ContextRAGService::class),
        );
    }

    #[Test]
    public function attach_prompt_contains_identity_rules_context_and_open_tasks(): void
    {
        [$session, $project] = $this->makeAttachFixtures([
            'summary' => 'A remote Claude orchestration platform.',
        ]);

        $criticalTask = SharedTask::factory()->for($project, 'project')->create([
            'title' => 'Implement auth middleware',
            'priority' => 'critical',
            'status' => 'pending',
            'sort_order' => 5,
            'files' => ['src/auth.ts', 'src/middleware.ts'],
        ]);
        SharedTask::factory()->for($project, 'project')->create([
            'title' => 'Write API docs',
            'priority' => 'low',
            'status' => 'pending',
            'sort_order' => 1,
            'files' => [],
        ]);
        SharedTask::factory()->for($project, 'project')->completed()->create([
            'title' => 'Already shipped task',
        ]);

        $result = $this->makeService()->attach($session, $project);
        $prompt = $result['appendSystemPrompt'];

        // Identity + collaboration rules
        $this->assertStringContainsString("You are Claude instance inst-{$session->id}", $prompt);
        $this->assertStringContainsString('Collaboration rules:', $prompt);

        // Compiled project context
        $this->assertStringContainsString('## Project context', $prompt);
        $this->assertStringContainsString('A remote Claude orchestration platform.', $prompt);

        // Open tasks: compact format `- {short_id} [{priority}] {title} (files: ...)`
        $this->assertStringContainsString('## Open tasks (top 10)', $prompt);
        $shortId = substr($criticalTask->id, 0, 8);
        $this->assertStringContainsString(
            "- {$shortId} [critical] Implement auth middleware (files: src/auth.ts, src/middleware.ts)",
            $prompt,
        );
        $this->assertStringContainsString('[low] Write API docs', $prompt);

        // Priority desc ordering: critical listed before low despite higher sort_order
        $this->assertLessThan(
            strpos($prompt, 'Write API docs'),
            strpos($prompt, 'Implement auth middleware'),
        );

        // Non-pending tasks are excluded
        $this->assertStringNotContainsString('Already shipped task', $prompt);
    }

    #[Test]
    public function attach_prompt_is_capped_to_the_hard_token_budget(): void
    {
        [$session, $project] = $this->makeAttachFixtures();

        // ~84k chars (~21k tokens), far beyond the 4000-token hard cap
        $hugeContext = str_repeat("Some very important project context line.\n", 2000);

        $contextRAG = Mockery::mock(ContextRAGService::class);
        $contextRAG->shouldReceive('compileContext')
            ->once()
            ->with(
                Mockery::on(fn ($p) => $p instanceof SharedProject && $p->id === $project->id),
                "inst-{$session->id}",
                3000,
            )
            ->andReturn($hugeContext);

        $prompt = $this->makeService($contextRAG)->attach($session, $project)['appendSystemPrompt'];

        // 4000 tokens * 4 chars/token = 16000 chars hard cap
        $this->assertLessThanOrEqual(16000, strlen($prompt));
        $this->assertStringEndsWith('[context truncated]', $prompt);

        // Identity + rules sit at the head of the prompt and survive truncation
        $this->assertStringContainsString("You are Claude instance inst-{$session->id}", $prompt);
        $this->assertStringContainsString('Collaboration rules:', $prompt);
    }

    #[Test]
    public function attach_succeeds_even_when_context_compilation_throws(): void
    {
        [$session, $project] = $this->makeAttachFixtures();

        SharedTask::factory()->for($project, 'project')->create([
            'title' => 'Survives context failure',
            'priority' => 'high',
            'status' => 'pending',
            'sort_order' => 1,
            'files' => [],
        ]);

        $contextRAG = Mockery::mock(ContextRAGService::class);
        $contextRAG->shouldReceive('compileContext')
            ->andThrow(new RuntimeException('Ollama is down'));

        $result = $this->makeService($contextRAG)->attach($session, $project);

        // attach() fully succeeded: instance registered + scoped token minted
        $this->assertSame("inst-{$session->id}", $result['instanceId']);
        $this->assertDatabaseHas('claude_instances', [
            'id' => "inst-{$session->id}",
            'project_id' => $project->id,
        ]);
        $this->assertNotEmpty($result['mcpEnv']['CLAUDENEST_TOKEN']);

        $prompt = $result['appendSystemPrompt'];

        // Identity + rules preserved, context section omitted
        $this->assertStringContainsString("You are Claude instance inst-{$session->id}", $prompt);
        $this->assertStringContainsString('Collaboration rules:', $prompt);
        $this->assertStringNotContainsString('## Project context', $prompt);

        // Sections are independent: open tasks still listed
        $this->assertStringContainsString('Survives context failure', $prompt);
    }

    #[Test]
    public function attach_prompt_limits_open_tasks_to_ten(): void
    {
        [$session, $project] = $this->makeAttachFixtures();

        foreach (range(1, 15) as $i) {
            SharedTask::factory()->for($project, 'project')->create([
                'title' => sprintf('Task number %02d', $i),
                'priority' => 'medium',
                'status' => 'pending',
                'sort_order' => $i,
                'files' => [],
            ]);
        }

        $prompt = $this->makeService()->attach($session, $project)['appendSystemPrompt'];

        $this->assertStringContainsString('## Open tasks (top 10)', $prompt);
        $this->assertStringContainsString('Task number 01', $prompt);
        $this->assertStringContainsString('Task number 10', $prompt);
        $this->assertStringNotContainsString('Task number 11', $prompt);
        $this->assertStringNotContainsString('Task number 15', $prompt);
        $this->assertSame(10, substr_count($prompt, 'Task number'));
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
