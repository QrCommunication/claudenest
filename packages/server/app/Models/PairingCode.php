<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasVersion4Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PairingCode extends Model
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
        'code',
        'user_id',
        'machine_id',
        'machine_token',
        'status',
        'agent_info',
        'expires_at',
        'completed_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'machine_token',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'agent_info' => 'array',
        'expires_at' => 'datetime',
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

    public const STATUSES = ['pending', 'completed', 'expired'];

    /**
     * Default expiration time in minutes.
     */
    public const EXPIRATION_MINUTES = 5;

    // ==================== RELATIONSHIPS ====================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    // ==================== SCOPES ====================

    /**
     * Scope to only include pending pairing codes.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to only include active pairing codes (pending and not expired).
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'pending')
            ->where('expires_at', '>', now());
    }

    /**
     * Scope to only include expired pairing codes.
     */
    public function scopeExpired($query)
    {
        return $query->where('status', 'pending')
            ->where('expires_at', '<=', now());
    }

    // ==================== ACCESSORS ====================

    /**
     * Check if the pairing code has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if the pairing code has been completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if the pairing code is still active (pending and not expired).
     */
    public function isActive(): bool
    {
        return $this->status === 'pending' && !$this->isExpired();
    }

    // ==================== HELPERS ====================

    /**
     * Mark expired pending codes as expired in the database.
     * Can be called from a scheduled command or as cleanup.
     */
    public static function expireOldCodes(): int
    {
        return static::where('status', 'pending')
            ->where('expires_at', '<=', now())
            ->update(['status' => 'expired']);
    }

    /**
     * Generate a unique 6-character pairing code in XXX-XXX format.
     */
    public static function generateCode(): string
    {
        $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $maxAttempts = 10;

        for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
            $part1 = '';
            $part2 = '';

            for ($i = 0; $i < 3; $i++) {
                $part1 .= $characters[random_int(0, strlen($characters) - 1)];
                $part2 .= $characters[random_int(0, strlen($characters) - 1)];
            }

            $code = $part1 . '-' . $part2;

            // Ensure uniqueness among active codes
            $exists = static::where('code', $code)
                ->where('status', 'pending')
                ->where('expires_at', '>', now())
                ->exists();

            if (!$exists) {
                return $code;
            }
        }

        // Fallback: use a longer random string (extremely unlikely to reach here)
        return strtoupper(Str::random(3)) . '-' . strtoupper(Str::random(3));
    }
}
