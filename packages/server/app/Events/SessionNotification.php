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
     * Optional i18n keys + params. When present, an i18n-aware client (the Vue
     * dashboard) translates these against the user's locale; $message/$title
     * stay as English fallbacks for non-i18n clients (mobile, logs).
     *
     * @var array<string, mixed>
     */
    public array $params;

    public ?string $titleKey;

    public ?string $messageKey;

    /**
     * Create a new event instance.
     *
     * @param  array<string, mixed>  $params  named interpolation params for the i18n keys
     */
    public function __construct(
        Session $session,
        string $message,
        ?string $title = null,
        string $notificationType = 'info',
        ?string $titleKey = null,
        ?string $messageKey = null,
        array $params = [],
    ) {
        $this->session = $session;
        $this->message = $message;
        $this->title = $title;
        $this->notificationType = $notificationType;
        $this->titleKey = $titleKey;
        $this->messageKey = $messageKey;
        $this->params = $params;
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
            'title_key' => $this->titleKey,
            'message_key' => $this->messageKey,
            'params' => (object) $this->params,
            'notification_type' => $this->notificationType,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
