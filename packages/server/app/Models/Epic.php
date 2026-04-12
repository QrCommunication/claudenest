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
}
