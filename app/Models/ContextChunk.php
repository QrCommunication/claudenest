<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ContextChunk extends Model
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
    protected $table = 'context_chunks';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'content',
        'type',
        'embedding',
        'instance_id',
        'task_id',
        'files',
        'importance_score',
        'expires_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'files' => 'array',
        'importance_score' => 'float',
        'embedding' => 'array',
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
                $model->id = (string) Str::uuid();
            }
        });
    }

    // ==================== CONSTANTS ====================

    public const TYPES = [
        'task_completion',
        'context_update',
        'file_change',
        'decision',
        'summary',
        'broadcast',
    ];

    public const VECTOR_DIMENSION = 384;

    // ==================== RELATIONSHIPS ====================

    public function project(): BelongsTo
    {
        return $this->belongsTo(SharedProject::class, 'project_id');
    }

    // ==================== SCOPES ====================

    public function scopeForProject($query, string $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByInstance($query, string $instanceId)
    {
        return $query->where('instance_id', $instanceId);
    }

    public function scopeByTask($query, string $taskId)
    {
        return $query->where('task_id', $taskId);
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

    public function scopeHighImportance($query, float $threshold = 0.7)
    {
        return $query->where('importance_score', '>=', $threshold);
    }

    // ==================== VECTOR SEARCH ====================

    /**
     * Find similar chunks using cosine similarity.
     *
     * @param array $embedding The query embedding vector
     * @param int $limit Number of results
     * @param float|null $minSimilarity Minimum similarity threshold (0-1)
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function findSimilar(
        string $projectId,
        array $embedding,
        int $limit = 10,
        ?float $minSimilarity = null
    ) {
        $embeddingStr = '[' . implode(',', $embedding) . ']';

        $query = static::forProject($projectId)
            ->active()
            ->selectRaw("
                *,
                embedding <=> '{$embeddingStr}'::vector AS distance,
                1 - (embedding <=> '{$embeddingStr}'::vector) AS similarity
            ")
            ->orderBy('distance', 'asc')
            ->limit($limit);

        if ($minSimilarity !== null) {
            $query->having('similarity', '>=', $minSimilarity);
        }

        return $query->get();
    }

    /**
     * Search by text content with semantic similarity.
     */
    public static function semanticSearch(
        string $projectId,
        string $query,
        int $limit = 10
    ) {
        // Note: This requires external embedding service
        // For now, use text search as fallback
        return static::forProject($projectId)
            ->active()
            ->where('content', 'ILIKE', '%' . $query . '%')
            ->orderBy('importance_score', 'desc')
            ->limit($limit)
            ->get();
    }

    // ==================== HELPERS ====================

    public function setEmbedding(array $vector): void
    {
        // Ensure vector has correct dimension
        $vector = array_pad($vector, self::VECTOR_DIMENSION, 0.0);
        $vector = array_slice($vector, 0, self::VECTOR_DIMENSION);

        // Store as array, database handles conversion
        $this->update(['embedding' => $vector]);
    }

    public function getEmbeddingArray(): array
    {
        return $this->embedding ?? [];
    }

    public function markAsExpired(): void
    {
        $this->update(['expires_at' => now()]);
    }

    public function extendExpiration(int $days = 30): void
    {
        $this->update(['expires_at' => now()->addDays($days)]);
    }

    public function getTruncatedContent(int $length = 200): string
    {
        if (strlen($this->content) <= $length) {
            return $this->content;
        }
        return substr($this->content, 0, $length) . '...';
    }

    /**
     * Clean up expired chunks.
     */
    public static function cleanupExpired(): int
    {
        return static::expired()->delete();
    }

    /**
     * Create chunk with embedding from external service.
     */
    public static function createWithEmbedding(
        string $projectId,
        string $content,
        string $type,
        array $embedding,
        array $metadata = []
    ): self {
        $chunk = static::create([
            'project_id' => $projectId,
            'content' => $content,
            'type' => $type,
            'instance_id' => $metadata['instance_id'] ?? null,
            'task_id' => $metadata['task_id'] ?? null,
            'files' => $metadata['files'] ?? [],
            'importance_score' => $metadata['importance_score'] ?? 0.5,
            'expires_at' => $metadata['expires_at'] ?? now()->addDays(30),
        ]);

        $chunk->setEmbedding($embedding);

        return $chunk;
    }
}
