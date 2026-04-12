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
        Schema::create('epics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')
                ->constrained('shared_projects')
                ->onDelete('cascade');

            // Epic info
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('color', 7)->default('#a855f7');
            $table->string('icon', 50)->nullable();

            // State
            $table->string('status', 20)->default('open');
            $table->string('priority', 20)->default('medium');

            // Ordering
            $table->integer('sort_order')->default(0);

            // Timestamps
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('project_id');
            $table->index('status');
            $table->index(['project_id', 'sort_order']);
        });

        // Check constraint for status
        DB::statement("
            ALTER TABLE epics
            ADD CONSTRAINT chk_epics_status
            CHECK (status IN ('open', 'in_progress', 'done'))
        ");

        // Check constraint for priority
        DB::statement("
            ALTER TABLE epics
            ADD CONSTRAINT chk_epics_priority
            CHECK (priority IN ('low', 'medium', 'high', 'critical'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('epics');
    }
};
