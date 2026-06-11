<?php

declare(strict_types=1);

namespace Tests\Unit\Mail;

use App\Mail\WelcomeMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Tests\TestCase;

class WelcomeMailTest extends TestCase
{
    public function test_it_renders_with_user_name_dashboard_and_docs_links(): void
    {
        config(['app.url' => 'https://claudenest.io']);

        // Real render (not Mail::fake) — catches missing views, broken
        // markdown components, and undefined variables.
        $html = (new WelcomeMail('Rony'))->render();

        $this->assertStringContainsString('Rony', $html);
        $this->assertStringContainsString('https://claudenest.io/dashboard', $html);
        $this->assertStringContainsString('https://claudenest.io/docs', $html);
    }

    public function test_it_has_the_expected_subject(): void
    {
        $mail = new WelcomeMail('Rony');

        $this->assertSame('Welcome to ClaudeNest', $mail->envelope()->subject);
    }

    public function test_it_is_synchronous_not_queued(): void
    {
        // Auth-path emails must never be queued (project rule —
        // Mailable + queue pitfalls).
        $this->assertNotInstanceOf(ShouldQueue::class, new WelcomeMail('Rony'));
    }

    public function test_it_strips_trailing_slash_from_app_url(): void
    {
        config(['app.url' => 'https://claudenest.io/']);

        $mail = new WelcomeMail('Rony');

        $this->assertSame('https://claudenest.io/dashboard', $mail->dashboardUrl);
        $this->assertSame('https://claudenest.io/docs', $mail->docsUrl);
    }
}
