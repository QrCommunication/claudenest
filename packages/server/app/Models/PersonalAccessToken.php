<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasVersion4Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;
use Illuminate\Support\Str;

class PersonalAccessToken extends SanctumPersonalAccessToken
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
        'name',
        'token',
        'abilities',
        'expires_at',
        'tokenable_type',
        'tokenable_id',
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

    // ==================== SCOPES ====================

    public function scopeForUser($query, string $userId)
    {
        return $query->where('tokenable_id', $userId)
                     ->where('tokenable_type', User::class);
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

    public function revoke(): bool
    {
        return $this->delete();
    }

    public static function findValidToken(string $token): ?self
    {
        $hash = hash('sha256', $token);
        return static::where('token', $hash)
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
            'tokenable_type' => User::class,
            'tokenable_id' => $userId,
            'name' => $name,
            'token' => $hash,
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
