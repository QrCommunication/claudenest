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
        Schema::create('discovered_commands', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('machine_id')
                ->constrained()
                ->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category', 100)->default('general');
            $table->jsonb('parameters')->default('[]');
            $table->jsonb('aliases')->nullable();
            $table->jsonb('examples')->nullable();
            $table->string('skill_path')->nullable();
            $table->timestamp('discovered_at')->nullable();
            $table->timestamps();

            // Unique constraint for machine + name
            $table->unique(['machine_id', 'name']);

            // Indexes
            $table->index('machine_id');
            $table->index('category');
            $table->index('skill_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discovered_commands');
    }
};
