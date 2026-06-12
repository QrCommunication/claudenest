<?php

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProjectContextGeneratorTest extends TestCase
{
    use RefreshDatabase;

    private const CONTEXT_SECTIONS = ['summary', 'architecture', 'conventions', 'current_focus'];

    private function fakeOllamaUp(): void
    {
        config(['services.ollama.url' => 'http://ollama.test']);

        Http::fake([
            'ollama.test/api/tags' => Http::response(['models' => []], 200),
            'ollama.test/api/generate' => Http::response(['response' => 'Generated text'], 200),
        ]);
    }

    private function fakeOllamaDown(): void
    {
        config(['services.ollama.url' => 'http://ollama.test']);

        Http::fake([
            'ollama.test/*' => Http::response([], 500),
        ]);
    }

    /**
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'path' => '/home/user/projects/acme-app',
            'tech_stack' => ['Laravel', 'Vue.js'],
            'readme' => "# Acme App\nA sample application.",
            'structure' => ['app/Models/User.php', 'resources/js/app.ts'],
        ], $overrides);
    }

    #[Test]
    public function generate_context_without_project_name_returns_all_sections(): void
    {
        $this->fakeOllamaUp();

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/projects/generate-context", $this->payload());

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success',
                'data' => [
                    'summary',
                    'architecture',
                    'conventions',
                    'current_focus',
                    'tech_stack',
                    'suggested_tasks',
                ],
                'meta' => ['generated_by'],
            ])
            ->assertJsonPath('meta.generated_by', 'ollama');

        foreach (self::CONTEXT_SECTIONS as $section) {
            $this->assertSame('Generated text', $response->json("data.{$section}"));
        }
    }

    #[Test]
    public function generate_context_with_project_name_returns_all_sections(): void
    {
        $this->fakeOllamaUp();

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson(
                "/api/machines/{$machine->id}/projects/generate-context",
                $this->payload(['project_name' => 'Acme App']),
            );

        $response->assertOk()
            ->assertJsonPath('meta.generated_by', 'ollama');

        foreach (self::CONTEXT_SECTIONS as $section) {
            $this->assertSame('Generated text', $response->json("data.{$section}"));
        }
    }

    #[Test]
    public function generate_context_normalizes_tech_stack(): void
    {
        $this->fakeOllamaUp();

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson(
                "/api/machines/{$machine->id}/projects/generate-context",
                $this->payload(['tech_stack' => ['Laravel', 'laravel', 'Vue.js', 'LARAVEL']]),
            );

        $response->assertOk()
            ->assertJsonPath('data.tech_stack', ['Laravel', 'Vue.js']);
    }

    #[Test]
    public function generate_context_returns_clean_fallback_when_ollama_unavailable(): void
    {
        $this->fakeOllamaDown();

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/projects/generate-context", $this->payload());

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    'summary',
                    'architecture',
                    'conventions',
                    'current_focus',
                    'tech_stack',
                    'suggested_tasks',
                ],
            ])
            ->assertJsonPath('meta.generated_by', 'fallback')
            ->assertJsonPath('data.tech_stack', ['Laravel', 'Vue.js']);

        $this->assertNotSame('', $response->json('data.summary'));
        $this->assertNotEmpty($response->json('data.suggested_tasks'));
    }

    #[Test]
    public function generate_context_rejects_machine_of_another_user(): void
    {
        $this->fakeOllamaUp();

        $user = User::factory()->create();
        $otherMachine = Machine::factory()->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$otherMachine->id}/projects/generate-context", $this->payload());

        $response->assertStatus(403);
    }

    #[Test]
    public function generate_context_requires_path_tech_stack_and_structure(): void
    {
        $this->fakeOllamaUp();

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/projects/generate-context", []);

        // API-wide custom 422 shape: { error: { code: VAL_001, details: {...} } }
        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'VAL_001');

        $details = $response->json('error.details');
        $this->assertArrayHasKey('path', $details);
        $this->assertArrayHasKey('tech_stack', $details);
        $this->assertArrayHasKey('structure', $details);
        $this->assertArrayNotHasKey('project_name', $details);
    }
}
