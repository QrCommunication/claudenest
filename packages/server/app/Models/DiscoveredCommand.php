<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasVersion4Uuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class DiscoveredCommand extends Model
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
    protected $table = 'discovered_commands';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'machine_id',
        'name',
        'description',
        'category',
        'parameters',
        'aliases',
        'examples',
        'skill_path',
        'discovered_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'parameters' => 'array',
        'aliases' => 'array',
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
                $model->id = (string) Str::orderedUuid();
            }
            if (empty($model->discovered_at)) {
                $model->discovered_at = now();
            }
        });
    }

    // ==================== CONSTANTS ====================

    public const CATEGORIES = [
        'general',
        'git',
        'file',
        'search',
        'build',
        'test',
        'deploy',
        'docker',
        'npm',
        'composer',
    ];

    // ==================== RELATIONSHIPS ====================

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    // ==================== SCOPES ====================

    public function scopeForMachine($query, string $machineId)
    {
        return $query->where('machine_id', $machineId);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeBySkill($query, string $skillPath)
    {
        return $query->where('skill_path', $skillPath);
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhereJsonContains('aliases', $search);
        });
    }

    // ==================== ACCESSORS ====================

    public function getDisplayNameAttribute(): string
    {
        return $this->name;
    }

    public function getParametersCountAttribute(): int
    {
        return count($this->parameters ?? []);
    }

    public function getHasAliasesAttribute(): bool
    {
        return !empty($this->aliases);
    }

    public function getCategoryColorAttribute(): string
    {
        $colors = [
            'general' => 'gray',
            'git' => 'orange',
            'file' => 'blue',
            'search' => 'cyan',
            'build' => 'green',
            'test' => 'purple',
            'deploy' => 'red',
            'docker' => 'blue',
            'npm' => 'red',
            'composer' => 'yellow',
        ];

        return $colors[$this->category] ?? 'gray';
    }

    public function getSignatureAttribute(): string
    {
        $parts = [$this->name];

        foreach ($this->parameters ?? [] as $param) {
            $name = $param['name'] ?? 'arg';
            $required = $param['required'] ?? false;
            $parts[] = $required ? "<{$name}>" : "[{$name}]";
        }

        return implode(' ', $parts);
    }

    // ==================== HELPERS ====================

    public function hasParameter(string $name): bool
    {
        foreach ($this->parameters ?? [] as $param) {
            if (($param['name'] ?? '') === $name) {
                return true;
            }
        }
        return false;
    }

    public function getParameter(string $name): ?array
    {
        foreach ($this->parameters ?? [] as $param) {
            if (($param['name'] ?? '') === $name) {
                return $param;
            }
        }
        return null;
    }

    public function matchesAlias(string $alias): bool
    {
        return in_array($alias, $this->aliases ?? [], true);
    }

    public static function findByName(string $machineId, string $name): ?self
    {
        return static::forMachine($machineId)
            ->where('name', $name)
            ->first();
    }

    public static function findByAlias(string $machineId, string $alias): ?self
    {
        return static::forMachine($machineId)
            ->whereJsonContains('aliases', $alias)
            ->first();
    }
}
