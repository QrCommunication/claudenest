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
        Schema::create('machines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')
                ->constrained()
                ->onDelete('cascade');
            $table->string('name');
            $table->string('token_hash');
            $table->string('platform', 50);
            $table->string('hostname')->nullable();
            $table->string('arch', 50)->nullable();
            $table->string('node_version', 50)->nullable();
            $table->string('agent_version', 50)->nullable();
            $table->string('claude_version', 50)->nullable();
            $table->string('claude_path', 512)->nullable();
            $table->string('status', 50)->default('offline');
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('connected_at')->nullable();
            $table->jsonb('capabilities')->default('{}');
            $table->integer('max_sessions')->default(10);
            $table->timestamps();

            // Unique constraint
            $table->unique(['user_id', 'name']);

            // Indexes
            $table->index('user_id');
            $table->index('status');
            $table->index('created_at');
        });

        // Add check constraint for platform
        DB::statement("
            ALTER TABLE machines 
            ADD CONSTRAINT chk_machines_platform 
            CHECK (platform IN ('darwin', 'win32', 'linux'))
        ");

        // Add check constraint for status
        DB::statement("
            ALTER TABLE machines 
            ADD CONSTRAINT chk_machines_status 
            CHECK (status IN ('online', 'offline', 'connecting'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('machines');
    }
};
