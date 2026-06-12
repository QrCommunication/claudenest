<?php

namespace Tests\Feature\Api;

use App\Models\Machine;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProjectContextGeneratorTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Canonical successful Ollama output: the single /api/generate call
     * returns a JSON string containing all five context sections.
     *
     * @return array<string, mixed>
     */
    private static function ollamaContext(): array
    {
        return [
            'summary' => 'Generated summary.',
            'architecture' => 'Generated architecture.',
            'conventions' => "- Generated convention A\n- Generated convention B",
            'current_focus' => 'Generated focus.',
            'suggested_tasks' => ['Review the docs', 'Setup the environment', 'Run the tests'],
        ];
    }

    /**
     * Fake Ollama up, replying to /api/generate with the given payload
     * serialized as a JSON string (mirrors `format: json` behaviour).
     *
     * @param array<string, mixed>|null $contextPayload
     */
    private function fakeOllamaUp(?array $contextPayload = null): void
    {
        config(['services.ollama.url' => 'http://ollama.test']);

        Http::fake([
            'ollama.test/api/tags' => Http::response(['models' => []], 200),
            'ollama.test/api/generate' => Http::response([
                'response' => json_encode($contextPayload ?? self::ollamaContext()),
            ], 200),
        ]);
    }

    /**
     * Fake Ollama up but answering /api/generate with a raw, non-JSON string.
     */
    private function fakeOllamaUpWithInvalidJson(): void
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
            ->assertJsonPath('meta.generated_by', 'ollama')
            ->assertJsonPath('data.summary', 'Generated summary.')
            ->assertJsonPath('data.architecture', 'Generated architecture.')
            ->assertJsonPath('data.conventions', "- Generated convention A\n- Generated convention B")
            ->assertJsonPath('data.current_focus', 'Generated focus.');
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
            ->assertJsonPath('meta.generated_by', 'ollama')
            ->assertJsonPath('data.summary', 'Generated summary.')
            ->assertJsonPath('data.current_focus', 'Generated focus.');
    }

    #[Test]
    public function generate_context_makes_a_single_ollama_generate_call(): void
    {
        $this->fakeOllamaUp();

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/projects/generate-context", $this->payload())
            ->assertOk();

        // Targeted by URL: the isAvailable() probe hits /api/tags and must
        // not be confused with generation calls.
        $generateCalls = Http::recorded(
            fn (ClientRequest $request) => str_contains($request->url(), '/api/generate'),
        );

        $this->assertCount(1, $generateCalls);

        [$generateRequest] = $generateCalls->first();
        $this->assertSame('json', $generateRequest['format']);
        $this->assertSame('30m', $generateRequest['keep_alive']);
        $this->assertFalse($generateRequest['stream']);
        $this->assertLessThanOrEqual(600, $generateRequest['options']['num_predict']);
    }

    #[Test]
    public function generate_context_maps_string_tasks_to_structured_objects(): void
    {
        $this->fakeOllamaUp();

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/projects/generate-context", $this->payload());

        $response->assertOk()
            ->assertJsonCount(3, 'data.suggested_tasks')
            ->assertJsonPath('data.suggested_tasks.0', [
                'title' => 'Review the docs',
                'priority' => 'medium',
                'description' => '',
                'files' => [],
            ]);
    }

    #[Test]
    public function generate_context_falls_back_section_by_section_when_json_partial(): void
    {
        // Only `summary` is usable: wrong types, blanks and missing keys must
        // be replaced by their template fallback without ever failing.
        $this->fakeOllamaUp([
            'summary' => 'LLM summary.',
            'architecture' => 123,
            'current_focus' => '   ',
            'suggested_tasks' => 'not-an-array',
        ]);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/projects/generate-context", $this->payload());

        $response->assertOk()
            ->assertJsonPath('data.summary', 'LLM summary.')
            ->assertJsonPath('data.architecture', '')
            ->assertJsonPath('data.conventions', '')
            ->assertJsonPath('data.current_focus', '')
            // At least one section came from the LLM → still attributed to it.
            ->assertJsonPath('meta.generated_by', 'ollama')
            ->assertJsonPath('data.suggested_tasks.0.title', 'Review project documentation');

        $this->assertCount(3, $response->json('data.suggested_tasks'));
    }

    #[Test]
    public function generate_context_falls_back_completely_when_response_is_not_json(): void
    {
        $this->fakeOllamaUpWithInvalidJson();

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/projects/generate-context", $this->payload());

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('meta.generated_by', 'fallback');

        $this->assertNotSame('', $response->json('data.summary'));
        $this->assertNotEmpty($response->json('data.suggested_tasks'));
    }

    #[Test]
    public function generate_context_falls_back_when_generate_endpoint_errors(): void
    {
        // isAvailable() succeeds but the generation itself fails — must
        // degrade to the template fallback, never a 500.
        config(['services.ollama.url' => 'http://ollama.test']);

        Http::fake([
            'ollama.test/api/tags' => Http::response(['models' => []], 200),
            'ollama.test/api/generate' => Http::response('upstream error', 500),
        ]);

        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/machines/{$machine->id}/projects/generate-context", $this->payload());

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('meta.generated_by', 'fallback');

        $this->assertNotEmpty($response->json('data.suggested_tasks'));
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
