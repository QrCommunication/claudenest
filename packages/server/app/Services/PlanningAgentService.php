<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Epic;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Sprint;
use Illuminate\Support\Facades\DB;

class PlanningAgentService
{
    /**
     * Récupère le contexte complet du projet pour l'agent.
     */
    public function getProjectContext(SharedProject $project): array
    {
        return [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'summary' => $project->summary,
                'architecture' => $project->architecture,
            ],
            'epics' => $project->epics()->ordered()->get()->map(fn (Epic $e) => [
                'id' => $e->id,
                'title' => $e->title,
                'status' => $e->status,
                'priority' => $e->priority,
                'tasks_count' => $e->tasks_count,
                'completed_tasks_count' => $e->completed_tasks_count,
                'progress_percentage' => $e->progress_percentage,
            ])->toArray(),
            'sprints' => $project->sprints()->ordered()->get()->map(fn (Sprint $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'status' => $s->status,
                'start_date' => $s->start_date?->format('Y-m-d'),
                'end_date' => $s->end_date?->format('Y-m-d'),
                'total_story_points' => $s->total_story_points,
                'completed_story_points' => $s->completed_story_points,
                'progress_percentage' => $s->progress_percentage,
            ])->toArray(),
            'tasks' => $project->tasks()
                ->rootTasks()
                ->orderBy('sort_order')
                ->limit(50)
                ->get()
                ->map(fn (SharedTask $t) => [
                    'id' => $t->id,
                    'title' => $t->title,
                    'status' => $t->status,
                    'priority' => $t->priority,
                    'epic_id' => $t->epic_id,
                    'sprint_id' => $t->sprint_id,
                    'story_points' => $t->story_points,
                    'subtasks_count' => $t->subtasks_count,
                ])->toArray(),
            'stats' => [
                'total_tasks' => $project->tasks()->count(),
                'completed_tasks' => $project->tasks()->done()->count(),
                'total_story_points' => $project->tasks()->sum('story_points'),
                'completed_story_points' => $project->tasks()->done()->sum('story_points'),
                'active_sprint' => $project->active_sprint?->name,
                'epics_count' => $project->epics()->count(),
            ],
        ];
    }

    /**
     * Exécute une liste d'actions planifiées dans une transaction.
     *
     * @param  array<int, array{type: string, data: array<string, mixed>}>  $actions
     * @return array<int, array{type: string, success: bool, data: array<string, mixed>}>
     */
    public function executeActions(SharedProject $project, array $actions): array
    {
        return DB::transaction(function () use ($project, $actions) {
            $results = [];

            foreach ($actions as $action) {
                $result = match ($action['type']) {
                    'create_epic'      => $this->createEpic($project, $action['data']),
                    'create_task'      => $this->createTask($project, $action['data']),
                    'create_sprint'    => $this->createSprint($project, $action['data']),
                    'update_task'      => $this->updateTask($action['data']),
                    'move_task'        => $this->moveTask($action['data']),
                    'decompose_task'   => $this->decomposeTask($action['data']),
                    'start_sprint'     => $this->startSprint($action['data']),
                    'complete_sprint'  => $this->completeSprint($action['data']),
                    default            => ['error' => 'Unknown action type: ' . $action['type']],
                };

                $results[] = [
                    'type'    => $action['type'],
                    'success' => ! isset($result['error']),
                    'data'    => $result,
                ];
            }

            return $results;
        });
    }

    // ==================== Private action handlers ====================

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function createEpic(SharedProject $project, array $data): array
    {
        $epic = $project->epics()->create([
            'title'       => $data['title'],
            'description' => $data['description'] ?? null,
            'color'       => $data['color'] ?? '#a855f7',
            'priority'    => $data['priority'] ?? 'medium',
            'sort_order'  => $project->epics()->max('sort_order') + 1,
        ]);

        return ['id' => $epic->id, 'title' => $epic->title];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function createTask(SharedProject $project, array $data): array
    {
        $task = $project->tasks()->create([
            'title'        => $data['title'],
            'description'  => $data['description'] ?? null,
            'priority'     => $data['priority'] ?? 'medium',
            'status'       => $data['status'] ?? 'backlog',
            'epic_id'      => $data['epic_id'] ?? null,
            'sprint_id'    => $data['sprint_id'] ?? null,
            'parent_id'    => $data['parent_id'] ?? null,
            'story_points' => $data['story_points'] ?? null,
            'labels'       => $data['labels'] ?? [],
        ]);

        return ['id' => $task->id, 'title' => $task->title];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function createSprint(SharedProject $project, array $data): array
    {
        $sprint = $project->sprints()->create([
            'name'       => $data['name'],
            'goal'       => $data['goal'] ?? null,
            'start_date' => $data['start_date'] ?? null,
            'end_date'   => $data['end_date'] ?? null,
            'capacity'   => $data['capacity'] ?? null,
            'sort_order' => $project->sprints()->max('sort_order') + 1,
        ]);

        return ['id' => $sprint->id, 'name' => $sprint->name];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function updateTask(array $data): array
    {
        $task = SharedTask::findOrFail($data['task_id']);
        $task->update(collect($data)->except('task_id')->toArray());

        return ['id' => $task->id, 'title' => $task->title];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function moveTask(array $data): array
    {
        $task = SharedTask::findOrFail($data['task_id']);
        $updates = collect($data)->only(['epic_id', 'sprint_id', 'status', 'sort_order'])->toArray();
        $task->update($updates);

        return ['id' => $task->id, 'title' => $task->title, 'moved_to' => $updates];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function decomposeTask(array $data): array
    {
        $parentTask = SharedTask::findOrFail($data['task_id']);
        $subtasks = [];

        foreach ($data['subtasks'] as $subtaskData) {
            $subtask = $parentTask->project->tasks()->create([
                'title'        => $subtaskData['title'],
                'description'  => $subtaskData['description'] ?? null,
                'priority'     => $subtaskData['priority'] ?? $parentTask->priority,
                'status'       => 'backlog',
                'parent_id'    => $parentTask->id,
                'epic_id'      => $parentTask->epic_id,
                'sprint_id'    => $parentTask->sprint_id,
                'story_points' => $subtaskData['story_points'] ?? null,
            ]);

            $subtasks[] = ['id' => $subtask->id, 'title' => $subtask->title];
        }

        return ['parent_id' => $parentTask->id, 'subtasks' => $subtasks];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function startSprint(array $data): array
    {
        $sprint = Sprint::findOrFail($data['sprint_id']);
        $sprint->start();

        return ['id' => $sprint->id, 'name' => $sprint->name, 'status' => 'active'];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function completeSprint(array $data): array
    {
        $sprint = Sprint::findOrFail($data['sprint_id']);
        $sprint->complete();

        return ['id' => $sprint->id, 'name' => $sprint->name, 'velocity' => $sprint->velocity];
    }
}
