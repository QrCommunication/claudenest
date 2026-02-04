<?php

namespace App\Events;

use App\Models\SharedTask;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskClaimed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public SharedTask $task;

    /**
     * Create a new event instance.
     */
    public function __construct(SharedTask $task)
    {
        $this->task = $task;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('projects.' . $this->task->project_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'task.claimed';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'task_id' => $this->task->id,
            'project_id' => $this->task->project_id,
            'title' => $this->task->title,
            'assigned_to' => $this->task->assigned_to,
            'claimed_at' => $this->task->claimed_at?->toIso8601String(),
        ];
    }
}
