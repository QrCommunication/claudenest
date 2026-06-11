<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * Welcome email sent when an account is created (password register
 * or first OAuth sign-in).
 *
 * Intentionally SYNCHRONOUS (no ShouldQueue): auth-path emails must not
 * depend on queue health, and SerializesModels on queued mailables is a
 * known footgun (project rule — Mailable + queue pitfalls).
 *
 * Only scalars are passed in (no Eloquent model) so the mailable can be
 * rendered and tested without any database access.
 */
class WelcomeMail extends Mailable
{
    public string $dashboardUrl;

    public string $docsUrl;

    public function __construct(
        public string $userName,
    ) {
        $base = rtrim((string) config('app.url'), '/');

        $this->dashboardUrl = $base . '/dashboard';
        $this->docsUrl = $base . '/docs';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to ClaudeNest',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.welcome',
        );
    }
}
