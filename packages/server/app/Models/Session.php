<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Session extends Model
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
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'machine_id',
        'user_id',
        'mode',
        'project_path',
        'initial_prompt',
        'status',
        'pid',
        'exit_code',
        'pty_size',
        'total_tokens',
        'total_cost',
        'started_at',
        'completed_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'pty_size' => 'array',
        'pid' => 'integer',
        'exit_code' => 'integer',
        'total_tokens' => 'integer',
        'total_cost' => 'decimal:4',
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
                $model->id = (string) Str::uuid();
            }
            if (empty($model->pty_size)) {
                $model->pty_size = ['cols' => 120, 'rows' => 40];
            }
        });
    }

    // ==================== CONSTANTS ====================

    public const MODES = ['interactive', 'headless', 'oneshot'];

    public const STATUSES = ['created', 'starting', 'running', 'waiting_input', 'completed', 'error', 'terminated'];

    // ==================== RELATIONSHIPS ====================

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(SessionLog::class);
    }

    public function claudeInstance(): HasOne
    {
        return $this->hasOne(ClaudeInstance::class);
    }

    // ==================== SCOPES ====================

    public function scopeRunning($query)
    {
        return $query->whereIn('status', ['running', 'waiting_input']);
    }

    public function scopeCompleted($query)
    {
        return $query->whereIn('status', ['completed', 'error', 'terminated']);
    }

    public function scopeForUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForMachine($query, string $machineId)
    {
        return $query->where('machine_id', $machineId);
    }

    public function scopeByMode($query, string $mode)
    {
        return $query->where('mode', $mode);
    }

    // ==================== ACCESSORS ====================

    public function getIsRunningAttribute(): bool
    {
        return in_array($this->status, ['running', 'waiting_input']);
    }

    public function getIsCompletedAttribute(): bool
    {
        return in_array($this->status, ['completed', 'error', 'terminated']);
    }

    public function getDurationAttribute(): ?int
    {
        if (!$this->started_at) {
            return null;
        }
        $end = $this->completed_at ?? now();
        return $this->started_at->diffInSeconds($end);
    }

    public function getFormattedDurationAttribute(): string
    {
        $seconds = $this->duration;
        if ($seconds === null) {
            return 'N/A';
        }
        if ($seconds < 60) {
            return $seconds . 's';
        }
        if ($seconds < 3600) {
            return floor($seconds / 60) . 'm ' . ($seconds % 60) . 's';
        }
        return floor($seconds / 3600) . 'h ' . floor(($seconds % 3600) / 60) . 'm';
    }

    // ==================== HELPERS ====================

    public function markAsStarting(): void
    {
        $this->update(['status' => 'starting']);
    }

    public function markAsRunning(): void
    {
        $this->update([
            'status' => 'running',
            'started_at' => $this->started_at ?? now(),
        ]);
    }

    public function markAsWaitingInput(): void
    {
        $this->update(['status' => 'waiting_input']);
    }

    public function markAsCompleted(?int $exitCode = null): void
    {
        $this->update([
            'status' => 'completed',
            'exit_code' => $exitCode ?? 0,
            'completed_at' => now(),
        ]);
    }

    public function markAsError(?int $exitCode = null, ?string $error = null): void
    {
        $this->update([
            'status' => 'error',
            'exit_code' => $exitCode ?? 1,
            'completed_at' => now(),
        ]);

        if ($error) {
            $this->logs()->create([
                'type' => 'error',
                'data' => $error,
            ]);
        }
    }

    public function markAsTerminated(): void
    {
        $this->update([
            'status' => 'terminated',
            'completed_at' => now(),
        ]);
    }

    public function resizePty(int $cols, int $rows): void
    {
        $this->update(['pty_size' => ['cols' => $cols, 'rows' => $rows]]);
    }

    public function addLog(string $type, string $data, array $metadata = []): SessionLog
    {
        return $this->logs()->create([
            'type' => $type,
            'data' => $data,
            'metadata' => $metadata,
        ]);
    }

    public function getOutputHistory(int $limit = 1000): array
    {
        return $this->logs()
            ->whereIn('type', ['output', 'input'])
            ->orderBy('created_at', 'asc')
            ->limit($limit)
            ->pluck('data')
            ->toArray();
    }
}
