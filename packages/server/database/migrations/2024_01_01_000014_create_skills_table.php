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
        Schema::create('skills', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('machine_id')
                ->constrained()
                ->onDelete('cascade');
            $table->string('name');
            $table->string('display_name')->nullable();
            $table->text('description')->nullable();
            $table->string('category', 100)->default('general');
            $table->string('path')->unique();
            $table->string('version', 50)->default('1.0.0');
            $table->boolean('enabled')->default(true);
            $table->jsonb('config')->default('{}');
            $table->jsonb('tags')->default('[]');
            $table->jsonb('examples')->nullable();
            $table->timestamp('discovered_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('machine_id');
            $table->index('category');
            $table->index('enabled');
            $table->index('path');
            $table->index(['machine_id', 'category']);
            $table->index(['machine_id', 'enabled']);
        });

        // Add check constraint for category
        DB::statement("
            ALTER TABLE skills 
            ADD CONSTRAINT chk_skills_category 
            CHECK (category IN ('auth', 'browser', 'command', 'mcp', 'search', 'file', 'git', 'general', 'api', 'database'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('skills');
    }
};
