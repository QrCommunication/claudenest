<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Advanced file locking — enrich `file_locks` to support shared/exclusive
 * locks, partial (line-range) locks, free-form metadata and a contention
 * queue.
 *
 *  - lock_type      : 'exclusive' (default, current behaviour) | 'shared'
 *  - line_range     : {"start": int, "end": int} for partial-file locks (null = whole file)
 *  - metadata       : free-form JSONB ('{}' default) for lock attributes
 *  - queue_position : nullable INTEGER — position in the contention queue
 *
 * Idempotent (hasColumn guards + CREATE INDEX IF NOT EXISTS + DROP CONSTRAINT
 * IF EXISTS) so it survives migrate:fresh re-runs and partial-deploy replays.
 *
 * NOTE: the existing `unique(project_id, path)` constraint still allows only
 * one row per path. Supporting concurrent shared locks / overlapping line
 * ranges requires relaxing that unique — that is owned by the sibling
 * "Model FileLock: locks avancés" task, intentionally NOT touched here.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql' || ! Schema::hasTable('file_locks')) {
            return;
        }

        Schema::table('file_locks', function (Blueprint $table) {
            if (! Schema::hasColumn('file_locks', 'lock_type')) {
                $table->string('lock_type', 20)->default('exclusive')->after('locked_by');
            }
            if (! Schema::hasColumn('file_locks', 'line_range')) {
                $table->jsonb('line_range')->nullable()->after('reason');
            }
            if (! Schema::hasColumn('file_locks', 'metadata')) {
                $table->jsonb('metadata')->default('{}')->after('line_range');
            }
            if (! Schema::hasColumn('file_locks', 'queue_position')) {
                $table->integer('queue_position')->nullable()->after('metadata');
            }
        });

        // Indexes (idempotent — PG supports IF NOT EXISTS).
        DB::statement('CREATE INDEX IF NOT EXISTS idx_file_locks_lock_type ON file_locks (lock_type)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_file_locks_queue_position ON file_locks (queue_position)');

        // Constrain lock_type to the known modes (idempotent rebuild).
        DB::statement('ALTER TABLE file_locks DROP CONSTRAINT IF EXISTS chk_file_locks_lock_type');
        DB::statement(<<<'SQL'
            ALTER TABLE file_locks
            ADD CONSTRAINT chk_file_locks_lock_type
            CHECK (lock_type IN ('exclusive', 'shared'))
        SQL);
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql' || ! Schema::hasTable('file_locks')) {
            return;
        }

        DB::statement('ALTER TABLE file_locks DROP CONSTRAINT IF EXISTS chk_file_locks_lock_type');
        DB::statement('DROP INDEX IF EXISTS idx_file_locks_lock_type');
        DB::statement('DROP INDEX IF EXISTS idx_file_locks_queue_position');

        Schema::table('file_locks', function (Blueprint $table) {
            foreach (['queue_position', 'metadata', 'line_range', 'lock_type'] as $column) {
                if (Schema::hasColumn('file_locks', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
