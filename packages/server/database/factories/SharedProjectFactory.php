<?php

namespace Database\Factories;

use App\Models\Machine;
use App\Models\SharedProject;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class SharedProjectFactory extends Factory
{
    protected $model = SharedProject::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'user_id' => User::factory(),
            'machine_id' => Machine::factory(),
            'name' => fake()->words(3, true),
            'project_path' => '/home/user/projects/' . fake()->slug(2),
            'summary' => fake()->sentence(),
            'architecture' => fake()->paragraph(),
            'conventions' => fake()->paragraph(),
            'current_focus' => fake()->sentence(),
            'recent_changes' => fake()->paragraph(),
            'total_tokens' => 0,
            'max_tokens' => 1000000,
            'settings' => [
                'auto_sync' => true,
                'embedding_enabled' => true,
            ],
        ];
    }
}
