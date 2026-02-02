<?php

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
        Schema::create('claude_instances', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignUuid('project_id')
                ->constrained('shared_projects')
                ->onDelete('cascade');
            $table->foreignUuid('session_id')
                ->nullable()
                ->constrained('claude_sessions')
                ->onDelete('set null');
            $table->foreignUuid('machine_id')
                ->constrained()
                ->onDelete('cascade');

            // State
            $table->string('status', 20)->default('active');
            $table->foreignUuid('current_task_id')
                ->nullable()
                ->constrained('shared_tasks')
                ->onDelete('set null');

            // Context Usage
            $table->integer('context_tokens')->default(0);
            $table->integer('max_context_tokens')->default(8000);

            // Tracking
            $table->integer('tasks_completed')->default(0);
            $table->timestamp('connected_at')->useCurrent();
            $table->timestamp('last_activity_at')->useCurrent();
            $table->timestamp('disconnected_at')->nullable();

            // Indexes
            $table->index('project_id');
            $table->index('session_id');
            $table->index('machine_id');
            $table->index('status');
            $table->index('current_task_id');
            $table->index('connected_at');
        });

        // Add check constraint for status
        DB::statement("
            ALTER TABLE claude_instances 
            ADD CONSTRAINT chk_claude_instances_status 
            CHECK (status IN ('active', 'idle', 'busy', 'disconnected'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claude_instances');
    }
};
