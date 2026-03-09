<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasVersion4Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class MagicLink extends Model
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
        'email',
        'token',
        'expires_at',
        'used_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'token',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
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

    /**
     * Default expiration time in minutes.
     */
    public const EXPIRATION_MINUTES = 15;

    // ==================== SCOPES ====================

    /**
     * Scope to only include valid magic links (not expired, not used).
     */
    public function scopeValid($query)
    {
        return $query->whereNull('used_at')
            ->where('expires_at', '>', now());
    }

    // ==================== ACCESSORS ====================

    /**
     * Check if the magic link has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if the magic link has been used.
     */
    public function isUsed(): bool
    {
        return !is_null($this->used_at);
    }

    // ==================== HELPERS ====================

    /**
     * Mark the magic link as used.
     */
    public function markAsUsed(): void
    {
        $this->update(['used_at' => now()]);
    }

    /**
     * Clean up expired and used magic links older than the given days.
     */
    public static function cleanupOld(int $days = 7): int
    {
        return static::where(function ($query) {
            $query->whereNotNull('used_at')
                ->orWhere('expires_at', '<=', now());
        })
            ->where('created_at', '<=', now()->subDays($days))
            ->delete();
    }
}
