<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Epic;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EpicUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Epic $epic;

    public string $action;

    /**
     * Create a new event instance.
     */
    public function __construct(Epic $epic, string $action = 'updated')
    {
        $this->epic = $epic;
        $this->action = $action;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('projects.'.$this->epic->project_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'epic.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'epic_id' => $this->epic->id,
            'action' => $this->action,
            'title' => $this->epic->title,
            'status' => $this->epic->status,
            'progress_percentage' => $this->epic->progress_percentage,
            // PR lifecycle markers so the board reflects the merged/shipped state
            // in real time (e.g. hides the Generate-PR button on pr_done) without
            // waiting on the finalized refetch. pr_url/pr_number still arrive via
            // that refetch.
            'pr_state' => $this->epic->pr_state,
            'pr_done' => (bool) $this->epic->pr_done,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
