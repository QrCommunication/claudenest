<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Epic-level pull request tracking.
 *
 * When an epic reaches 100% it can be finalized (EpicFinalizeService dispatches
 * `epic:finalize` to the agent host → git branch + commit + push + gh pr create),
 * and the epic closes when that PR merges. These columns persist the PR so the
 * board can surface its state and the "close on PR" flow can drive the epic
 * status. Canonical contract (mirrored by EpicResource, the Epic model and the
 * TS Epic type):
 *
 *  - pr_url       : the opened pull request URL (null = not finalized yet)
 *  - pr_number    : the PR number on the host
 *  - pr_state     : open|merged|closed (null = no PR yet)
 *  - pr_branch    : the branch pushed for the PR
 *  - finalized_at : when the epic was finalized (PR dispatch requested)
 *
 * Idempotent (hasColumn / DROP-then-ADD CHECK guards) and reversible.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('epics', 'pr_url')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->string('pr_url', 1024)->nullable()->after('decomposed_at');
            });
        }

        if (! Schema::hasColumn('epics', 'pr_number')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->integer('pr_number')->nullable()->after('pr_url');
            });
        }

        if (! Schema::hasColumn('epics', 'pr_state')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->string('pr_state', 20)->nullable()->after('pr_number');
            });
        }

        if (! Schema::hasColumn('epics', 'pr_branch')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->string('pr_branch', 255)->nullable()->after('pr_state');
            });
        }

        if (! Schema::hasColumn('epics', 'finalized_at')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->timestamp('finalized_at')->nullable()->after('pr_branch');
            });
        }

        // Idempotent CHECK (PostgreSQL has no ADD CONSTRAINT IF NOT EXISTS).
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE epics DROP CONSTRAINT IF EXISTS chk_epics_pr_state');
            DB::statement(<<<'SQL'
                ALTER TABLE epics
                ADD CONSTRAINT chk_epics_pr_state
                CHECK (pr_state IS NULL OR pr_state IN ('open', 'merged', 'closed'))
            SQL);
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE epics DROP CONSTRAINT IF EXISTS chk_epics_pr_state');
        }

        Schema::table('epics', function (Blueprint $table) {
            foreach (['pr_url', 'pr_number', 'pr_state', 'pr_branch', 'finalized_at'] as $column) {
                if (Schema::hasColumn('epics', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
