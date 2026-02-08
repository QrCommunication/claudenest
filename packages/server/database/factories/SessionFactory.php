<?php

namespace Database\Factories;

use App\Models\Machine;
use App\Models\Session;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class SessionFactory extends Factory
{
    protected $model = Session::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'machine_id' => Machine::factory(),
            'user_id' => User::factory(),
            'mode' => fake()->randomElement(['interactive', 'headless', 'oneshot']),
            'project_path' => '/home/user/projects/' . fake()->slug(2),
            'initial_prompt' => fake()->sentence(),
            'status' => 'running',
            'pid' => fake()->numberBetween(1000, 9999),
            'pty_size' => ['cols' => 120, 'rows' => 40],
            'total_tokens' => 0,
            'total_cost' => 0,
            'started_at' => now(),
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'exit_code' => 0,
            'completed_at' => now(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
            'exit_code' => 1,
            'completed_at' => now(),
        ]);
    }
}
