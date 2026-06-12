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
            'epics' => $project->epics()
                ->withCount(['tasks', 'tasks as completed_tasks_count' => fn ($q) => $q->where('status', 'done')])
                ->ordered()
                ->get()
                ->map(fn (Epic $e) => [
                    'id' => $e->id,
                    'title' => $e->title,
                    'status' => $e->status,
                    'priority' => $e->priority,
                    'tasks_count' => $e->tasks_count,
                    'completed_tasks_count' => $e->completed_tasks_count,
                    'progress_percentage' => $e->tasks_count > 0 ? round(($e->completed_tasks_count / $e->tasks_count) * 100, 1) : 0,
                ])->toArray(),
            'sprints' => $project->sprints()
                ->withCount(['tasks', 'tasks as completed_tasks_count' => fn ($q) => $q->where('status', 'done')])
                ->ordered()
                ->get()
                ->map(fn (Sprint $s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'status' => $s->status,
                    'start_date' => $s->start_date?->format('Y-m-d'),
                    'end_date' => $s->end_date?->format('Y-m-d'),
                    'total_story_points' => $s->tasks()->sum('story_points'),
                    'completed_story_points' => $s->tasks()->where('status', 'done')->sum('story_points'),
                    'progress_percentage' => $s->tasks_count > 0 ? round(($s->completed_tasks_count / $s->tasks_count) * 100, 1) : 0,
                ])->toArray(),
            'tasks' => $project->tasks()
                ->rootTasks()
                ->withCount('children')
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
                    'subtasks_count' => $t->children_count,
                ])->toArray(),
            'stats' => [
                'total_tasks' => $project->tasks()->count(),
                'pending_tasks' => $project->tasks()->pending()->count(),
                'completed_tasks' => $project->tasks()->done()->count(),
                'total_story_points' => $project->tasks()->sum('story_points'),
                'completed_story_points' => $project->tasks()->done()->sum('story_points'),
                'active_sprint' => $project->active_sprint?->name,
                'epics_count' => $project->epics()->count(),
                'average_velocity' => $this->averageVelocity($project),
            ],
        ];
    }

    /**
     * System prompt for an interactive planning agent session: role + MCP
     * toolset + velocity guardrail + compact backlog snapshot. Replaces the
     * default multi-agent worker prompt (claim/code/complete rules).
     */
    public function buildPlannerSystemPrompt(SharedProject $project): string
    {
        $stats = $this->getProjectContext($project)['stats'];

        $velocityLine = $stats['average_velocity'] !== null
            ? "Average velocity (last 3 sprints): {$stats['average_velocity']} points — do not plan a sprint above it."
            : 'Average velocity (last 3 sprints): unknown (no completed sprints yet) — plan the first sprint conservatively.';

        $activeSprint = $stats['active_sprint'] ?? 'none';

        return <<<PROMPT
You are a planning agent for project "{$project->name}". Analyse the brief and the current backlog, then structure the work using the claudenest MCP tools: epic_create, task_create (with story_points, priority, files), task_decompose for subtasks, sprint_assign. {$velocityLine} Ask the human in this terminal when arbitration is needed. Do NOT edit files; planning only.

## Backlog snapshot
- Tasks: {$stats['total_tasks']} total ({$stats['pending_tasks']} pending, {$stats['completed_tasks']} done)
- Story points: {$stats['completed_story_points']}/{$stats['total_story_points']} completed
- Epics: {$stats['epics_count']}
- Active sprint: {$activeSprint}
PROMPT;
    }

    /**
     * Average completed-sprint velocity over the 3 most recent completed
     * sprints (null when no completed sprint carries a velocity yet).
     */
    private function averageVelocity(SharedProject $project): ?float
    {
        $velocities = $project->sprints()
            ->completed()
            ->orderByDesc('created_at')
            ->limit(3)
            ->pluck('velocity')
            ->filter(fn ($velocity) => $velocity !== null);

        return $velocities->isEmpty() ? null : round((float) $velocities->avg(), 1);
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
            'color'       => $data['color'] ?? Epic::DEFAULT_COLOR,
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
        $task->update(collect($data)->only([
            'title', 'description', 'priority', 'status',
            'epic_id', 'sprint_id', 'story_points', 'labels',
            'sort_order', 'due_date',
        ])->toArray());

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
