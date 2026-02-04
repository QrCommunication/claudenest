<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Skill extends Model
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
    protected $table = 'skills';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'machine_id',
        'name',
        'display_name',
        'description',
        'category',
        'path',
        'version',
        'enabled',
        'config',
        'tags',
        'examples',
        'discovered_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'enabled' => 'boolean',
        'config' => 'array',
        'tags' => 'array',
        'examples' => 'array',
        'discovered_at' => 'datetime',
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
                $model->id = (string) Str::uuid();
            }
            if (empty($model->discovered_at)) {
                $model->discovered_at = now();
            }
        });
    }

    // ==================== CONSTANTS ====================

    public const CATEGORIES = [
        'auth',
        'browser',
        'command',
        'mcp',
        'search',
        'file',
        'git',
        'general',
        'api',
        'database',
    ];

    // ==================== RELATIONSHIPS ====================

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    // ==================== SCOPES ====================

    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }

    public function scopeDisabled($query)
    {
        return $query->where('enabled', false);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeForMachine($query, string $machineId)
    {
        return $query->where('machine_id', $machineId);
    }

    public function scopeByPath($query, string $path)
    {
        return $query->where('path', $path);
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('display_name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
        });
    }

    // ==================== ACCESSORS ====================

    public function getDisplayNameAttribute(): string
    {
        return $this->attributes['display_name'] ?? $this->name;
    }

    public function getCategoryColorAttribute(): string
    {
        $colors = [
            'auth' => 'purple',
            'browser' => 'blue',
            'command' => 'green',
            'mcp' => 'orange',
            'search' => 'cyan',
            'file' => 'yellow',
            'git' => 'red',
            'general' => 'gray',
            'api' => 'indigo',
            'database' => 'pink',
        ];

        return $colors[$this->category] ?? 'gray';
    }

    public function getHasConfigAttribute(): bool
    {
        return !empty($this->config) && count($this->config) > 0;
    }

    // ==================== HELPERS ====================

    public function enable(): void
    {
        $this->update(['enabled' => true]);
    }

    public function disable(): void
    {
        $this->update(['enabled' => false]);
    }

    public function toggle(): void
    {
        $this->update(['enabled' => !$this->enabled]);
    }

    public function updateConfig(array $config): void
    {
        $this->update(['config' => array_merge($this->config ?? [], $config)]);
    }

    public function setConfigValue(string $key, mixed $value): void
    {
        $config = $this->config ?? [];
        $config[$key] = $value;
        $this->update(['config' => $config]);
    }

    public function getConfigValue(string $key, mixed $default = null): mixed
    {
        return $this->config[$key] ?? $default;
    }

    public static function findByPath(string $path): ?self
    {
        return static::byPath($path)->first();
    }
}
