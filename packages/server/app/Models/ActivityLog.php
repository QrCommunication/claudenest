<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ActivityLog extends Model
{
    use HasFactory, HasUuids;

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
    protected $table = 'activity_log';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'instance_id',
        'type',
        'details',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'details' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = false;

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    // ==================== CONSTANTS ====================

    public const TYPES = [
        'task_claimed',
        'task_completed',
        'context_updated',
        'file_locked',
        'file_unlocked',
        'broadcast',
        'conflict',
        'instance_connected',
        'instance_disconnected',
    ];

    // ==================== RELATIONSHIPS ====================

    public function project(): BelongsTo
    {
        return $this->belongsTo(SharedProject::class, 'project_id');
    }

    // ==================== SCOPES ====================

    public function scopeForProject($query, string $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopeByInstance($query, string $instanceId)
    {
        return $query->where('instance_id', $instanceId);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeRecent($query, int $minutes = 60)
    {
        return $query->where('created_at', '>=', now()->subMinutes($minutes));
    }

    public function scopeSince($query, $timestamp)
    {
        return $query->where('created_at', '>=', $timestamp);
    }

    public function scopeBefore($query, $timestamp)
    {
        return $query->where('created_at', '<', $timestamp);
    }

    // ==================== ACCESSORS ====================

    public function getMessageAttribute(): string
    {
        return match ($this->type) {
            'task_claimed' => "Task '{$this->details['task_title']}' claimed",
            'task_completed' => "Task '{$this->details['task_title']}' completed",
            'context_updated' => 'Context updated',
            'file_locked' => "File '{$this->details['path']}' locked",
            'file_unlocked' => "File '{$this->details['path']}' unlocked",
            'broadcast' => $this->details['message'] ?? 'Broadcast message',
            'conflict' => "Conflict detected: {$this->details['description']}",
            'instance_connected' => 'Instance connected',
            'instance_disconnected' => 'Instance disconnected',
            default => 'Unknown activity',
        };
    }

    public function getIconAttribute(): string
    {
        return match ($this->type) {
            'task_claimed' => '📋',
            'task_completed' => '✅',
            'context_updated' => '📝',
            'file_locked' => '🔒',
            'file_unlocked' => '🔓',
            'broadcast' => '📢',
            'conflict' => '⚠️',
            'instance_connected' => '🟢',
            'instance_disconnected' => '🔴',
            default => '📌',
        };
    }

    public function getColorAttribute(): string
    {
        return match ($this->type) {
            'task_claimed' => '#6366f1', // indigo
            'task_completed' => '#22c55e', // green
            'context_updated' => '#22d3ee', // cyan
            'file_locked' => '#a855f7', // purple
            'file_unlocked' => '#fbbf24', // amber
            'broadcast' => '#a855f7', // purple
            'conflict' => '#ef4444', // red
            'instance_connected' => '#22c55e', // green
            'instance_disconnected' => '#ef4444', // red
            default => '#64748b', // slate
        };
    }

    // ==================== HELPERS ====================

    public static function getRecentForProject(string $projectId, int $limit = 50): array
    {
        return static::forProject($projectId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'type' => $log->type,
                'message' => $log->message,
                'icon' => $log->icon,
                'color' => $log->color,
                'instanceId' => $log->instance_id,
                'details' => $log->details,
                'createdAt' => $log->created_at,
            ])
            ->toArray();
    }

    public static function getUnreadCount(string $projectId, $since): int
    {
        return static::forProject($projectId)
            ->since($since)
            ->count();
    }

    /**
     * Clean up old activity logs.
     */
    public static function cleanup(int $daysToKeep = 30): int
    {
        return static::before(now()->subDays($daysToKeep))->delete();
    }
}
