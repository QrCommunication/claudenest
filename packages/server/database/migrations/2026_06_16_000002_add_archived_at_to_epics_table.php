<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Epic archiving (mirrors shared_projects): an epic can be archived (hidden from
 * the default-visible board) without deleting its tasks/sprints, then restored.
 *
 *  - archived_at  TIMESTAMP nullable — NULL = active, NOT NULL = archived.
 *
 * The Epic model already exposes `scopeActive`/`scopeArchived`, the `is_archived`
 * accessor and `archive()`/`unarchive()` against this column — this migration
 * provides the backing column (without it those helpers fail at runtime).
 *
 * A composite index (project_id, archived_at) supports the per-project active vs
 * archived filtering. Idempotent (hasColumn / index guards) and reversible.
 */
return new class extends Migration
{
    private function indexExists(string $table, string $index): bool
    {
        foreach (Schema::getIndexes($table) as $existing) {
            if (($existing['name'] ?? null) === $index) {
                return true;
            }
        }

        return false;
    }

    public function up(): void
    {
        if (! Schema::hasColumn('epics', 'archived_at')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->timestamp('archived_at')->nullable()->after('completed_at');
            });
        }

        if (! $this->indexExists('epics', 'idx_epics_project_archived')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->index(['project_id', 'archived_at'], 'idx_epics_project_archived');
            });
        }
    }

    public function down(): void
    {
        if ($this->indexExists('epics', 'idx_epics_project_archived')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->dropIndex('idx_epics_project_archived');
            });
        }

        if (Schema::hasColumn('epics', 'archived_at')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->dropColumn('archived_at');
            });
        }
    }
};
