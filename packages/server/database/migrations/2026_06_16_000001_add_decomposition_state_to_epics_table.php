<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * AI decomposition state on epics.
 *
 * An epic can be (re)built from a PRD via an asynchronous Claude decomposition
 * session. These columns track that lifecycle so the dashboard can surface a
 * live badge and refresh sprints/tasks when the plan is applied.
 *
 * Canonical contract (mirrored by EpicResource, the Epic model casts/helpers
 * and the TS Epic type):
 *  - decomposition_status      : null = never decomposed; otherwise
 *                                idle|pending|running|ready|failed
 *  - decomposition_session_id  : FK to the spawned claude_sessions row
 *                                (nullOnDelete — the epic outlives the session)
 *  - decomposition_error       : human-readable reason when status = failed
 *  - decomposed_at             : when the plan was successfully applied (ready)
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('epics', 'decomposition_status')) {
            Schema::table('epics', function (Blueprint $table) {
                // null = never decomposed (the implicit "idle" state).
                $table->string('decomposition_status', 20)->nullable()->after('priority');
            });
        }

        if (! Schema::hasColumn('epics', 'decomposition_session_id')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->foreignUuid('decomposition_session_id')
                    ->nullable()
                    ->after('decomposition_status')
                    ->constrained('claude_sessions')
                    ->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('epics', 'decomposition_error')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->text('decomposition_error')->nullable()->after('decomposition_session_id');
            });
        }

        if (! Schema::hasColumn('epics', 'decomposed_at')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->timestamp('decomposed_at')->nullable()->after('completed_at');
            });
        }

        if (! Schema::hasColumn('epics', 'decomposition_started_at')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->timestamp('decomposition_started_at')->nullable()->after('decomposition_error');
            });
        }

        if (! Schema::hasColumn('epics', 'decomposition_completed_at')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->timestamp('decomposition_completed_at')->nullable()->after('decomposition_started_at');
            });
        }

        if (! $this->hasIndex('epics', 'epics_decomposition_status_index')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->index('decomposition_status');
            });
        }

        // Idempotent CHECK: PostgreSQL has no ADD CONSTRAINT IF NOT EXISTS, so
        // drop-then-add keeps the migration re-runnable (RefreshDatabase / re-run).
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE epics DROP CONSTRAINT IF EXISTS chk_epics_decomposition_status');
            DB::statement(<<<'SQL'
                ALTER TABLE epics
                ADD CONSTRAINT chk_epics_decomposition_status
                CHECK (
                    decomposition_status IS NULL
                    OR decomposition_status IN ('idle', 'pending', 'running', 'completed', 'failed')
                )
            SQL);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE epics DROP CONSTRAINT IF EXISTS chk_epics_decomposition_status');
        }

        if (Schema::hasColumn('epics', 'decomposition_session_id')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->dropConstrainedForeignId('decomposition_session_id');
            });
        }

        Schema::table('epics', function (Blueprint $table) {
            if (Schema::hasColumn('epics', 'decomposition_status')) {
                $table->dropColumn('decomposition_status');
            }
            if (Schema::hasColumn('epics', 'decomposition_error')) {
                $table->dropColumn('decomposition_error');
            }
            if (Schema::hasColumn('epics', 'decomposed_at')) {
                $table->dropColumn('decomposed_at');
            }
            if (Schema::hasColumn('epics', 'decomposition_started_at')) {
                $table->dropColumn('decomposition_started_at');
            }
            if (Schema::hasColumn('epics', 'decomposition_completed_at')) {
                $table->dropColumn('decomposition_completed_at');
            }
        });
    }

    /**
     * Whether the given index already exists (keeps the migration idempotent
     * across re-runs without relying on a DB-specific catalog query).
     */
    private function hasIndex(string $table, string $index): bool
    {
        return collect(
            Schema::getConnection()->getSchemaBuilder()->getIndexes($table)
        )->contains(fn ($i) => ($i['name'] ?? null) === $index);
    }
};
