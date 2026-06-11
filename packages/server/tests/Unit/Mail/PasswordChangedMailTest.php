<?php

declare(strict_types=1);

namespace Tests\Unit\Mail;

use App\Mail\PasswordChangedMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Tests\TestCase;

class PasswordChangedMailTest extends TestCase
{
    public function test_it_renders_with_name_date_and_support_contact(): void
    {
        // Real render (not Mail::fake) — catches missing views, broken
        // markdown components, and undefined variables.
        $html = (new PasswordChangedMail('Rony', 'Wed, Jun 10, 2026 8:00 PM (UTC)'))->render();

        $this->assertStringContainsString('Rony', $html);
        $this->assertStringContainsString('Wed, Jun 10, 2026 8:00 PM (UTC)', $html);
        $this->assertStringContainsString('contact@qrcommunication.com', $html);
        $this->assertStringContainsString('was not you', $html);
    }

    public function test_it_has_the_expected_subject(): void
    {
        $mail = new PasswordChangedMail('Rony', 'now');

        $this->assertSame('Your ClaudeNest password was changed', $mail->envelope()->subject);
    }

    public function test_it_is_synchronous_not_queued(): void
    {
        // Security emails must never be queued (project rule —
        // Mailable + queue pitfalls).
        $this->assertNotInstanceOf(ShouldQueue::class, new PasswordChangedMail('Rony', 'now'));
    }
}
