<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('shared_tasks', function (Blueprint $table) {
            // Self-referential parent/child hierarchy
            $table->foreignUuid('parent_id')
                ->nullable()
                ->constrained('shared_tasks')
                ->onDelete('set null')
                ->after('project_id');

            // Epic and sprint grouping
            $table->foreignUuid('epic_id')
                ->nullable()
                ->constrained('epics')
                ->onDelete('set null')
                ->after('parent_id');

            $table->foreignUuid('sprint_id')
                ->nullable()
                ->constrained('sprints')
                ->onDelete('set null')
                ->after('epic_id');

            // Planning fields
            $table->integer('story_points')->nullable()->after('estimated_tokens');
            $table->date('due_date')->nullable()->after('story_points');
            $table->integer('sort_order')->default(0)->after('due_date');
            $table->jsonb('labels')->default('[]')->after('sort_order');

            // Indexes
            $table->index('parent_id');
            $table->index('epic_id');
            $table->index('sprint_id');
            $table->index(['project_id', 'sort_order']);
            $table->index(['sprint_id', 'status']);
            $table->index(['epic_id', 'status']);
        });

        // Replace status check constraint to include 'backlog'
        DB::statement('ALTER TABLE shared_tasks DROP CONSTRAINT IF EXISTS chk_shared_tasks_status');
        DB::statement("
            ALTER TABLE shared_tasks
            ADD CONSTRAINT chk_shared_tasks_status
            CHECK (status IN ('backlog', 'pending', 'in_progress', 'blocked', 'review', 'done'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore original status constraint (without 'backlog')
        DB::statement('ALTER TABLE shared_tasks DROP CONSTRAINT IF EXISTS chk_shared_tasks_status');
        DB::statement("
            ALTER TABLE shared_tasks
            ADD CONSTRAINT chk_shared_tasks_status
            CHECK (status IN ('pending', 'in_progress', 'blocked', 'review', 'done'))
        ");

        Schema::table('shared_tasks', function (Blueprint $table) {
            $table->dropIndex(['project_id', 'sort_order']);
            $table->dropIndex(['sprint_id', 'status']);
            $table->dropIndex(['epic_id', 'status']);
            $table->dropIndex(['sprint_id']);
            $table->dropIndex(['epic_id']);
            $table->dropIndex(['parent_id']);

            $table->dropConstrainedForeignId('sprint_id');
            $table->dropConstrainedForeignId('epic_id');
            $table->dropConstrainedForeignId('parent_id');

            $table->dropColumn(['story_points', 'due_date', 'sort_order', 'labels']);
        });
    }
};
