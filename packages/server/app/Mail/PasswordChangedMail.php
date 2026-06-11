<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * Security notification sent after a password change (authenticated
 * password update AND password reset completion).
 *
 * Anti account-takeover: the legitimate owner must be told when the
 * password changes so a hijack can be detected immediately.
 *
 * Intentionally SYNCHRONOUS (no ShouldQueue): security emails must not
 * depend on queue health (project rule — Mailable + queue pitfalls).
 *
 * Only scalars are passed in (no Eloquent model) so the mailable can be
 * rendered and tested without any database access. The support address is
 * exposed as a view variable to avoid a raw "@" in the Blade template.
 */
class PasswordChangedMail extends Mailable
{
    public const SUPPORT_EMAIL = 'contact@qrcommunication.com';

    public string $supportEmail = self::SUPPORT_EMAIL;

    public function __construct(
        public string $userName,
        public string $changedAt,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your ClaudeNest password was changed',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.password-changed',
        );
    }
}
