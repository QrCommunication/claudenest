<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClaudeInstance extends Model
{
    use HasFactory;

    /**
     * The primary key type.
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     */
    public $incrementing = false;

    /**
     * The primary key is not auto-incrementing.
     */
    protected $primaryKey = 'id';

    /**
     * The table associated with the model.
     */
    protected $table = 'claude_instances';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'id',
        'project_id',
        'session_id',
        'machine_id',
        'status',
        'current_task_id',
        'context_tokens',
        'max_context_tokens',
        'tasks_completed',
        'connected_at',
        'last_activity_at',
        'disconnected_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'context_tokens' => 'integer',
        'max_context_tokens' => 'integer',
        'tasks_completed' => 'integer',
        'connected_at' => 'datetime',
        'last_activity_at' => 'datetime',
        'disconnected_at' => 'datetime',
    ];

    // ==================== CONSTANTS ====================

    public const STATUSES = ['active', 'idle', 'busy', 'disconnected'];

    // ==================== RELATIONSHIPS ====================

    public function project(): BelongsTo
    {
        return $this->belongsTo(SharedProject::class, 'project_id');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    public function currentTask(): BelongsTo
    {
        return $this->belongsTo(SharedTask::class, 'current_task_id');
    }

    // ==================== SCOPES ====================

    public function scopeForProject($query, string $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeIdle($query)
    {
        return $query->where('status', 'idle');
    }

    public function scopeBusy($query)
    {
        return $query->where('status', 'busy');
    }

    public function scopeConnected($query)
    {
        return $query->whereNull('disconnected_at');
    }

    public function scopeDisconnected($query)
    {
        return $query->whereNotNull('disconnected_at');
    }

    // ==================== ACCESSORS ====================

    public function getIsConnectedAttribute(): bool
    {
        return is_null($this->disconnected_at);
    }

    public function getIsAvailableAttribute(): bool
    {
        return $this->status === 'idle' && $this->is_connected;
    }

    public function getContextUsagePercentAttribute(): float
    {
        if ($this->max_context_tokens <= 0) {
            return 0;
        }
        return min(100, ($this->context_tokens / $this->max_context_tokens) * 100);
    }

    public function getUptimeAttribute(): ?int
    {
        if (!$this->connected_at) {
            return null;
        }
        $end = $this->disconnected_at ?? now();
        return $this->connected_at->diffInSeconds($end);
    }

    // ==================== HELPERS ====================

    public function markAsIdle(): void
    {
        $this->update([
            'status' => 'idle',
            'current_task_id' => null,
            'last_activity_at' => now(),
        ]);
    }

    public function markAsBusy(string $taskId): void
    {
        $this->update([
            'status' => 'busy',
            'current_task_id' => $taskId,
            'last_activity_at' => now(),
        ]);
    }

    public function markAsActive(): void
    {
        $this->update([
            'status' => 'active',
            'last_activity_at' => now(),
        ]);
    }

    public function markAsDisconnected(): void
    {
        $this->update([
            'status' => 'disconnected',
            'disconnected_at' => now(),
            'current_task_id' => null,
        ]);

        // Release any task this instance was working on
        if ($this->current_task_id) {
            $this->currentTask?->release('Instance disconnected');
        }
    }

    public function updateActivity(): void
    {
        $this->update(['last_activity_at' => now()]);
    }

    public function incrementTasksCompleted(): void
    {
        $this->increment('tasks_completed');
        $this->update(['last_activity_at' => now()]);
    }

    public function updateContextTokens(int $tokens): void
    {
        $this->update([
            'context_tokens' => $tokens,
            'last_activity_at' => now(),
        ]);
    }

    public function canAcceptTask(): bool
    {
        return $this->is_available && $this->context_usage_percent < 90;
    }

    public static function getActiveForProject(string $projectId): array
    {
        return static::forProject($projectId)
            ->connected()
            ->get()
            ->map(fn ($instance) => [
                'id' => $instance->id,
                'status' => $instance->status,
                'contextUsage' => $instance->context_usage_percent,
                'tasksCompleted' => $instance->tasks_completed,
                'currentTaskId' => $instance->current_task_id,
                'uptime' => $instance->uptime,
            ])
            ->toArray();
    }

    public static function getAvailableForProject(string $projectId): ?self
    {
        return static::forProject($projectId)
            ->idle()
            ->connected()
            ->orderBy('context_tokens', 'asc')
            ->first();
    }
}
