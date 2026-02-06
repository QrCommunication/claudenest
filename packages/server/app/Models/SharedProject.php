<?php

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
        'current_focus',
        'recent_changes',
        'total_tokens',
        'max_tokens',
        'settings',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'total_tokens' => 'integer',
        'max_tokens' => 'integer',
        'settings' => 'array',
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
        $allowed = ['summary', 'architecture', 'conventions', 'current_focus', 'recent_changes'];
        $update = array_intersect_key($fields, array_flip($allowed));
        if (!empty($update)) {
            $this->update($update);
        }
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
