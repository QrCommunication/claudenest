<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ContextChunk;
use App\Models\SharedProject;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ContextChunk>
 */
class ContextChunkFactory extends Factory
{
    protected $model = ContextChunk::class;

    public function definition(): array
    {
        return [
            'project_id' => SharedProject::factory(),
            'content' => $this->faker->paragraph(),
            // Must be one of the values allowed by chk_context_chunks_type.
            'type' => $this->faker->randomElement([
                'context_update', 'file_change', 'decision', 'summary', 'task_completion',
            ]),
            'embedding' => null,
            'instance_id' => 'instance-' . $this->faker->uuid(),
            'task_id' => null,
            'files' => [],
            'importance_score' => $this->faker->randomFloat(2, 0, 1),
            'expires_at' => now()->addDays(30),
        ];
    }
}
