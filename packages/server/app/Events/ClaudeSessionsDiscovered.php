<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * The agent reported the current set of discovered Claude sessions for a machine.
 */
class ClaudeSessionsDiscovered implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param array<int, array<string, mixed>> $sessions
     */
    public function __construct(
        public string $machineId,
        public array $sessions,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('machines.' . $this->machineId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'claude_sessions.discovered';
    }

    public function broadcastWith(): array
    {
        return [
            'machine_id' => $this->machineId,
            'sessions' => $this->sessions,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
