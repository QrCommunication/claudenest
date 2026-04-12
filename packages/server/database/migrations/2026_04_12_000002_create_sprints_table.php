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
        Schema::create('sprints', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')
                ->constrained('shared_projects')
                ->onDelete('cascade');

            // Sprint Info
            $table->string('name');
            $table->text('goal')->nullable();
            $table->string('status', 20)->default('planning');

            // Planning
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->integer('velocity')->nullable();
            $table->integer('capacity')->nullable();

            // Ordering
            $table->integer('sort_order')->default(0);

            $table->timestamps();

            // Indexes
            $table->index('project_id');
            $table->index('status');
            $table->index(['project_id', 'sort_order']);
        });

        // Add check constraint for status
        DB::statement("
            ALTER TABLE sprints
            ADD CONSTRAINT chk_sprints_status
            CHECK (status IN ('planning', 'active', 'completed', 'cancelled'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sprints');
    }
};
