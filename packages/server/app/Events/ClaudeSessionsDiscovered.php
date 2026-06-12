<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * The agent reported the current set of discovered Claude sessions for a
 * machine.
 *
 * Deliberately a slim signal (machine_id + count): the full session list
 * exceeded Reverb's payload limit (~10KB) and produced "Pusher error:
 * Payload too large" failed jobs. Clients refetch the normalized list via
 * GET /api/machines/{machine}/claude-sessions when this event fires.
 */
class ClaudeSessionsDiscovered implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $machineId,
        public int $count,
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
            'count' => $this->count,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
