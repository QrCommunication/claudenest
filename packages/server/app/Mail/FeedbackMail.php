<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * User feedback email sent to the support inbox.
 *
 * Intentionally SYNCHRONOUS (no ShouldQueue): feedback is rare and must not
 * depend on queue health (project rule — Mailable + queue pitfalls).
 *
 * Note: the subject is held in $feedbackSubject because the parent
 * Mailable class already declares an untyped $subject property — redeclaring
 * it with a type via constructor promotion is a PHP fatal error.
 */
class FeedbackMail extends Mailable
{
    use Queueable;

    public function __construct(
        public string $category,
        public string $feedbackSubject,
        public string $userMessage,
        public string $userName,
        public string $userEmail,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[ClaudeNest Feedback][{$this->category}] {$this->feedbackSubject}",
            replyTo: [new Address($this->userEmail, $this->userName)],
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.feedback',
        );
    }
}
