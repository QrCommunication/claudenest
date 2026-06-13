<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Project archiving (free-unlimited pivot): a project can be archived (hidden
 * from the active sidebar list) without deleting any data, then recovered.
 *
 *  - archived_at      TIMESTAMP nullable — NULL = active, NOT NULL = archived.
 *  - archived_context JSON/JSONB nullable — snapshot of the context fields
 *    (summary/architecture/conventions/current_focus/recent_changes) restored
 *    on unarchive()/recover().
 *  - composite index (user_id, archived_at) to filter active vs archived per user.
 *
 * Idempotent (hasColumn guards) and reversible.
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
        Schema::table('shared_projects', function (Blueprint $table) {
            if (! Schema::hasColumn('shared_projects', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('settings');
            }
            if (! Schema::hasColumn('shared_projects', 'archived_context')) {
                $table->jsonb('archived_context')->nullable()->after('archived_at');
            }
        });

        if (! $this->indexExists('shared_projects', 'idx_shared_projects_user_archived')) {
            Schema::table('shared_projects', function (Blueprint $table) {
                $table->index(['user_id', 'archived_at'], 'idx_shared_projects_user_archived');
            });
        }
    }

    public function down(): void
    {
        if ($this->indexExists('shared_projects', 'idx_shared_projects_user_archived')) {
            Schema::table('shared_projects', function (Blueprint $table) {
                $table->dropIndex('idx_shared_projects_user_archived');
            });
        }

        Schema::table('shared_projects', function (Blueprint $table) {
            foreach (['archived_context', 'archived_at'] as $column) {
                if (Schema::hasColumn('shared_projects', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
