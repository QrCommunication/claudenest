<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * Synchronous (non-queued) transactional mail for MFA codes.
 * Uses its own view at resources/views/emails/mfa-code.blade.php
 * to avoid conflicts with other agents working on app/Mail/*.
 */
final class MfaCodeMail extends Mailable
{
    public function __construct(
        public readonly string $code,
        public readonly int $validMinutes = 10,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your ClaudeNest verification code',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.mfa-code',
        );
    }
}
