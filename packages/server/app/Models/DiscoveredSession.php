<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * A Claude Code session discovered on a machine (scanned, not agent-spawned).
 *
 * The session IS its transcript; a live row corresponds to a running `claude`
 * process. Rows are upserted from the agent's periodic discovery push.
 */
class DiscoveredSession extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'machine_id',
        'session_id',
        'project_slug',
        'cwd',
        'project_name',
        'transcript_path',
        'is_live',
        'pid',
        'tty',
        'started_at',
        'last_activity_at',
        'size_bytes',
        'last_preview',
        'adopted',
        'agent_session_id',
    ];

    protected $casts = [
        'is_live' => 'boolean',
        'adopted' => 'boolean',
        'pid' => 'integer',
        'size_bytes' => 'integer',
        'started_at' => 'datetime',
        'last_activity_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

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

    public function scopeLive($query)
    {
        return $query->where('is_live', true);
    }
}
