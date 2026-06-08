<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * SharedTask::release() logs a 'task_released' activity, but the
     * chk_activity_log_type CHECK constraint did not allow that value, so every
     * task release threw a 23514 check violation. Add it to the allowed set.
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

        $without = array_values(array_diff($this->types, ['task_released']));
        $list = "'" . implode("','", $without) . "'";
        DB::statement('ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS chk_activity_log_type');
        DB::statement("ALTER TABLE activity_log ADD CONSTRAINT chk_activity_log_type CHECK (type IN ({$list}))");
    }
};
