<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasVersion4Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Epic extends Model
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
        'title',
        'description',
        'color',
        'icon',
        'status',
        'priority',
        'sort_order',
        'started_at',
        'completed_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'sort_order' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
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

    public const STATUSES = ['open', 'in_progress', 'done'];

    public const PRIORITIES = ['low', 'medium', 'high', 'critical'];

    /** Brand primary purple — mirrors the DB column default (NOT NULL). */
    public const DEFAULT_COLOR = '#a855f7';

    // ==================== RELATIONSHIPS ====================

    public function project(): BelongsTo
    {
        return $this->belongsTo(SharedProject::class, 'project_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(SharedTask::class, 'epic_id');
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

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeDone($query)
    {
        return $query->where('status', 'done');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('created_at');
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

    public function getProgressPercentageAttribute(): float
    {
        $total = $this->tasks_count;

        if ($total === 0) {
            return 0.0;
        }

        return round(($this->completed_tasks_count / $total) * 100, 1);
    }

    // ==================== HELPERS ====================

    public function markInProgress(): void
    {
        $this->update([
            'status' => 'in_progress',
            'started_at' => $this->started_at ?? now(),
        ]);
    }

    public function markDone(): void
    {
        $this->update([
            'status' => 'done',
            'started_at' => $this->started_at ?? now(),
            'completed_at' => now(),
        ]);
    }

    public function reorder(int $position): void
    {
        $this->update(['sort_order' => $position]);
    }

    /**
     * Recompute the epic status from the state of its linked tasks and the
     * sprints those tasks belong to, then persist it if it changed.
     *
     * Rules:
     *  - `done`        : there is at least one task, ALL linked tasks are `done`,
     *                    AND every sprint referenced by those tasks is
     *                    `completed`/`cancelled` (an epic with no sprints
     *                    satisfies this vacuously). Stamps `completed_at`.
     *  - `in_progress` : work has started (any task beyond `backlog`/`pending`)
     *                    but the `done` condition is not yet met. Stamps
     *                    `started_at`, clears `completed_at`.
     *  - `open`        : no tasks, or no task has started. Clears both stamps.
     *
     * @return bool true when the persisted status (or its timestamps) changed,
     *              so callers can conditionally broadcast an EpicUpdated event.
     */
    public function recomputeStatus(): bool
    {
        $totalTasks = $this->tasks()->count();

        // No work attached yet → the epic is back to (or stays) open.
        if ($totalTasks === 0) {
            return $this->applyStatus('open');
        }

        $doneTasks = $this->tasks()->where('status', 'done')->count();
        $allTasksDone = $doneTasks === $totalTasks;

        // Sprints "associated" with this epic are the distinct sprints referenced
        // by its tasks (there is no direct epic→sprint FK). An epic whose tasks
        // carry no sprint_id has no open sprint, satisfying the rule vacuously.
        $sprintIds = $this->tasks()
            ->whereNotNull('sprint_id')
            ->distinct()
            ->pluck('sprint_id');

        $hasOpenSprint = $sprintIds->isNotEmpty()
            && Sprint::whereIn('id', $sprintIds)
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->exists();

        if ($allTasksDone && ! $hasOpenSprint) {
            return $this->applyStatus('done');
        }

        // Any task past the not-started states means the epic is underway.
        $hasStartedWork = $this->tasks()
            ->whereNotIn('status', ['backlog', 'pending'])
            ->exists();

        return $this->applyStatus($hasStartedWork ? 'in_progress' : 'open');
    }

    /**
     * Apply a recomputed status with its associated timestamp side effects,
     * persisting (and returning true) only when something actually changes so
     * no spurious update/event is emitted on a no-op recompute.
     */
    private function applyStatus(string $status): bool
    {
        $attributes = ['status' => $status];

        if ($status === 'done') {
            $attributes['started_at'] = $this->started_at ?? now();
            $attributes['completed_at'] = $this->completed_at ?? now();
        } elseif ($status === 'in_progress') {
            $attributes['started_at'] = $this->started_at ?? now();
            $attributes['completed_at'] = null;
        } else { // open
            $attributes['started_at'] = null;
            $attributes['completed_at'] = null;
        }

        $this->fill($attributes);

        if (! $this->isDirty()) {
            return false;
        }

        $this->save();

        return true;
    }
}
