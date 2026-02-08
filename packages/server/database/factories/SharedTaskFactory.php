<?php

namespace Database\Factories;

use App\Models\SharedProject;
use App\Models\SharedTask;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class SharedTaskFactory extends Factory
{
    protected $model = SharedTask::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'project_id' => SharedProject::factory(),
            'title' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'priority' => fake()->randomElement(['low', 'medium', 'high', 'critical']),
            'status' => 'pending',
            'dependencies' => [],
            'files' => [fake()->filePath(), fake()->filePath()],
            'estimated_tokens' => fake()->numberBetween(1000, 10000),
            'created_by' => 'instance-' . Str::random(8),
        ];
    }

    public function claimed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'in_progress',
            'assigned_to' => 'instance-' . Str::random(8),
            'claimed_at' => now(),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'done',
            'assigned_to' => 'instance-' . Str::random(8),
            'claimed_at' => now()->subHours(2),
            'completed_at' => now(),
            'completion_summary' => fake()->paragraph(),
            'files_modified' => [fake()->filePath()],
        ]);
    }
}
