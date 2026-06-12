<?php

namespace App\Events;

use App\Models\Session;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SessionNotification implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Session $session;

    public string $message;

    public ?string $title;

    public string $notificationType;

    /**
     * Create a new event instance.
     */
    public function __construct(
        Session $session,
        string $message,
        ?string $title = null,
        string $notificationType = 'info'
    ) {
        $this->session = $session;
        $this->message = $message;
        $this->title = $title;
        $this->notificationType = $notificationType;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('sessions.' . $this->session->id),
        ];

        if ($this->session->shared_project_id) {
            $channels[] = new PrivateChannel('projects.' . $this->session->shared_project_id);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'session.notification';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->session->id,
            'shared_project_id' => $this->session->shared_project_id,
            'machine_id' => $this->session->machine_id,
            'title' => $this->title,
            'message' => $this->message,
            'notification_type' => $this->notificationType,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
