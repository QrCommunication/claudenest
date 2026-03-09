<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasVersion4Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'estimated_tokens' => 'integer',
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

    public const STATUSES = ['pending', 'in_progress', 'blocked', 'review', 'done'];

    // ==================== RELATIONSHIPS ====================

    public function project(): BelongsTo
    {
        return $this->belongsTo(SharedProject::class, 'project_id');
    }

    public function assignedInstance(): HasOne
    {
        return $this->hasOne(ClaudeInstance::class, 'current_task_id');
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

    // ==================== ACCESSORS ====================

    public function getIsClaimedAttribute(): bool
    {
        return !empty($this->assigned_to);
    }

    public function getIsCompletedAttribute(): bool
    {
        return $this->status === 'done';
    }

    public function getIsBlockedAttribute(): bool
    {
        return $this->status === 'blocked' || !empty($this->blocked_by);
    }

    public function getDurationAttribute(): ?int
    {
        if (!$this->claimed_at) {
            return null;
        }
        $end = $this->completed_at ?? now();
        return $this->claimed_at->diffInSeconds($end);
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

    // ==================== HELPERS ====================

    public function claim(string $instanceId): bool
    {
        return DB::transaction(function () use ($instanceId) {
            $task = static::where('id', $this->id)
                ->whereNull('assigned_to')
                ->where('status', 'pending')
                ->lockForUpdate()
                ->first();

            if (!$task) {
                return false;
            }

            $task->update([
                'assigned_to' => $instanceId,
                'status' => 'in_progress',
                'claimed_at' => now(),
            ]);

            $this->refresh();

            $this->project->logActivity('task_claimed', $instanceId, [
                'task_id' => $this->id,
                'task_title' => $this->title,
            ]);

            return true;
        });
    }

    public function release(?string $reason = null): void
    {
        $this->update([
            'assigned_to' => null,
            'status' => 'pending',
            'claimed_at' => null,
            'blocked_by' => $reason,
        ]);

        // Log activity
        $this->project->logActivity('task_released', null, [
            'task_id' => $this->id,
            'task_title' => $this->title,
            'reason' => $reason,
        ]);
    }

    public function complete(string $summary, array $filesModified = []): void
    {
        $this->update([
            'status' => 'done',
            'completed_at' => now(),
            'completion_summary' => $summary,
            'files_modified' => $filesModified,
        ]);

        // Log activity
        $this->project->logActivity('task_completed', $this->assigned_to, [
            'task_id' => $this->id,
            'task_title' => $this->title,
            'summary' => $summary,
            'files_modified' => $filesModified,
        ]);
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
        if (!in_array($taskId, $dependencies)) {
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

    public static function getNextAvailable(string $projectId): ?self
    {
        return static::forProject($projectId)
            ->readyToStart()
            ->orderByRaw("COALESCE(wave, 999) ASC")
            ->orderByRaw("
                CASE priority
                    WHEN 'critical' THEN 4
                    WHEN 'high' THEN 3
                    WHEN 'medium' THEN 2
                    WHEN 'low' THEN 1
                    ELSE 0
                END DESC
            ")
            ->orderBy('created_at', 'asc')
            ->first();
    }

    public static function claimNextAvailable(string $projectId, string $instanceId): ?self
    {
        return DB::transaction(function () use ($projectId, $instanceId) {
            $task = static::forProject($projectId)
                ->readyToStart()
                ->orderByRaw("COALESCE(wave, 999) ASC")
                ->orderByRaw("
                    CASE priority
                        WHEN 'critical' THEN 4
                        WHEN 'high' THEN 3
                        WHEN 'medium' THEN 2
                        WHEN 'low' THEN 1
                        ELSE 0
                    END DESC
                ")
                ->orderBy('created_at', 'asc')
                ->lockForUpdate()
                ->first();

            if (!$task) {
                return null;
            }

            $task->update([
                'assigned_to' => $instanceId,
                'status' => 'in_progress',
                'claimed_at' => now(),
            ]);

            $task->project->logActivity('task_claimed', $instanceId, [
                'task_id' => $task->id,
                'task_title' => $task->title,
            ]);

            return $task;
        });
    }
}
