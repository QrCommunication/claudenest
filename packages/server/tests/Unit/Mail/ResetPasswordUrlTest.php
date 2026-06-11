<?php

declare(strict_types=1);

namespace Tests\Unit\Mail;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Tests\TestCase;

/**
 * Guards against the API-only RouteNotFoundException trap: without
 * ResetPassword::createUrlUsing (AppServiceProvider::boot), the default
 * notification builds its URL via route('password.reset') — a route that
 * does not exist on this backend — and throws BEFORE the email is sent.
 *
 * Uses a non-persisted User (no DB access needed).
 */
class ResetPasswordUrlTest extends TestCase
{
    public function test_reset_url_points_to_the_spa_route(): void
    {
        config(['app.url' => 'https://claudenest.io']);

        $user = new User(['email' => 'john+test@example.com', 'name' => 'John']);

        $mailMessage = (new ResetPassword('test-token'))->toMail($user);

        $this->assertSame(
            'https://claudenest.io/reset-password?token=test-token&email=john%2Btest%40example.com',
            $mailMessage->actionUrl
        );
    }

    public function test_reset_mail_renders_without_a_named_password_reset_route(): void
    {
        config(['app.url' => 'https://claudenest.io']);

        $user = new User(['email' => 'user@example.com', 'name' => 'User']);

        // Full render: would throw RouteNotFoundException if createUrlUsing
        // were missing, and catches any broken markdown template.
        $html = (string) (new ResetPassword('tok-123'))->toMail($user)->render();

        $this->assertStringContainsString('reset-password?token=tok-123', $html);
        $this->assertStringContainsString('Reset Password', $html);
    }

    public function test_reset_url_strips_trailing_slash_from_app_url(): void
    {
        config(['app.url' => 'https://claudenest.io/']);

        $user = new User(['email' => 'user@example.com', 'name' => 'User']);

        $mailMessage = (new ResetPassword('tok'))->toMail($user);

        $this->assertStringStartsWith('https://claudenest.io/reset-password?', $mailMessage->actionUrl);
    }
}
