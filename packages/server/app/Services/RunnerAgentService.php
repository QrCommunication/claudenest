<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Epic;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Sprint;

class RunnerAgentService
{
    /**
     * Exécute un check complet sur un projet et retourne un rapport de santé.
     */
    public function healthCheck(SharedProject $project): array
    {
        return [
            'project_id' => $project->id,
            'checked_at' => now()->toIso8601String(),
            'tasks' => $this->checkTasks($project),
            'sprints' => $this->checkSprints($project),
            'epics' => $this->checkEpics($project),
            'alerts' => $this->detectAlerts($project),
            'recommendations' => $this->generateRecommendations($project),
        ];
    }

    /**
     * Met à jour automatiquement les statuts basé sur l'état réel.
     *
     * @return array<int, array<string, mixed>>
     */
    public function autoUpdateStatuses(SharedProject $project): array
    {
        $updates = [];

        // 1. Epics : marquer "done" si toutes les tâches sont terminées
        $project->epics()
            ->withCount(['tasks', 'tasks as completed_tasks_count' => fn ($q) => $q->where('status', 'done')])
            ->where('status', '!=', 'done')
            ->each(function (Epic $epic) use (&$updates): void {
                if ($epic->tasks_count > 0 && $epic->tasks_count === $epic->completed_tasks_count) {
                    $epic->markDone();
                    $updates[] = ['type' => 'epic_completed', 'id' => $epic->id, 'title' => $epic->title];
                } elseif ($epic->status === 'open' && $epic->completed_tasks_count > 0) {
                    $epic->markInProgress();
                    $updates[] = ['type' => 'epic_started', 'id' => $epic->id, 'title' => $epic->title];
                }
            });

        // 2. Tâches parentes : mettre à jour selon les subtasks
        SharedTask::forProject($project->id)
            ->whereHas('children')
            ->where('status', '!=', 'done')
            ->each(function (SharedTask $task) use (&$updates): void {
                $childrenCount = $task->children()->count();
                $completedChildren = $task->children()->done()->count();

                if ($childrenCount > 0 && $childrenCount === $completedChildren && $task->status !== 'done') {
                    $task->update(['status' => 'review']);
                    $updates[] = ['type' => 'task_ready_for_review', 'id' => $task->id, 'title' => $task->title];
                } elseif ($completedChildren > 0 && $task->status === 'pending') {
                    $task->update(['status' => 'in_progress']);
                    $updates[] = ['type' => 'task_auto_started', 'id' => $task->id, 'title' => $task->title];
                }
            });

        // 3. Sprints overdue : alerter si end_date passée
        $project->sprints()->active()->each(function (Sprint $sprint) use (&$updates): void {
            if ($sprint->is_overdue) {
                $updates[] = [
                    'type' => 'sprint_overdue',
                    'id' => $sprint->id,
                    'name' => $sprint->name,
                    'days_over' => abs((int) $sprint->remaining_days),
                ];
            }
        });

        // 4. Tâches stalled : in_progress depuis plus de 24h sans activité
        SharedTask::forProject($project->id)
            ->inProgress()
            ->where('claimed_at', '<', now()->subHours(24))
            ->each(function (SharedTask $task) use (&$updates): void {
                $updates[] = [
                    'type' => 'task_stalled',
                    'id' => $task->id,
                    'title' => $task->title,
                    'stalled_hours' => $task->claimed_at->diffInHours(now()),
                ];
            });

        return $updates;
    }

    /**
     * Récupère les métriques de progression du projet.
     *
     * @return array<string, mixed>
     */
    public function getProgressMetrics(SharedProject $project): array
    {
        // Consolidate all status-based counts and points into a single query
        $statusCounts = $project->tasks()
            ->selectRaw('status, count(*) as count, coalesce(sum(story_points), 0) as points')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $totalTasks = $statusCounts->sum('count');
        $totalPoints = $statusCounts->sum('points');
        $completedTasks = $statusCounts->get('done')?->count ?? 0;
        $completedPoints = $statusCounts->get('done')?->points ?? 0;

        $activeSprint = $project->active_sprint;

        return [
            'overall' => [
                'tasks_total' => $totalTasks,
                'tasks_completed' => $completedTasks,
                'tasks_progress' => $totalTasks > 0
                    ? round(($completedTasks / $totalTasks) * 100, 1)
                    : 0,
                'points_total' => $totalPoints,
                'points_completed' => $completedPoints,
                'points_progress' => $totalPoints > 0
                    ? round(($completedPoints / $totalPoints) * 100, 1)
                    : 0,
            ],
            'sprint' => $activeSprint ? [
                'id' => $activeSprint->id,
                'name' => $activeSprint->name,
                'progress' => $activeSprint->progress_percentage,
                'remaining_days' => $activeSprint->remaining_days,
                'velocity' => $activeSprint->velocity,
                'burndown' => $activeSprint->getBurndownData(),
            ] : null,
            'velocity_history' => $project->sprints()
                ->completed()
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(fn (Sprint $s): array => [
                    'sprint' => $s->name,
                    'velocity' => $s->velocity,
                    'capacity' => $s->capacity,
                ])->toArray(),
            'by_status' => [
                'backlog' => $statusCounts->get('backlog')?->count ?? 0,
                'pending' => $statusCounts->get('pending')?->count ?? 0,
                'in_progress' => $statusCounts->get('in_progress')?->count ?? 0,
                'blocked' => $statusCounts->get('blocked')?->count ?? 0,
                'review' => $statusCounts->get('review')?->count ?? 0,
                'done' => $completedTasks,
            ],
        ];
    }

    // ==================== Private helpers ====================

    /**
     * @return array<string, int>
     */
    private function checkTasks(SharedProject $project): array
    {
        return [
            'total' => $project->tasks()->count(),
            'completed' => $project->tasks()->done()->count(),
            'blocked' => $project->tasks()->byStatus('blocked')->count(),
            'overdue' => $project->tasks()
                ->whereNotNull('due_date')
                ->where('due_date', '<', now())
                ->where('status', '!=', 'done')
                ->count(),
            'unestimated' => $project->tasks()
                ->whereNull('story_points')
                ->where('status', '!=', 'done')
                ->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function checkSprints(SharedProject $project): array
    {
        $active = $project->sprints()->active()->first();

        return [
            'active' => $active ? [
                'id' => $active->id,
                'name' => $active->name,
                'progress' => $active->progress_percentage,
                'remaining_days' => $active->remaining_days,
                'is_overdue' => $active->is_overdue,
            ] : null,
            'planning_count' => $project->sprints()->planning()->count(),
            'completed_count' => $project->sprints()->completed()->count(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function checkEpics(SharedProject $project): array
    {
        return $project->epics()->ordered()->get()
            ->map(fn (Epic $e): array => [
                'id' => $e->id,
                'title' => $e->title,
                'status' => $e->status,
                'progress' => $e->progress_percentage,
            ])->toArray();
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function detectAlerts(SharedProject $project): array
    {
        $alerts = [];

        $blockedCount = $project->tasks()->byStatus('blocked')->count();
        if ($blockedCount > 0) {
            $alerts[] = [
                'level' => 'warning',
                'message' => "{$blockedCount} task(s) blocked",
                'type' => 'blocked_tasks',
            ];
        }

        $overdueSprint = $project->sprints()->active()->get()->first(fn (Sprint $s): bool => $s->is_overdue);
        if ($overdueSprint) {
            $alerts[] = [
                'level' => 'critical',
                'message' => "Sprint '{$overdueSprint->name}' is overdue",
                'type' => 'sprint_overdue',
            ];
        }

        $overdueTasksCount = $project->tasks()
            ->whereNotNull('due_date')
            ->where('due_date', '<', now())
            ->where('status', '!=', 'done')
            ->count();

        if ($overdueTasksCount > 0) {
            $alerts[] = [
                'level' => 'warning',
                'message' => "{$overdueTasksCount} task(s) past due date",
                'type' => 'overdue_tasks',
            ];
        }

        return $alerts;
    }

    /**
     * @return array<int, string>
     */
    private function generateRecommendations(SharedProject $project): array
    {
        $recs = [];

        $unestimated = $project->tasks()->whereNull('story_points')->where('status', '!=', 'done')->count();
        $total = $project->tasks()->where('status', '!=', 'done')->count();

        if ($total > 0 && ($unestimated / $total) > 0.5) {
            $recs[] = "Estimate story points for {$unestimated} unestimated tasks to improve sprint planning accuracy.";
        }

        $pendingCount = $project->tasks()->pending()->count();
        if (!$project->active_sprint && $pendingCount > 5) {
            $recs[] = "Consider creating a sprint to organize the {$pendingCount} pending tasks.";
        }

        $noEpic = $project->tasks()->whereNull('epic_id')->where('status', '!=', 'done')->count();
        if ($noEpic > 10) {
            $recs[] = "Group {$noEpic} tasks without epics into logical feature groups for better tracking.";
        }

        return $recs;
    }
}
