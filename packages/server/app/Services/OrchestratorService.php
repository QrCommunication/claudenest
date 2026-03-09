<?php

namespace App\Services;

use App\Events\TaskClaimed;
use App\Models\ClaudeInstance;
use App\Models\SharedProject;
use App\Models\SharedTask;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrchestratorService
{
    public function __construct(
        private ContextRAGService $ragService,
    ) {}

    /**
     * Select the best available instance for a task.
     * Prefers idle instances with lowest context usage.
     */
    public function selectBestInstance(string $projectId): ?ClaudeInstance
    {
        return ClaudeInstance::getAvailableForProject($projectId);
    }

    /**
     * Dispatch a task to the best available instance.
     * Returns the instance that was assigned, or null if none available.
     */
    public function dispatchTask(SharedTask $task): ?ClaudeInstance
    {
        $instance = $this->selectBestInstance($task->project_id);

        if (!$instance) {
            Log::debug('No available instance for task dispatch', [
                'task_id' => $task->id,
                'project_id' => $task->project_id,
            ]);
            return null;
        }

        return DB::transaction(function () use ($task, $instance) {
            // Atomic claim
            $claimed = SharedTask::where('id', $task->id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->first();

            if (!$claimed) {
                return null; // Already claimed by another instance
            }

            $claimed->update([
                'status' => 'in_progress',
                'assigned_to' => $instance->id,
                'claimed_at' => now(),
            ]);

            $instance->markAsBusy($claimed->id);

            event(new TaskClaimed($claimed));

            Log::info('Task dispatched to instance', [
                'task_id' => $claimed->id,
                'instance_id' => $instance->id,
                'project_id' => $claimed->project_id,
            ]);

            return $instance;
        });
    }

    /**
     * Auto-dispatch pending tasks to available instances.
     * Called periodically or when new tasks/instances appear.
     */
    public function autoDispatch(string $projectId): array
    {
        $dispatched = [];

        $pendingTasks = SharedTask::where('project_id', $projectId)
            ->where('status', 'pending')
            ->whereNull('assigned_to')
            ->orderByRaw("CASE priority
                WHEN 'critical' THEN 0
                WHEN 'high' THEN 1
                WHEN 'medium' THEN 2
                WHEN 'low' THEN 3
                ELSE 4 END")
            ->orderBy('created_at')
            ->get();

        foreach ($pendingTasks as $task) {
            // Check dependencies
            if (!$this->areDependenciesMet($task)) {
                continue;
            }

            $instance = $this->dispatchTask($task);
            if ($instance) {
                $dispatched[] = [
                    'task_id' => $task->id,
                    'instance_id' => $instance->id,
                ];
            } else {
                break; // No more instances available
            }
        }

        return $dispatched;
    }

    /**
     * Handle instance disconnect: release tasks and update status.
     */
    public function handleInstanceDisconnect(string $instanceId): void
    {
        $instance = ClaudeInstance::find($instanceId);
        if (!$instance) return;

        $instance->markAsDisconnected();

        Log::info('Instance disconnected, tasks released', [
            'instance_id' => $instanceId,
        ]);
    }

    /**
     * Register a new instance for a project.
     */
    public function registerInstance(
        string $instanceId,
        string $projectId,
        string $machineId,
        ?string $sessionId = null,
    ): ClaudeInstance {
        return ClaudeInstance::updateOrCreate(
            ['id' => $instanceId],
            [
                'project_id' => $projectId,
                'machine_id' => $machineId,
                'session_id' => $sessionId,
                'status' => 'idle',
                'context_tokens' => 0,
                'max_context_tokens' => 200_000,
                'tasks_completed' => 0,
                'connected_at' => now(),
                'last_activity_at' => now(),
                'disconnected_at' => null,
            ],
        );
    }

    /**
     * Get orchestration stats for a project.
     */
    public function getProjectStats(string $projectId): array
    {
        $instances = ClaudeInstance::forProject($projectId)->connected()->get();
        $tasks = SharedTask::where('project_id', $projectId);

        return [
            'instances' => [
                'total' => $instances->count(),
                'idle' => $instances->where('status', 'idle')->count(),
                'busy' => $instances->where('status', 'busy')->count(),
                'active' => $instances->where('status', 'active')->count(),
            ],
            'tasks' => [
                'pending' => (clone $tasks)->where('status', 'pending')->count(),
                'in_progress' => (clone $tasks)->where('status', 'in_progress')->count(),
                'completed' => (clone $tasks)->where('status', 'done')->count(),
                'blocked' => (clone $tasks)->where('status', 'blocked')->count(),
            ],
            'total_tasks_completed' => $instances->sum('tasks_completed'),
        ];
    }

    private function areDependenciesMet(SharedTask $task): bool
    {
        $deps = $task->dependencies ?? [];
        if (empty($deps)) return true;

        $completedCount = SharedTask::whereIn('id', $deps)
            ->where('status', 'done')
            ->count();

        return $completedCount === count($deps);
    }
}
