<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Project creation now seeds the RAG store with one chunk per AI-generated
     * context section (architecture, conventions, current_focus), but the
     * chk_context_chunks_type CHECK constraint only allowed the original six
     * values, so every seed insert would throw a 23514 check violation. Add
     * the new section types to the allowed set (mirrors ContextChunk::TYPES).
     */
    private array $types = [
        'task_completion',
        'context_update',
        'file_change',
        'decision',
        'summary',
        'broadcast',
        'architecture',
        'conventions',
        'current_focus',
    ];

    private array $added = ['architecture', 'conventions', 'current_focus'];

    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql' || ! Schema::hasTable('context_chunks')) {
            return;
        }

        $list = "'" . implode("','", $this->types) . "'";
        DB::statement('ALTER TABLE context_chunks DROP CONSTRAINT IF EXISTS chk_context_chunks_type');
        DB::statement("ALTER TABLE context_chunks ADD CONSTRAINT chk_context_chunks_type CHECK (type IN ({$list}))");
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql' || ! Schema::hasTable('context_chunks')) {
            return;
        }

        // Rows using the new types would violate the restored constraint.
        DB::table('context_chunks')->whereIn('type', $this->added)->delete();

        $without = array_values(array_diff($this->types, $this->added));
        $list = "'" . implode("','", $without) . "'";
        DB::statement('ALTER TABLE context_chunks DROP CONSTRAINT IF EXISTS chk_context_chunks_type');
        DB::statement("ALTER TABLE context_chunks ADD CONSTRAINT chk_context_chunks_type CHECK (type IN ({$list}))");
    }
};
