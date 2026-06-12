<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasVersion4Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PushToken extends Model
{
    use HasFactory, HasVersion4Uuids;

    /**
     * The push_tokens table has no updated_at column.
     */
    public const UPDATED_AT = null;

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
        'user_id',
        'token',
        'platform',
        'device_info',
        'last_used_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'device_info' => 'array',
        'last_used_at' => 'datetime',
        'created_at' => 'datetime',
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

    public const PLATFORMS = ['ios', 'android'];

    // ==================== RELATIONSHIPS ====================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ==================== SCOPES ====================

    public function scopeForUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByPlatform($query, string $platform)
    {
        return $query->where('platform', $platform);
    }

    // ==================== HELPERS ====================

    public function touchLastUsed(): void
    {
        $this->update(['last_used_at' => now()]);
    }

    public static function register(
        string $userId,
        string $token,
        ?string $platform = null,
        array $deviceInfo = []
    ): self {
        // A device token belongs to at most one user: reassign on re-login.
        static::where('token', $token)
            ->where('user_id', '!=', $userId)
            ->delete();

        // Upsert by (user_id, token) — re-registering refreshes metadata.
        return static::updateOrCreate(
            [
                'user_id' => $userId,
                'token' => $token,
            ],
            [
                'platform' => $platform,
                'device_info' => $deviceInfo,
                'last_used_at' => now(),
            ],
        );
    }

    public static function unregister(string $token): bool
    {
        return static::where('token', $token)->delete() > 0;
    }
}
