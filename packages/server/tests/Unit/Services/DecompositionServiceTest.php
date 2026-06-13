<?php

namespace Tests\Unit\Services;

use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Sprint;
use App\Models\User;
use App\Services\DecompositionService;
use App\Services\EmbeddingService;
use App\Services\SummarizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * applyMasterPlan must create one Sprint per wave (first active, rest planning),
 * assign every task to its wave's sprint, and generate the onboarding context
 * when it is missing — all without hitting Ollama in tests.
 */
class DecompositionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Ollama off in tests → context generation falls back to the plan/PRD
        // summary and embeddings are skipped (no external calls).
        $summarization = Mockery::mock(SummarizationService::class);
        $summarization->shouldReceive('isAvailable')->andReturn(false);
        $this->app->instance(SummarizationService::class, $summarization);

        $embedding = Mockery::mock(EmbeddingService::class);
        $embedding->shouldReceive('isAvailable')->andReturn(false);
        $this->app->instance(EmbeddingService::class, $embedding);
    }

    private function projectWithPlan(array $overrides = []): SharedProject
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        return SharedProject::factory()->for($user)->for($machine)->create(array_merge([
            'prd' => 'Build a todo app with authentication and task management.',
            // Empty (not null — these columns are NOT NULL) means "no context
            // yet", which ensureProjectContext() treats as missing.
            'summary' => '',
            'architecture' => '',
            'conventions' => '',
            'master_plan' => [
                'version' => 1,
                'prd_summary' => 'A collaborative todo application.',
                'waves' => [
                    [
                        'id' => 0,
                        'name' => 'Foundation',
                        'description' => 'Database and models',
                        'tasks' => [
                            ['title' => 'Create migrations', 'description' => 'Schema', 'priority' => 'high'],
                            ['title' => 'Create models', 'description' => 'Eloquent'],
                        ],
                    ],
                    [
                        'id' => 1,
                        'name' => 'Backend',
                        'description' => 'API layer',
                        'tasks' => [
                            ['title' => 'Create controllers', 'depends_on' => ['Create models']],
                        ],
                    ],
                ],
            ],
        ], $overrides));
    }

    #[Test]
    public function apply_master_plan_creates_one_sprint_per_wave_and_assigns_tasks(): void
    {
        $project = $this->projectWithPlan();

        $result = app(DecompositionService::class)->applyMasterPlan($project);

        $this->assertSame(3, $result['created']);
        $this->assertSame(2, $result['sprints']);

        $sprints = Sprint::where('project_id', $project->id)->orderBy('sort_order')->get();
        $this->assertCount(2, $sprints);
        $this->assertSame('Foundation', $sprints[0]->name);
        $this->assertSame('Database and models', $sprints[0]->goal);
        $this->assertSame('active', $sprints[0]->status);
        $this->assertSame('Backend', $sprints[1]->name);
        $this->assertSame('planning', $sprints[1]->status);

        // Every task is attached to a sprint.
        $this->assertSame(
            0,
            SharedTask::where('project_id', $project->id)->whereNull('sprint_id')->count(),
        );
        $this->assertSame(2, $sprints[0]->tasks()->count());
        $this->assertSame(1, $sprints[1]->tasks()->count());

        // Wave assignment preserved.
        $this->assertSame(0, SharedTask::where('title', 'Create migrations')->first()->wave);
        $this->assertSame(1, SharedTask::where('title', 'Create controllers')->first()->wave);
    }

    #[Test]
    public function apply_master_plan_generates_missing_project_context(): void
    {
        $project = $this->projectWithPlan();

        app(DecompositionService::class)->applyMasterPlan($project);

        $project->refresh();
        // Ollama unavailable → summary falls back to the plan summary.
        $this->assertSame('A collaborative todo application.', $project->summary);
    }

    #[Test]
    public function apply_master_plan_with_epic_links_tasks_and_appends_planning_sprints(): void
    {
        $project = $this->projectWithPlan();
        $epic = \App\Models\Epic::create([
            'project_id' => $project->id,
            'title' => 'Billing',
            'color' => '#a855f7',
            'status' => 'open',
            'priority' => 'high',
        ]);

        $result = app(DecompositionService::class)->applyMasterPlan($project, $epic);

        $this->assertSame(3, $result['created']);
        $this->assertSame(2, $result['sprints']);

        // Every generated task is linked to the epic.
        $this->assertSame(
            0,
            SharedTask::where('project_id', $project->id)->where('epic_id', '!=', $epic->id)->count(),
        );
        $this->assertSame(3, $epic->tasks()->count());

        // Epic mode never activates a sprint (additive) — all planning.
        $this->assertSame(0, Sprint::where('project_id', $project->id)->where('status', 'active')->count());
        $this->assertSame(2, Sprint::where('project_id', $project->id)->where('status', 'planning')->count());
    }

    #[Test]
    public function apply_master_plan_does_not_overwrite_existing_context(): void
    {
        $project = $this->projectWithPlan([
            'summary' => 'Curated summary',
            'architecture' => 'Curated architecture',
            'conventions' => 'Curated conventions',
        ]);

        app(DecompositionService::class)->applyMasterPlan($project);

        $project->refresh();
        $this->assertSame('Curated summary', $project->summary);
        $this->assertSame('Curated architecture', $project->architecture);
        $this->assertSame('Curated conventions', $project->conventions);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
