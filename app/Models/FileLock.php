<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class FileLock extends Model
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
    protected $table = 'file_locks';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'path',
        'locked_by',
        'reason',
        'locked_at',
        'expires_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'locked_at' => 'datetime',
        'expires_at' => 'datetime',
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
            if (empty($model->locked_at)) {
                $model->locked_at = now();
            }
        });
    }

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

    public function scopeForPath($query, string $path)
    {
        return $query->where('path', $path);
    }

    public function scopeByInstance($query, string $instanceId)
    {
        return $query->where('locked_by', $instanceId);
    }

    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', now());
    }

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    // ==================== ACCESSORS ====================

    public function getIsExpiredAttribute(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function getIsActiveAttribute(): bool
    {
        return !$this->is_expired;
    }

    public function getRemainingTimeAttribute(): ?int
    {
        if ($this->is_expired) {
            return 0;
        }
        return $this->expires_at->diffInSeconds(now());
    }

    // ==================== HELPERS ====================

    public function extend(int $minutes = 30): void
    {
        $this->update([
            'expires_at' => now()->addMinutes($minutes),
        ]);
    }

    public function release(): bool
    {
        return $this->delete();
    }

    public function touchLock(): void
    {
        $lockTimeout = $this->project?->getSetting('lockTimeoutMinutes', 30);
        $this->update([
            'expires_at' => now()->addMinutes($lockTimeout),
        ]);
    }

    // ==================== STATIC METHODS ====================

    /**
     * Try to acquire a lock on a file.
     *
     * @return FileLock|false Returns the lock if successful, false if already locked
     */
    public static function acquire(
        string $projectId,
        string $path,
        string $instanceId,
        ?string $reason = null,
        ?int $durationMinutes = null
    ): self|false {
        // Clean up any expired locks first
        static::cleanupExpired();

        // Check if already locked
        $existing = static::forProject($projectId)
            ->forPath($path)
            ->active()
            ->first();

        if ($existing && $existing->locked_by !== $instanceId) {
            return false;
        }

        // If already locked by this instance, extend it
        if ($existing) {
            $existing->touchLock();
            return $existing;
        }

        // Get lock duration from project settings
        if ($durationMinutes === null) {
            $project = SharedProject::find($projectId);
            $durationMinutes = $project?->getSetting('lockTimeoutMinutes', 30);
        }

        $lock = static::create([
            'project_id' => $projectId,
            'path' => $path,
            'locked_by' => $instanceId,
            'reason' => $reason,
            'expires_at' => now()->addMinutes($durationMinutes),
        ]);

        // Log activity
        $project?->logActivity('file_locked', $instanceId, [
            'path' => $path,
            'reason' => $reason,
        ]);

        return $lock;
    }

    /**
     * Release a lock on a file.
     */
    public static function releaseLock(
        string $projectId,
        string $path,
        string $instanceId
    ): bool {
        $lock = static::forProject($projectId)
            ->forPath($path)
            ->byInstance($instanceId)
            ->first();

        if (!$lock) {
            return false;
        }

        $project = $lock->project;
        $result = $lock->release();

        if ($result) {
            $project?->logActivity('file_unlocked', $instanceId, [
                'path' => $path,
            ]);
        }

        return $result;
    }

    /**
     * Force release a lock (admin only).
     */
    public static function forceRelease(string $projectId, string $path): bool
    {
        $lock = static::forProject($projectId)
            ->forPath($path)
            ->first();

        if (!$lock) {
            return false;
        }

        $project = $lock->project;
        $instanceId = $lock->locked_by;
        $result = $lock->release();

        if ($result) {
            $project?->logActivity('file_unlocked', null, [
                'path' => $path,
                'forced' => true,
                'previous_owner' => $instanceId,
            ]);
        }

        return $result;
    }

    /**
     * Check if a file is locked.
     */
    public static function isLocked(string $projectId, string $path): bool
    {
        static::cleanupExpired();

        return static::forProject($projectId)
            ->forPath($path)
            ->active()
            ->exists();
    }

    /**
     * Get the owner of a lock.
     */
    public static function getOwner(string $projectId, string $path): ?string
    {
        static::cleanupExpired();

        $lock = static::forProject($projectId)
            ->forPath($path)
            ->active()
            ->first();

        return $lock?->locked_by;
    }

    /**
     * Get all active locks for a project.
     */
    public static function getActiveLocks(string $projectId): array
    {
        static::cleanupExpired();

        return static::forProject($projectId)
            ->active()
            ->get()
            ->map(fn ($lock) => [
                'path' => $lock->path,
                'lockedBy' => $lock->locked_by,
                'reason' => $lock->reason,
                'lockedAt' => $lock->locked_at,
                'expiresAt' => $lock->expires_at,
                'remainingSeconds' => $lock->remaining_time,
            ])
            ->toArray();
    }

    /**
     * Clean up expired locks.
     */
    public static function cleanupExpired(): int
    {
        return static::expired()->delete();
    }

    /**
     * Release all locks owned by an instance.
     */
    public static function releaseByInstance(string $projectId, string $instanceId): int
    {
        $locks = static::forProject($projectId)
            ->byInstance($instanceId)
            ->get();

        foreach ($locks as $lock) {
            $lock->release();
        }

        return count($locks);
    }
}
