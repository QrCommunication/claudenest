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
        Schema::create('activity_log', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')
                ->constrained('shared_projects')
                ->onDelete('cascade');

            $table->string('instance_id')->nullable();
            $table->string('type', 50);
            $table->jsonb('details')->default('{}');

            $table->timestamp('created_at')->useCurrent();

            // Indexes
            $table->index('project_id');
            $table->index('instance_id');
            $table->index('type');
            $table->index('created_at');
            $table->index(['project_id', 'created_at']);
        });

        // Add check constraint for type
        DB::statement("
            ALTER TABLE activity_log 
            ADD CONSTRAINT chk_activity_log_type 
            CHECK (type IN ('task_claimed', 'task_completed', 'context_updated', 'file_locked', 'file_unlocked', 'broadcast', 'conflict', 'instance_connected', 'instance_disconnected'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_log');
    }
};
