<?php

namespace Database\Factories;

use App\Models\Machine;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class MachineFactory extends Factory
{
    protected $model = Machine::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'user_id' => User::factory(),
            'name' => 'machine-' . fake()->unique()->slug(2),
            'token_hash' => bcrypt(Str::random(32)),
            'platform' => fake()->randomElement(['darwin', 'linux', 'win32']),
            'hostname' => fake()->domainWord(),
            'arch' => fake()->randomElement(['x64', 'arm64']),
            'node_version' => 'v20.11.0',
            'agent_version' => '1.0.0',
            'claude_version' => '0.9.0',
            'claude_path' => '/usr/local/bin/claude',
            'status' => 'online',
            'capabilities' => [
                'pty' => true,
                'mcp' => true,
                'context_sync' => true,
            ],
            'max_sessions' => 10,
            'last_seen_at' => now(),
            'connected_at' => now(),
        ];
    }

    public function offline(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'offline',
            'last_seen_at' => now()->subHours(2),
        ]);
    }

    public function withoutClaude(): static
    {
        return $this->state(fn (array $attributes) => [
            'claude_version' => null,
            'claude_path' => null,
        ]);
    }
}
