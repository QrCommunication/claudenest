<?php

namespace App\Events;

use App\Models\SharedProject;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectBroadcast implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public SharedProject $project;
    public array $message;
    public ?array $targetInstances;

    /**
     * Create a new event instance.
     */
    public function __construct(SharedProject $project, array $message, ?array $targetInstances = null)
    {
        $this->project = $project;
        $this->message = $message;
        $this->targetInstances = $targetInstances;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('projects.' . $this->project->id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'project.broadcast';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'project_id' => $this->project->id,
            'message' => $this->message,
            'target_instances' => $this->targetInstances,
            'broadcast_at' => now()->toIso8601String(),
        ];
    }
}
