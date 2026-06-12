<?php

namespace Database\Factories;

use App\Models\PushToken;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PushTokenFactory extends Factory
{
    protected $model = PushToken::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'user_id' => User::factory(),
            'token' => 'ExponentPushToken[' . Str::random(22) . ']',
            'platform' => fake()->randomElement(PushToken::PLATFORMS),
            'device_info' => ['name' => fake()->word() . ' phone'],
            'last_used_at' => now(),
        ];
    }
}
