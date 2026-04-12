<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasVersion4Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Sprint extends Model
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
        'name',
        'goal',
        'status',
        'start_date',
        'end_date',
        'velocity',
        'capacity',
        'sort_order',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'velocity' => 'integer',
        'capacity' => 'integer',
        'sort_order' => 'integer',
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

    public const STATUSES = ['planning', 'active', 'completed', 'cancelled'];

    // ==================== RELATIONSHIPS ====================

    public function project(): BelongsTo
    {
        return $this->belongsTo(SharedProject::class, 'project_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(SharedTask::class, 'sprint_id');
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

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePlanning($query)
    {
        return $query->where('status', 'planning');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
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

    public function getTotalStoryPointsAttribute(): int
    {
        return (int) $this->tasks()->sum('story_points');
    }

    public function getCompletedStoryPointsAttribute(): int
    {
        return (int) $this->tasks()->where('status', 'done')->sum('story_points');
    }

    public function getProgressPercentageAttribute(): float
    {
        $total = $this->tasks_count;

        if ($total === 0) {
            return 0.0;
        }

        return round(($this->completed_tasks_count / $total) * 100, 1);
    }

    public function getRemainingDaysAttribute(): ?int
    {
        if (!$this->end_date) {
            return null;
        }

        $remaining = now()->startOfDay()->diffInDays($this->end_date, false);

        return (int) $remaining;
    }

    public function getIsOverdueAttribute(): bool
    {
        if (!$this->end_date) {
            return false;
        }

        return $this->status !== 'completed'
            && $this->status !== 'cancelled'
            && $this->end_date->isPast();
    }

    // ==================== HELPERS ====================

    public function start(): void
    {
        $this->update([
            'status' => 'active',
            'start_date' => $this->start_date ?? now()->toDateString(),
        ]);
    }

    public function complete(): void
    {
        $this->update([
            'status' => 'completed',
            'end_date' => $this->end_date ?? now()->toDateString(),
        ]);
    }

    public function cancel(): void
    {
        $this->update(['status' => 'cancelled']);
    }

    /**
     * Generate burndown chart data for this sprint.
     *
     * Returns daily snapshots of remaining vs completed story points
     * between start_date and end_date (or today).
     *
     * @return array<int, array{date: string, remaining: int, completed: int, ideal: float}>
     */
    public function getBurndownData(): array
    {
        if (!$this->start_date) {
            return [];
        }

        $totalPoints = $this->total_story_points;
        $startDate = $this->start_date->copy();
        $endDate = $this->end_date ?? now()->toDate();

        if ($startDate->greaterThan($endDate)) {
            return [];
        }

        $daysTotal = $startDate->diffInDays($endDate) + 1;
        $dailyIdeal = $daysTotal > 1 ? $totalPoints / ($daysTotal - 1) : $totalPoints;

        $tasks = $this->tasks()
            ->select(['status', 'completed_at', 'estimated_tokens'])
            ->get();

        $data = [];
        $current = $startDate->copy();
        $day = 0;

        while (!$current->greaterThan($endDate)) {
            $completedPoints = $tasks
                ->filter(fn ($t) => $t->completed_at && $t->completed_at->lte($current))
                ->sum('estimated_tokens');

            $data[] = [
                'date' => $current->toDateString(),
                'remaining' => max(0, $totalPoints - (int) $completedPoints),
                'completed' => (int) $completedPoints,
                'ideal' => round(max(0, $totalPoints - ($dailyIdeal * $day)), 1),
            ];

            $current->addDay();
            $day++;
        }

        return $data;
    }
}
