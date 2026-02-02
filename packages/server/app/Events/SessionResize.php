<?php

namespace App\Events;

use App\Models\Session;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SessionResize implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Session $session;
    public int $cols;
    public int $rows;

    /**
     * Create a new event instance.
     */
    public function __construct(Session $session, int $cols, int $rows)
    {
        $this->session = $session;
        $this->cols = $cols;
        $this->rows = $rows;
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
        return 'session.resize';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->session->id,
            'cols' => $this->cols,
            'rows' => $this->rows,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
