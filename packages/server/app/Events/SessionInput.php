<?php

namespace App\Events;

use App\Models\Session;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SessionInput implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Session $session;
    public string $data;

    /**
     * Create a new event instance.
     */
    public function __construct(Session $session, string $data)
    {
        $this->session = $session;
        $this->data = $data;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('machines.' . $this->session->machine_id),
            new PrivateChannel('sessions.' . $this->session->id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'session.input';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->session->id,
            'data' => $this->data,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
