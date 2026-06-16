<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasVersion4Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Sprint extends Model
{
    use HasFactory, HasVersion4Uuids;

    /**
     * The primary key type.
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     */
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'name',
        'goal',
        'status',
        'start_date',
        'end_date',
        'velocity',
        'capacity',
        'sort_order',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'velocity' => 'integer',
        'capacity' => 'integer',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::orderedUuid();
            }
        });
    }

    // ==================== CONSTANTS ====================

    public const STATUSES = ['planning', 'active', 'completed', 'cancelled'];

    // ==================== RELATIONSHIPS ====================

    public function project(): BelongsTo
    {
        return $this->belongsTo(SharedProject::class, 'project_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(SharedTask::class, 'sprint_id');
    }

    // ==================== SCOPES ====================

    public function scopeForProject($query, string $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePlanning($query)
    {
        return $query->where('status', 'planning');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('created_at');
    }

    /**
     * Hide sprints that belong to an archived epic.
     *
     * There is no direct sprint→epic FK: a sprint "belongs" to an epic through
     * its tasks (decomposition creates one sprint per wave, all its tasks sharing
     * the wave's epic_id). A sprint is therefore considered archived-epic-only
     * when it has tasks AND every task sits under an archived epic — i.e. it has
     * NO "keeping" task: a backlog task (NULL epic_id) or a task under a
     * non-archived epic. Empty sprints, project-bootstrap sprints (epic-less
     * tasks) and mixed sprints all stay visible — only fully-archived-epic
     * sprints are dropped.
     */
    public function scopeExcludingArchivedEpics($query)
    {
        return $query->where(function ($outer) {
            $outer
                // No tasks at all → nothing ties it to an archived epic.
                ->whereDoesntHave('tasks')
                // ...or at least one task that keeps the sprint visible.
                ->orWhereHas('tasks', function ($task) {
                    $task->where(function ($keeping) {
                        $keeping
                            ->whereNull('epic_id')
                            ->orWhereHas('epic', function ($epic) {
                                $epic->whereNull('archived_at');
                            });
                    });
                });
        });
    }

    // ==================== ACCESSORS ====================

    public function getTasksCountAttribute(): int
    {
        return $this->tasks()->count();
    }

    public function getCompletedTasksCountAttribute(): int
    {
        return $this->tasks()->where('status', 'done')->count();
    }

    public function getTotalStoryPointsAttribute(): int
    {
        return (int) $this->tasks()->sum('story_points');
    }

    public function getCompletedStoryPointsAttribute(): int
    {
        return (int) $this->tasks()->where('status', 'done')->sum('story_points');
    }

    public function getProgressPercentageAttribute(): float
    {
        $total = $this->tasks_count;

        if ($total === 0) {
            return 0.0;
        }

        return round(($this->completed_tasks_count / $total) * 100, 1);
    }

    public function getRemainingDaysAttribute(): ?int
    {
        if (! $this->end_date) {
            return null;
        }

        $remaining = now()->startOfDay()->diffInDays($this->end_date, false);

        return (int) $remaining;
    }

    public function getIsOverdueAttribute(): bool
    {
        if (! $this->end_date) {
            return false;
        }

        return $this->status !== 'completed'
            && $this->status !== 'cancelled'
            && $this->end_date->isPast();
    }

    // ==================== HELPERS ====================

    public function start(): void
    {
        $this->update([
            'status' => 'active',
            'start_date' => $this->start_date ?? now()->toDateString(),
        ]);
    }

    public function complete(): void
    {
        $this->update([
            'status' => 'completed',
            'end_date' => $this->end_date ?? now()->toDateString(),
        ]);
    }

    public function cancel(): void
    {
        $this->update(['status' => 'cancelled']);
    }

    /**
     * Recompute the sprint status from the live state of its tasks, then persist
     * it if it changed. Mirrors {@see Epic::recomputeStatus()} so the whole
     * task → sprint → epic chain is self-healing and idempotent.
     *
     * Rules:
     *  - `completed` : there is at least one task and ALL of them are `done`.
     *                  Stamps `start_date`/`end_date` if missing.
     *  - `active`    : work has started (any task beyond `backlog`/`pending`)
     *                  but not every task is done yet. Stamps `start_date`,
     *                  clears `end_date`.
     *  - `planning`  : tasks exist but none has started.
     *
     * `cancelled` is a terminal, operator-owned decision and is never revived.
     * A sprint with no tasks is left untouched — there is nothing to infer, and
     * its status stays whatever the operator set.
     *
     * @return bool true when the persisted status (or its dates) changed, so
     *              callers can conditionally broadcast a SprintUpdated event.
     */
    public function recomputeStatus(): bool
    {
        // Cancelled is terminal — never auto-revive a deliberately killed sprint.
        if ($this->status === 'cancelled') {
            return false;
        }

        $totalTasks = $this->tasks()->count();

        // No tasks attached → nothing to infer; leave the operator-set status.
        if ($totalTasks === 0) {
            return false;
        }

        $doneTasks = $this->tasks()->where('status', 'done')->count();

        if ($doneTasks === $totalTasks) {
            return $this->applyStatus('completed');
        }

        // Any task past the not-started states means the sprint is underway.
        $hasStartedWork = $this->tasks()
            ->whereNotIn('status', ['backlog', 'pending'])
            ->exists();

        return $this->applyStatus($hasStartedWork ? 'active' : 'planning');
    }

    /**
     * Apply a recomputed status with its associated date side effects,
     * persisting (and returning true) only when something actually changes so
     * no spurious update/event is emitted on a no-op recompute.
     */
    private function applyStatus(string $status): bool
    {
        $attributes = ['status' => $status];

        if ($status === 'completed') {
            $attributes['start_date'] = $this->start_date ?? now()->toDateString();
            $attributes['end_date'] = $this->end_date ?? now()->toDateString();
        } elseif ($status === 'active') {
            $attributes['start_date'] = $this->start_date ?? now()->toDateString();
            $attributes['end_date'] = null;
        }
        // `planning` is the resting state: leave dates as the operator left them.

        $this->fill($attributes);

        if (! $this->isDirty()) {
            return false;
        }

        $this->save();

        return true;
    }

    /**
     * Generate burndown chart data for this sprint.
     *
     * Returns daily snapshots of remaining vs completed story points
     * between start_date and end_date (or today).
     *
     * @return array<int, array{date: string, remaining: int, completed: int, ideal: float}>
     */
    public function getBurndownData(): array
    {
        if (! $this->start_date) {
            return [];
        }

        $totalPoints = $this->total_story_points;
        $startDate = $this->start_date->copy();
        $endDate = $this->end_date ?? now()->toDate();

        if ($startDate->greaterThan($endDate)) {
            return [];
        }

        // Carbon 3 diffInDays() returns float; cast to int for day-count arithmetic.
        $daysTotal = (int) $startDate->diffInDays($endDate) + 1;
        $dailyIdeal = $daysTotal > 1 ? $totalPoints / ($daysTotal - 1) : $totalPoints;

        $tasks = $this->tasks()
            ->select(['status', 'completed_at', 'estimated_tokens'])
            ->get();

        $data = [];
        $current = $startDate->copy();
        $day = 0;

        while (! $current->greaterThan($endDate)) {
            $completedPoints = $tasks
                ->filter(fn ($t) => $t->completed_at && $t->completed_at->lte($current))
                ->sum('estimated_tokens');

            $data[] = [
                'date' => $current->toDateString(),
                'remaining' => max(0, $totalPoints - (int) $completedPoints),
                'completed' => (int) $completedPoints,
                'ideal' => round(max(0, $totalPoints - ($dailyIdeal * $day)), 1),
            ];

            $current->addDay();
            $day++;
        }

        return $data;
    }
}
