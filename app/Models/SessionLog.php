<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionLog extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'session_logs';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'session_id',
        'type',
        'data',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = false;

    // ==================== CONSTANTS ====================

    public const TYPES = ['output', 'input', 'status', 'error'];

    // ==================== RELATIONSHIPS ====================

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    // ==================== SCOPES ====================

    public function scopeOutput($query)
    {
        return $query->where('type', 'output');
    }

    public function scopeInput($query)
    {
        return $query->where('type', 'input');
    }

    public function scopeForSession($query, string $sessionId)
    {
        return $query->where('session_id', $sessionId);
    }

    public function scopeSince($query, $timestamp)
    {
        return $query->where('created_at', '>=', $timestamp);
    }
}
