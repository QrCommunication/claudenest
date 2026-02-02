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
        Schema::create('shared_tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')
                ->constrained('shared_projects')
                ->onDelete('cascade');

            // Task Info
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('priority', 20)->default('medium');
            $table->string('status', 20)->default('pending');

            // Assignment
            $table->string('assigned_to')->nullable();
            $table->timestamp('claimed_at')->nullable();

            // Dependencies
            $table->uuid('dependencies')->nullable(); // Array of task IDs
            $table->string('blocked_by')->nullable();

            // Scope
            $table->text('files')->nullable(); // Array of file paths
            $table->integer('estimated_tokens')->nullable();

            // Completion
            $table->timestamp('completed_at')->nullable();
            $table->text('completion_summary')->nullable();
            $table->text('files_modified')->nullable(); // Array of file paths

            // Metadata
            $table->string('created_by')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('project_id');
            $table->index('status');
            $table->index('assigned_to');
            $table->index('priority');
            $table->index('created_at');
        });

        // Add check constraint for priority
        DB::statement("
            ALTER TABLE shared_tasks 
            ADD CONSTRAINT chk_shared_tasks_priority 
            CHECK (priority IN ('low', 'medium', 'high', 'critical'))
        ");

        // Add check constraint for status
        DB::statement("
            ALTER TABLE shared_tasks 
            ADD CONSTRAINT chk_shared_tasks_status 
            CHECK (status IN ('pending', 'in_progress', 'blocked', 'review', 'done'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shared_tasks');
    }
};
