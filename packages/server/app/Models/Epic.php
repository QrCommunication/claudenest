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
        'decomposition_status',
        'decomposition_session_id',
        'decomposition_error',
        'decomposition_started_at',
        'decomposition_completed_at',
        'decomposed_at',
        'archived_at',
        'pr_url',
        'pr_number',
        'pr_state',
        'pr_branch',
        'finalized_at',
        'pr_done',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'sort_order' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        // Canonical "plan applied" timestamp (migration + EpicResource contract).
        // Required so EpicResource's `decomposed_at?->toIso8601String()` works once
        // submitFromAgent stamps it on the linked epic's `ready` state.
        'decomposed_at' => 'datetime',
        'decomposition_started_at' => 'datetime',
        'decomposition_completed_at' => 'datetime',
        'archived_at' => 'datetime',
        // Epic-level pull request tracking (see add_pr_fields_to_epics migration).
        'pr_number' => 'integer',
        // Terminal "this epic's PR is merged/shipped" marker (see
        // add_pr_done_to_epics migration). Drives the board's Generate-PR
        // visibility and the merge-intent backfill via scopePreviousSiblings().
        'pr_done' => 'boolean',
        'finalized_at' => 'datetime',
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

    /** Pull request states (null = no PR opened yet). Mirrors the DB CHECK. */
    public const PR_STATE_OPEN = 'open';

    public const PR_STATE_MERGED = 'merged';

    public const PR_STATE_CLOSED = 'closed';

    public const PR_STATES = [
        self::PR_STATE_OPEN,
        self::PR_STATE_MERGED,
        self::PR_STATE_CLOSED,
    ];

    /**
     * Decomposition lifecycle of an epic created from a PRD.
     *
     *  - `idle`      : default — the epic was created manually, never decomposed.
     *  - `pending`   : the epic was created from a PRD; the decomposition session
     *                  has not been launched yet (controller "create immediately").
     *  - `running`   : a decomposition session is attached and producing the plan.
     *  - `completed` : the master plan was submitted and auto-applied to the epic.
     *  - `failed`    : the decomposition session errored; `decomposition_error`
     *                  carries the reason.
     */
    public const DECOMPOSITION_IDLE = 'idle';

    public const DECOMPOSITION_PENDING = 'pending';

    public const DECOMPOSITION_RUNNING = 'running';

    public const DECOMPOSITION_COMPLETED = 'completed';

    public const DECOMPOSITION_FAILED = 'failed';

    public const DECOMPOSITION_STATUSES = [
        self::DECOMPOSITION_IDLE,
        self::DECOMPOSITION_PENDING,
        self::DECOMPOSITION_RUNNING,
        self::DECOMPOSITION_COMPLETED,
        self::DECOMPOSITION_FAILED,
    ];

    /** States where a decomposition is in flight (not terminal, not idle). */
    public const DECOMPOSITION_ACTIVE_STATUSES = [
        self::DECOMPOSITION_PENDING,
        self::DECOMPOSITION_RUNNING,
    ];

    // ==================== RELATIONSHIPS ====================

    public function project(): BelongsTo
    {
        return $this->belongsTo(SharedProject::class, 'project_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(SharedTask::class, 'epic_id');
    }

    /**
     * The ephemeral interactive session that is (or was) decomposing this epic's
     * PRD into a master plan. Nullable — cleared once the session is torn down.
     */
    public function decompositionSession(): BelongsTo
    {
        return $this->belongsTo(Session::class, 'decomposition_session_id');
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

    /** Epics whose decomposition is currently in flight (pending or running). */
    public function scopeDecomposing($query)
    {
        return $query->whereIn('decomposition_status', self::DECOMPOSITION_ACTIVE_STATUSES);
    }

    /** Non-archived epics — the default-visible set (mirrors SharedProject). */
    public function scopeActive($query)
    {
        return $query->whereNull('archived_at');
    }

    /** Archived epics only. */
    public function scopeArchived($query)
    {
        return $query->whereNotNull('archived_at');
    }

    /**
     * Epics of the same project ordered strictly BEFORE the given epic. The
     * ordering mirrors {@see scopeOrdered} — the (sort_order, created_at) tuple —
     * so "previous" matches the board's visual order. The reference epic itself
     * is excluded.
     *
     * Used by the epic-merge intent (EpicFinalizeService) to reconcile earlier
     * siblings when a later epic's PR is merged; callers filter on `pr_done` to
     * skip already-shipped epics.
     */
    public function scopePreviousSiblings($query, Epic $epic)
    {
        return $query
            ->where('project_id', $epic->project_id)
            ->whereKeyNot($epic->getKey())
            ->where(function ($q) use ($epic) {
                $q->where('sort_order', '<', $epic->sort_order)
                    ->orWhere(function ($q2) use ($epic) {
                        $q2->where('sort_order', $epic->sort_order)
                            ->where('created_at', '<', $epic->created_at);
                    });
            });
    }

    // ==================== ACCESSORS ====================

    public function getTasksCountAttribute(): int
    {
        return $this->tasks()->count();
    }

    public function getIsArchivedAttribute(): bool
    {
        return $this->archived_at !== null;
    }

    /** Whether a pull request has been opened for this epic. */
    public function getHasPullRequestAttribute(): bool
    {
        return ! empty($this->pr_url);
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

    /** Archive this epic (hidden from active lists; its tasks/sprints follow). */
    public function archive(): void
    {
        $this->update(['archived_at' => now()]);
    }

    /** Restore an archived epic to the active set. */
    public function unarchive(): void
    {
        $this->update(['archived_at' => null]);
    }

    // ==================== DECOMPOSITION HELPERS ====================

    /** Is a decomposition currently in flight (pending or running)? */
    public function isDecomposing(): bool
    {
        return in_array($this->decomposition_status, self::DECOMPOSITION_ACTIVE_STATUSES, true);
    }

    /** Did the last decomposition attempt fail? */
    public function decompositionFailed(): bool
    {
        return $this->decomposition_status === self::DECOMPOSITION_FAILED;
    }

    /** Was the epic successfully decomposed (plan applied)? */
    public function decompositionCompleted(): bool
    {
        return $this->decomposition_status === self::DECOMPOSITION_COMPLETED;
    }

    /**
     * Mark the epic as awaiting decomposition (created from a PRD, session not
     * launched yet). Stamps the start, clears any prior session/error/outcome.
     */
    public function markDecompositionPending(): void
    {
        $this->update([
            'decomposition_status' => self::DECOMPOSITION_PENDING,
            'decomposition_session_id' => null,
            'decomposition_error' => null,
            'decomposition_started_at' => $this->decomposition_started_at ?? now(),
            'decomposition_completed_at' => null,
        ]);
    }

    /**
     * Attach the decomposition session and mark it running. Preserves the
     * original start stamp and clears any prior error.
     */
    public function markDecompositionRunning(?string $sessionId = null): void
    {
        $this->update([
            'decomposition_status' => self::DECOMPOSITION_RUNNING,
            'decomposition_session_id' => $sessionId,
            'decomposition_error' => null,
            'decomposition_started_at' => $this->decomposition_started_at ?? now(),
            'decomposition_completed_at' => null,
        ]);
    }

    /**
     * Mark the decomposition as completed (master plan applied). Stamps the
     * completion and clears any residual error.
     */
    public function markDecompositionCompleted(): void
    {
        $this->update([
            'decomposition_status' => self::DECOMPOSITION_COMPLETED,
            'decomposition_error' => null,
            'decomposition_started_at' => $this->decomposition_started_at ?? now(),
            'decomposition_completed_at' => now(),
        ]);
    }

    /**
     * Mark the decomposition as failed with an optional reason, stamping the
     * completion time so the failure has a deterministic end timestamp.
     */
    public function markDecompositionFailed(?string $error = null): void
    {
        $this->update([
            'decomposition_status' => self::DECOMPOSITION_FAILED,
            'decomposition_error' => $error,
            'decomposition_completed_at' => now(),
        ]);
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
