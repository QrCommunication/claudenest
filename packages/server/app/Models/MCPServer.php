<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasVersion4Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class MCPServer extends Model
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
     * The table associated with the model.
     */
    protected $table = 'mcp_servers';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'machine_id',
        'name',
        'display_name',
        'description',
        'status',
        'transport',
        'command',
        'url',
        'env_vars',
        'tools',
        'config',
        'started_at',
        'stopped_at',
        'error_message',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'env_vars' => 'array',
        'tools' => 'array',
        'config' => 'array',
        'started_at' => 'datetime',
        'stopped_at' => 'datetime',
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

    public const STATUSES = ['running', 'stopped', 'error', 'starting', 'stopping'];

    public const TRANSPORTS = ['stdio', 'sse', 'http', 'websocket'];

    // ==================== RELATIONSHIPS ====================

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    // ==================== SCOPES ====================

    public function scopeRunning($query)
    {
        return $query->where('status', 'running');
    }

    public function scopeStopped($query)
    {
        return $query->where('status', 'stopped');
    }

    public function scopeWithErrors($query)
    {
        return $query->where('status', 'error');
    }

    public function scopeForMachine($query, string $machineId)
    {
        return $query->where('machine_id', $machineId);
    }

    public function scopeByTransport($query, string $transport)
    {
        return $query->where('transport', $transport);
    }

    // ==================== ACCESSORS ====================

    public function getDisplayNameAttribute(): string
    {
        return $this->attributes['display_name'] ?? $this->name;
    }

    public function getIsRunningAttribute(): bool
    {
        return $this->status === 'running';
    }

    public function getIsStoppedAttribute(): bool
    {
        return $this->status === 'stopped';
    }

    public function getHasErrorsAttribute(): bool
    {
        return $this->status === 'error';
    }

    public function getToolsCountAttribute(): int
    {
        return count($this->tools ?? []);
    }

    public function getUptimeAttribute(): ?string
    {
        if (!$this->is_running || !$this->started_at) {
            return null;
        }

        return $this->started_at->diffForHumans(now(), true);
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            'running' => 'green',
            'stopped' => 'gray',
            'error' => 'red',
            'starting' => 'yellow',
            'stopping' => 'orange',
            default => 'gray',
        };
    }

    // ==================== HELPERS ====================

    public function markAsRunning(): void
    {
        $this->update([
            'status' => 'running',
            'started_at' => now(),
            'stopped_at' => null,
            'error_message' => null,
        ]);
    }

    public function markAsStopped(): void
    {
        $this->update([
            'status' => 'stopped',
            'stopped_at' => now(),
        ]);
    }

    public function markAsError(string $message): void
    {
        $this->update([
            'status' => 'error',
            'error_message' => $message,
        ]);
    }

    public function markAsStarting(): void
    {
        $this->update(['status' => 'starting']);
    }

    public function markAsStopping(): void
    {
        $this->update(['status' => 'stopping']);
    }

    public function updateTools(array $tools): void
    {
        $this->update(['tools' => $tools]);
    }

    public function getToolByName(string $name): ?array
    {
        foreach ($this->tools ?? [] as $tool) {
            if (($tool['name'] ?? '') === $name) {
                return $tool;
            }
        }
        return null;
    }

    public function hasTool(string $name): bool
    {
        return $this->getToolByName($name) !== null;
    }

    public static function findByName(string $machineId, string $name): ?self
    {
        return static::forMachine($machineId)
            ->where('name', $name)
            ->first();
    }
}
