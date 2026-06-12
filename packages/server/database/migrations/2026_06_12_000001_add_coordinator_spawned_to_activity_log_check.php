<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * CoordinatorService::spawnCoordinator logs a 'coordinator_spawned'
     * activity entry; the chk_activity_log_type CHECK constraint must allow
     * it or every coordinator spawn throws a 23514 check violation (same
     * failure mode as the 2026_06_08 'task_released' and 2026_06_11
     * planning/runner incidents). Rebuild the constraint with the full list.
     */
    private array $types = [
        'task_claimed',
        'task_released',
        'task_completed',
        'context_updated',
        'file_locked',
        'file_unlocked',
        'broadcast',
        'conflict',
        'instance_connected',
        'instance_disconnected',
        'planning_executed',
        'planning_session_created',
        'runner_auto_update',
        'coordinator_spawned',
    ];

    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql' || ! Schema::hasTable('activity_log')) {
            return;
        }

        $list = "'" . implode("','", $this->types) . "'";
        DB::statement('ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS chk_activity_log_type');
        DB::statement("ALTER TABLE activity_log ADD CONSTRAINT chk_activity_log_type CHECK (type IN ({$list}))");
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql' || ! Schema::hasTable('activity_log')) {
            return;
        }

        $without = array_values(array_diff($this->types, ['coordinator_spawned']));
        $list = "'" . implode("','", $without) . "'";
        DB::statement('ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS chk_activity_log_type');
        DB::statement("ALTER TABLE activity_log ADD CONSTRAINT chk_activity_log_type CHECK (type IN ({$list}))");
    }
};
