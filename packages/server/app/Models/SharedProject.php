<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasVersion4Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SharedProject extends Model
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
    protected $table = 'shared_projects';

    /**
     * Context fields captured/restored by archive()/unarchive() and the single
     * source of truth for updateContext()'s allow-list.
     *
     * @var list<string>
     */
    public const CONTEXT_FIELDS = [
        'summary',
        'architecture',
        'conventions',
        'current_focus',
        'recent_changes',
    ];

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'machine_id',
        'name',
        'project_path',
        'summary',
        'architecture',
        'conventions',
        'prd',
        'master_plan',
        'current_focus',
        'recent_changes',
        'total_tokens',
        'max_tokens',
        'settings',
        'archived_at',
        'archived_context',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'total_tokens' => 'integer',
        'max_tokens' => 'integer',
        'master_plan' => 'array',
        'settings' => 'array',
        'archived_at' => 'datetime',
        'archived_context' => 'array',
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
            if (empty($model->settings)) {
                $model->settings = [
                    'maxContextTokens' => 8000,
                    'summarizeThreshold' => 0.8,
                    'contextRetentionDays' => 30,
                    'taskTimeoutMinutes' => 60,
                    'lockTimeoutMinutes' => 30,
                    'broadcastLevel' => 'all',
                ];
            }
        });
    }

    // ==================== RELATIONSHIPS ====================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    public function contextChunks(): HasMany
    {
        return $this->hasMany(ContextChunk::class, 'project_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(SharedTask::class, 'project_id');
    }

    public function epics(): HasMany
    {
        return $this->hasMany(Epic::class, 'project_id');
    }

    public function sprints(): HasMany
    {
        return $this->hasMany(Sprint::class, 'project_id');
    }

    public function claudeInstances(): HasMany
    {
        return $this->hasMany(ClaudeInstance::class, 'project_id');
    }

    public function fileLocks(): HasMany
    {
        return $this->hasMany(FileLock::class, 'project_id');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'project_id');
    }

    // ==================== SCOPES ====================

    public function scopeForUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForMachine($query, string $machineId)
    {
        return $query->where('machine_id', $machineId);
    }

    public function scopeByPath($query, string $path)
    {
        return $query->where('project_path', $path);
    }

    /** Active (non-archived) projects — the default sidebar list. */
    public function scopeActive($query)
    {
        return $query->whereNull('archived_at');
    }

    /** Archived projects — only shown when explicitly requested (?archived=true). */
    public function scopeArchived($query)
    {
        return $query->whereNotNull('archived_at');
    }

    // ==================== ACCESSORS ====================

    public function getTokenUsagePercentAttribute(): float
    {
        if ($this->max_tokens <= 0) {
            return 0;
        }

        return min(100, ($this->total_tokens / $this->max_tokens) * 100);
    }

    public function getIsTokenLimitReachedAttribute(): bool
    {
        return $this->total_tokens >= $this->max_tokens;
    }

    public function getActiveInstancesCountAttribute(): int
    {
        return $this->claudeInstances()->where('status', 'active')->count();
    }

    public function getPendingTasksCountAttribute(): int
    {
        return $this->tasks()->where('status', 'pending')->count();
    }

    public function getActiveSprintAttribute(): ?Sprint
    {
        return $this->sprints()->active()->first();
    }

    /**
     * Count of active (non-archived) epics. Mirrors the default-visible set
     * surfaced everywhere else via {@see Epic::scopeActive()} so an archived
     * epic disappears from the sidebar badge the moment it is archived.
     */
    public function getEpicsCountAttribute(): int
    {
        return $this->epics()->active()->count();
    }

    /**
     * Count of sprints that do not belong exclusively to an archived epic.
     * Sprints have no direct archived_at — their archive state is derived from
     * their tasks' epics — so we reuse {@see Sprint::scopeExcludingArchivedEpics()}
     * (the single source of truth for that rule) rather than re-deriving it.
     */
    public function getSprintsCountAttribute(): int
    {
        return $this->sprints()->excludingArchivedEpics()->count();
    }

    public function getIsArchivedAttribute(): bool
    {
        return $this->archived_at !== null;
    }

    // ==================== HELPERS ====================

    public function addTokens(int $tokens): void
    {
        $this->increment('total_tokens', $tokens);
    }

    public function resetTokens(): void
    {
        $this->update(['total_tokens' => 0]);
    }

    public function updateContext(array $fields): void
    {
        $update = array_intersect_key($fields, array_flip(self::CONTEXT_FIELDS));

        // CONTEXT_FIELDS are `text DEFAULT ''` (NOT NULL). The global
        // ConvertEmptyStringsToNull middleware turns an empty-string payload
        // value into null (e.g. a context-generation session sending an empty
        // field), which would raise a 23502 not-null violation — coalesce to ''.
        foreach ($update as $field => $value) {
            if ($value === null) {
                $update[$field] = '';
            }
        }

        if (! empty($update)) {
            $this->update($update);
        }
    }

    /**
     * Archive the project: capture a snapshot of its context fields and stamp
     * archived_at. Deletes NOTHING (tasks, locks, context chunks and sessions
     * stay intact) so unarchive()/recover() can fully restore it. Idempotent:
     * re-archiving an already-archived project keeps the original snapshot.
     *
     * @param  array<string, mixed>  $contextSnapshot  optional override snapshot;
     *                                                 defaults to the current context fields.
     */
    public function archive(array $contextSnapshot = []): void
    {
        if ($this->is_archived) {
            return;
        }

        $snapshot = empty($contextSnapshot)
            ? $this->only(self::CONTEXT_FIELDS)
            : array_intersect_key($contextSnapshot, array_flip(self::CONTEXT_FIELDS));

        $this->update([
            'archived_at' => now(),
            'archived_context' => $snapshot,
        ]);
    }

    /**
     * Unarchive the project: restore the context fields from the captured
     * snapshot (context recovery) then clear the archive markers. Idempotent on
     * an already-active project.
     */
    public function unarchive(): void
    {
        if (! $this->is_archived) {
            return;
        }

        $restore = is_array($this->archived_context)
            ? array_intersect_key($this->archived_context, array_flip(self::CONTEXT_FIELDS))
            : [];

        $this->update(array_merge($restore, [
            'archived_at' => null,
            'archived_context' => null,
        ]));
    }

    public function getSetting(string $key, mixed $default = null): mixed
    {
        return $this->settings[$key] ?? $default;
    }

    public function setSetting(string $key, mixed $value): void
    {
        $settings = $this->settings ?? [];
        $settings[$key] = $value;
        $this->update(['settings' => $settings]);
    }

    public function logActivity(string $type, ?string $instanceId = null, array $details = []): ActivityLog
    {
        return $this->activityLogs()->create([
            'instance_id' => $instanceId,
            'type' => $type,
            'details' => $details,
        ]);
    }
}
