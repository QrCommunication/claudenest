<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasVersion4Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SharedTask extends Model
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
     * The table associated with the model.
     */
    protected $table = 'shared_tasks';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'parent_id',
        'epic_id',
        'sprint_id',
        'wave',
        'title',
        'description',
        'priority',
        'status',
        'assigned_to',
        'claimed_at',
        'dependencies',
        'blocked_by',
        'files',
        'estimated_tokens',
        'story_points',
        'due_date',
        'sort_order',
        'labels',
        'completed_at',
        'completion_summary',
        'files_modified',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'wave' => 'integer',
        'dependencies' => 'array',
        'files' => 'array',
        'files_modified' => 'array',
        'labels' => 'array',
        'estimated_tokens' => 'integer',
        'story_points' => 'integer',
        'sort_order' => 'integer',
        'due_date' => 'date',
        'claimed_at' => 'datetime',
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

    public const PRIORITIES = ['low', 'medium', 'high', 'critical'];

    public const STATUSES = ['backlog', 'pending', 'in_progress', 'blocked', 'review', 'done'];

    // ==================== RELATIONSHIPS ====================

    public function project(): BelongsTo
    {
        return $this->belongsTo(SharedProject::class, 'project_id');
    }

    public function assignedInstance(): HasOne
    {
        return $this->hasOne(ClaudeInstance::class, 'current_task_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function epic(): BelongsTo
    {
        return $this->belongsTo(Epic::class);
    }

    public function sprint(): BelongsTo
    {
        return $this->belongsTo(Sprint::class);
    }

    // ==================== SCOPES ====================

    public function scopeForProject($query, string $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeDone($query)
    {
        return $query->where('status', 'done');
    }

    /**
     * Source of truth for "remaining work" counts (front display + project/sprint stats).
     *
     * A task counts as remaining when it is NOT yet done AND it is not stranded in a
     * sprint that has been closed (completed / cancelled). Tasks with no sprint
     * (backlog) are kept: whereDoesntHave only excludes tasks whose sprint actually
     * matches the closed-status filter, so a NULL sprint_id has no matching relation
     * and is therefore retained.
     */
    public function scopeRemaining($query)
    {
        return $query
            ->where('status', '!=', 'done')
            ->whereDoesntHave('sprint', function ($sprintQuery) {
                $sprintQuery->whereIn('status', ['completed', 'cancelled']);
            });
    }

    /**
     * Default visibility filter for task panels.
     *
     * Shows every task that still represents work to track — anything not yet
     * done (pending / in_progress / blocked / review / backlog) — PLUS the
     * tasks completed *today* so a worker still sees what it just finished.
     * Tasks done before today are hidden to keep the board focused on the
     * current day. The whole condition is wrapped in a nested where() so the
     * inner orWhere does not leak past sibling constraints (forProject,
     * bySprint, ...) and accidentally surface done tasks from other scopes.
     */
    public function scopeDefaultVisible($query)
    {
        return $query->where(function ($q) {
            $q->where('status', '!=', 'done')
                ->orWhere(function ($sub) {
                    $sub->where('status', 'done')
                        ->where('completed_at', '>=', now()->startOfDay());
                });
        });
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByPriority($query, string $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeByWave($query, int $wave)
    {
        return $query->where('wave', $wave);
    }

    public function scopeAssignedTo($query, string $instanceId)
    {
        return $query->where('assigned_to', $instanceId);
    }

    public function scopeUnassigned($query)
    {
        return $query->whereNull('assigned_to');
    }

    public function scopeReadyToStart($query)
    {
        return $query->where('status', 'pending')
            ->whereNull('assigned_to')
            ->where(function ($q) {
                // No dependencies at all
                $q->where(function ($sub) {
                    $sub->whereNull('dependencies')
                        ->orWhereJsonLength('dependencies', 0);
                })
                // OR all dependencies are completed
                    ->orWhereRaw("NOT EXISTS (
                             SELECT 1 FROM shared_tasks AS dep
                             WHERE dep.id::text = ANY(
                                 SELECT jsonb_array_elements_text(shared_tasks.dependencies)
                             )
                             AND dep.status != 'done'
                         )");
            });
    }

    public function scopeByEpic($query, string $epicId)
    {
        return $query->where('epic_id', $epicId);
    }

    public function scopeBySprint($query, string $sprintId)
    {
        return $query->where('sprint_id', $sprintId);
    }

    public function scopeRootTasks($query)
    {
        return $query->whereNull('parent_id');
    }

    public function scopeSubtasksOf($query, string $parentId)
    {
        return $query->where('parent_id', $parentId);
    }

    public function scopeBacklog($query)
    {
        return $query->where('status', 'backlog');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    public function scopePrioritized($query)
    {
        return $query
            // Resume first: a task that was already started then orphaned keeps
            // its claimed_at (reclaimOrphaned() does not clear it), so surface
            // it before any never-touched task.
            ->orderByRaw('CASE WHEN claimed_at IS NOT NULL THEN 0 ELSE 1 END ASC')
            ->orderByRaw('COALESCE(wave, 999) ASC')
            ->orderBy('sort_order', 'asc')
            ->orderByRaw("
                CASE priority
                    WHEN 'critical' THEN 4
                    WHEN 'high' THEN 3
                    WHEN 'medium' THEN 2
                    WHEN 'low' THEN 1
                    ELSE 0
                END DESC
            ")
            ->orderBy('created_at', 'asc');
    }

    // ==================== ACCESSORS ====================

    public function getIsClaimedAttribute(): bool
    {
        return ! empty($this->assigned_to);
    }

    public function getIsCompletedAttribute(): bool
    {
        return $this->status === 'done';
    }

    public function getIsBlockedAttribute(): bool
    {
        return $this->status === 'blocked' || ! empty($this->blocked_by);
    }

    public function getDurationAttribute(): ?int
    {
        if (! $this->claimed_at) {
            return null;
        }
        $end = $this->completed_at ?? now();

        // Carbon 3 diffInSeconds() returns float; accessor is typed ?int (strict_types).
        return (int) $this->claimed_at->diffInSeconds($end);
    }

    public function getPriorityWeightAttribute(): int
    {
        return match ($this->priority) {
            'critical' => 4,
            'high' => 3,
            'medium' => 2,
            'low' => 1,
            default => 0,
        };
    }

    public function getSubtasksCountAttribute(): int
    {
        return $this->children()->count();
    }

    public function getCompletedSubtasksCountAttribute(): int
    {
        return $this->children()->where('status', 'done')->count();
    }

    public function getHasSubtasksAttribute(): bool
    {
        return $this->children()->exists();
    }

    // ==================== HELPERS ====================

    public function claim(string $instanceId): bool
    {
        return DB::transaction(function () use ($instanceId) {
            $task = static::where('id', $this->id)
                ->whereNull('assigned_to')
                ->where('status', 'pending')
                ->lockForUpdate()
                ->first();

            if (! $task) {
                return false;
            }

            // Check and acquire file locks BEFORE claiming
            $filesToLock = $task->files ?? [];
            if (! empty($filesToLock)) {
                // Check for conflicts: any file locked by a different instance
                foreach ($filesToLock as $file) {
                    $owner = FileLock::getOwner($task->project_id, $file);
                    if ($owner !== null && $owner !== $instanceId) {
                        // File is locked by another instance — cannot claim
                        return false;
                    }
                }

                // Acquire locks on all task files
                foreach ($filesToLock as $file) {
                    $lock = FileLock::acquire(
                        $task->project_id,
                        $file,
                        $instanceId,
                        "Task: {$task->title}"
                    );

                    if ($lock === false) {
                        // Lock acquisition failed (race condition) — rollback
                        throw new \RuntimeException("Failed to acquire lock on {$file}");
                    }
                }
            }

            $task->update([
                'assigned_to' => $instanceId,
                'status' => 'in_progress',
                'claimed_at' => now(),
            ]);

            ClaudeInstance::where('id', $instanceId)->update(['current_task_id' => $this->id]);

            $this->refresh();

            $this->project->logActivity('task_claimed', $instanceId, [
                'task_id' => $this->id,
                'task_title' => $this->title,
                'files_locked' => count($filesToLock),
            ]);

            return true;
        });
    }

    public function release(?string $reason = null): void
    {
        DB::transaction(function () use ($reason) {
            $previousOwner = $this->assigned_to;

            $this->update([
                'assigned_to' => null,
                'status' => 'pending',
                'claimed_at' => null,
                'blocked_by' => $reason,
            ]);

            ClaudeInstance::where('current_task_id', $this->id)->update(['current_task_id' => null]);

            // Release file locks held by the previous owner for this task's files
            if ($previousOwner && ! empty($this->files)) {
                foreach ($this->files as $file) {
                    FileLock::releaseLock($this->project_id, $file, $previousOwner);
                }
            }

            // Log activity
            $this->project->logActivity('task_released', null, [
                'task_id' => $this->id,
                'task_title' => $this->title,
                'reason' => $reason,
            ]);
        });
    }

    public function complete(string $summary, array $filesModified = []): void
    {
        DB::transaction(function () use ($summary, $filesModified) {
            $assignedTo = $this->assigned_to;

            $this->update([
                'status' => 'done',
                'completed_at' => now(),
                'completion_summary' => $summary,
                'files_modified' => $filesModified,
            ]);

            ClaudeInstance::where('current_task_id', $this->id)->update(['current_task_id' => null]);

            // Release all file locks held for this task
            if ($assignedTo) {
                $filesToRelease = array_unique(array_merge(
                    $this->files ?? [],
                    $filesModified
                ));

                foreach ($filesToRelease as $file) {
                    FileLock::releaseLock($this->project_id, $file, $assignedTo);
                }
            }

            // Log activity
            $this->project->logActivity('task_completed', $assignedTo, [
                'task_id' => $this->id,
                'task_title' => $this->title,
                'summary' => $summary,
                'files_modified' => $filesModified,
            ]);
        });
    }

    public function block(string $reason): void
    {
        $this->update([
            'status' => 'blocked',
            'blocked_by' => $reason,
        ]);
    }

    public function unblock(): void
    {
        $this->update([
            'status' => $this->assigned_to ? 'in_progress' : 'pending',
            'blocked_by' => null,
        ]);
    }

    public function addDependency(string $taskId): void
    {
        $dependencies = $this->dependencies ?? [];
        if (! in_array($taskId, $dependencies)) {
            $dependencies[] = $taskId;
            $this->update(['dependencies' => $dependencies]);
        }
    }

    public function removeDependency(string $taskId): void
    {
        $dependencies = $this->dependencies ?? [];
        $dependencies = array_diff($dependencies, [$taskId]);
        $this->update(['dependencies' => array_values($dependencies)]);
    }

    public function hasDependenciesCompleted(): bool
    {
        if (empty($this->dependencies)) {
            return true;
        }

        $completedCount = static::whereIn('id', $this->dependencies)
            ->where('status', 'done')
            ->count();

        return $completedCount === count($this->dependencies);
    }

    /**
     * Release tasks left 'in_progress' by a worker that is no longer connected
     * (crashed / recycled / orphaned) back to the claimable pool, so a fresh
     * worker resumes them. claimed_at is INTENTIONALLY preserved: it marks the
     * task as "already started" so prioritized() surfaces it before fresh work
     * — the work-in-progress on disk is then continued rather than abandoned.
     *
     * @return int number of tasks reclaimed
     */
    public static function reclaimOrphaned(string $projectId): int
    {
        return DB::transaction(function () use ($projectId) {
            // Liveness is keyed off the SESSION status, NOT instance.disconnected_at:
            // a transient agent WebSocket drop spuriously flips disconnected_at
            // while the worker process (and its session=running) keep going —
            // reclaiming on disconnected_at would yank tasks from live workers.
            $liveInstanceIds = ClaudeInstance::where('project_id', $projectId)
                ->whereHas('session', fn ($query) => $query->whereNotIn('status', ['completed', 'error', 'terminated']))
                ->pluck('id')
                ->all();

            $orphans = static::forProject($projectId)
                ->where('status', 'in_progress')
                ->when($liveInstanceIds !== [], fn ($query) => $query->whereNotIn('assigned_to', $liveInstanceIds))
                ->lockForUpdate()
                ->get();

            foreach ($orphans as $task) {
                $previousOwner = $task->assigned_to;

                // status -> pending + assigned_to cleared makes it claimable;
                // claimed_at kept as the resume marker (see prioritized()).
                $task->update([
                    'assigned_to' => null,
                    'status' => 'pending',
                ]);

                ClaudeInstance::where('current_task_id', $task->id)->update(['current_task_id' => null]);

                if ($previousOwner && ! empty($task->files)) {
                    foreach ($task->files as $file) {
                        FileLock::releaseLock($task->project_id, $file, $previousOwner);
                    }
                }

                $task->project->logActivity('task_released', null, [
                    'task_id' => $task->id,
                    'task_title' => $task->title,
                    'reason' => 'orphaned worker reclaimed',
                    'previous_owner' => $previousOwner,
                ]);
            }

            return $orphans->count();
        });
    }

    public static function getNextAvailable(string $projectId): ?self
    {
        return static::forProject($projectId)
            ->readyToStart()
            ->prioritized()
            ->first();
    }

    public static function claimNextAvailable(string $projectId, string $instanceId): ?self
    {
        return DB::transaction(function () use ($projectId, $instanceId) {
            $task = static::forProject($projectId)
                ->readyToStart()
                ->prioritized()
                ->lockForUpdate()
                ->first();

            if (! $task) {
                return null;
            }

            $task->update([
                'assigned_to' => $instanceId,
                'status' => 'in_progress',
                'claimed_at' => now(),
            ]);

            ClaudeInstance::where('id', $instanceId)->update(['current_task_id' => $task->id]);

            $task->project->logActivity('task_claimed', $instanceId, [
                'task_id' => $task->id,
                'task_title' => $task->title,
            ]);

            return $task;
        });
    }
}
