<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Free-unlimited pivot (2026-06-13): ClaudeNest no longer enforces any
     * plan cap. The users.plan column is kept for compat/rollback, but the
     * invariant is now "every user is unlimited".
     *
     * This migration:
     *   1. Backfills every non-'unlimited' user to 'unlimited'.
     *   2. Flips the column DEFAULT from 'community' to 'unlimited' so new
     *      signups do not silently re-break the invariant.
     *
     * Idempotent: re-running the UPDATE is a no-op once all rows are
     * 'unlimited', and SET DEFAULT to the same value is harmless.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'plan')) {
            return;
        }

        // 1. Backfill existing rows.
        DB::table('users')
            ->where('plan', '!=', 'unlimited')
            ->update(['plan' => 'unlimited']);

        // 2. Flip the column default (Laravel has no fluent change-default
        //    helper without doctrine/dbal — raw ALTER is the idiomatic PG move).
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE users ALTER COLUMN plan SET DEFAULT 'unlimited'");
        }
    }

    /**
     * Restore the previous default. Existing rows are intentionally NOT
     * downgraded — the up() backfill is destructive of the prior per-user
     * plan value (not recoverable), so down() only restores the schema default.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('users', 'plan')) {
            return;
        }

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE users ALTER COLUMN plan SET DEFAULT 'community'");
        }
    }
};
