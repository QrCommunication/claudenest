<?php

namespace Database\Factories;

use App\Models\FileLock;
use App\Models\SharedProject;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class FileLockFactory extends Factory
{
    protected $model = FileLock::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'project_id' => SharedProject::factory(),
            'path' => 'src/' . fake()->filePath(),
            'locked_by' => 'instance-' . Str::random(8),
            'reason' => fake()->sentence(),
            'locked_at' => now(),
            'expires_at' => now()->addMinutes(30),
        ];
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->subMinutes(5),
        ]);
    }
}
