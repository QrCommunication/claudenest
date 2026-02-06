<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasVersion4Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Machine extends Model
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
        'platform',
        'hostname',
        'arch',
        'node_version',
        'agent_version',
        'claude_version',
        'claude_path',
        'status',
        'last_seen_at',
        'connected_at',
        'capabilities',
        'max_sessions',
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
        'capabilities' => 'array',
        'last_seen_at' => 'datetime',
        'connected_at' => 'datetime',
        'max_sessions' => 'integer',
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

    public const PLATFORMS = ['darwin', 'win32', 'linux'];

    public const STATUSES = ['online', 'offline', 'connecting'];

    // ==================== RELATIONSHIPS ====================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }

    public function sharedProjects(): HasMany
    {
        return $this->hasMany(SharedProject::class);
    }

    public function claudeInstances(): HasMany
    {
        return $this->hasMany(ClaudeInstance::class);
    }

    public function skills(): HasMany
    {
        return $this->hasMany(Skill::class);
    }

    public function mcpServers(): HasMany
    {
        return $this->hasMany(MCPServer::class);
    }

    public function discoveredCommands(): HasMany
    {
        return $this->hasMany(DiscoveredCommand::class);
    }

    // ==================== SCOPES ====================

    public function scopeOnline($query)
    {
        return $query->where('status', 'online');
    }

    public function scopeOffline($query)
    {
        return $query->where('status', 'offline');
    }

    public function scopeForUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByName($query, string $name)
    {
        return $query->where('name', $name);
    }

    // ==================== ACCESSORS ====================

    public function getIsOnlineAttribute(): bool
    {
        return $this->status === 'online';
    }

    public function getActiveSessionsCountAttribute(): int
    {
        return $this->sessions()->whereIn('status', ['running', 'waiting_input'])->count();
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->name ?: $this->hostname ?: 'Unknown Machine';
    }

    // ==================== HELPERS ====================

    public function markAsOnline(): void
    {
        $this->update([
            'status' => 'online',
            'connected_at' => now(),
            'last_seen_at' => now(),
        ]);
    }

    public function markAsOffline(): void
    {
        $this->update([
            'status' => 'offline',
        ]);

        // Mark all instances as disconnected
        $this->claudeInstances()
            ->whereNull('disconnected_at')
            ->update(['disconnected_at' => now()]);
    }

    public function updateLastSeen(): void
    {
        $this->update(['last_seen_at' => now()]);
    }

    public function hasCapability(string $capability): bool
    {
        return in_array($capability, $this->capabilities ?? []);
    }

    public function canAcceptMoreSessions(): bool
    {
        return $this->active_sessions_count < $this->max_sessions;
    }

    public function generateToken(): string
    {
        $token = 'mn_' . Str::random(32);
        $this->update(['token_hash' => hash('sha256', $token)]);
        return $token;
    }

    public function verifyToken(string $token): bool
    {
        return hash_equals($this->token_hash, hash('sha256', $token));
    }
}
