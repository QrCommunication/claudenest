<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('shared_projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')
                ->constrained()
                ->onDelete('cascade');
            $table->foreignUuid('machine_id')
                ->constrained()
                ->onDelete('cascade');
            $table->string('name');
            $table->string('project_path', 1024);

            // Structured Context
            $table->text('summary')->default('');
            $table->text('architecture')->default('');
            $table->text('conventions')->default('');
            $table->text('current_focus')->default('');
            $table->text('recent_changes')->default('');

            // Token Management
            $table->integer('total_tokens')->default(0);
            $table->integer('max_tokens')->default(8000);

            // Settings
            $table->jsonb('settings')->default(json_encode([
                'maxContextTokens' => 8000,
                'summarizeThreshold' => 0.8,
                'contextRetentionDays' => 30,
                'taskTimeoutMinutes' => 60,
                'lockTimeoutMinutes' => 30,
                'broadcastLevel' => 'all',
            ]));

            $table->timestamps();

            // Unique constraint
            $table->unique(['machine_id', 'project_path']);

            // Indexes
            $table->index('user_id');
            $table->index('machine_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shared_projects');
    }
};
