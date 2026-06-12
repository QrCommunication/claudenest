<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The chk_activity_log_type CHECK constraint did not allow the planning /
     * runner agent activity types, so every PlanningController::execute and
     * RunnerController::autoUpdate logActivity() threw a latent 23514 check
     * violation (masked until those endpoints were exercised — same failure
     * mode as the 2026_06_08 'task_released' incident). Add them, plus the new
     * 'planning_session_created' type (planning agent session endpoint).
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

        $without = array_values(array_diff($this->types, [
            'planning_executed',
            'planning_session_created',
            'runner_auto_update',
        ]));
        $list = "'" . implode("','", $without) . "'";
        DB::statement('ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS chk_activity_log_type');
        DB::statement("ALTER TABLE activity_log ADD CONSTRAINT chk_activity_log_type CHECK (type IN ({$list}))");
    }
};
