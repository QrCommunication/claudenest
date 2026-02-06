<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasVersion4Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PersonalAccessToken extends Model
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
        'user_id',
        'name',
        'token_hash',
        'abilities',
        'last_used_at',
        'expires_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'token_hash',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'abilities' => 'array',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
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

    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });
    }

    public function scopeExpired($query)
    {
        return $query->whereNotNull('expires_at')
                     ->where('expires_at', '<=', now());
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

    public function getHasAbilityWildcardAttribute(): bool
    {
        return in_array('*', $this->abilities ?? []);
    }

    // ==================== HELPERS ====================

    public function can(string $ability): bool
    {
        if ($this->has_ability_wildcard) {
            return true;
        }
        return in_array($ability, $this->abilities ?? []);
    }

    public function cant(string $ability): bool
    {
        return !$this->can($ability);
    }

    public function touchLastUsed(): void
    {
        $this->update(['last_used_at' => now()]);
    }

    public function revoke(): bool
    {
        return $this->delete();
    }

    public static function findValidToken(string $token): ?self
    {
        $hash = hash('sha256', $token);
        return static::where('token_hash', $hash)
            ->active()
            ->first();
    }

    public static function createForUser(
        string $userId,
        string $name,
        array $abilities = ['*'],
        ?int $expiresInDays = null
    ): array {
        $token = 'cn_' . Str::random(40);
        $hash = hash('sha256', $token);

        $model = static::create([
            'user_id' => $userId,
            'name' => $name,
            'token_hash' => $hash,
            'abilities' => $abilities,
            'expires_at' => $expiresInDays ? now()->addDays($expiresInDays) : null,
        ]);

        return [
            'model' => $model,
            'plainTextToken' => $token,
        ];
    }

    public static function cleanupExpired(): int
    {
        return static::expired()->delete();
    }
}
