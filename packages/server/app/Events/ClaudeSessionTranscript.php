<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * A batch of redacted transcript events for a mirrored Claude session,
 * streamed live as the user's session appends to its JSONL transcript.
 */
class ClaudeSessionTranscript implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param array<int, array<string, mixed>> $events
     */
    public function __construct(
        public string $sessionId,
        public array $events,
        public bool $replace = false,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('claude-sessions.' . $this->sessionId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'claude_sessions.transcript';
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->sessionId,
            'events' => $this->events,
            'replace' => $this->replace,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
