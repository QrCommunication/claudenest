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
        Schema::create('claude_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('machine_id')
                ->constrained()
                ->onDelete('cascade');
            $table->foreignUuid('user_id')
                ->constrained()
                ->onDelete('cascade');
            $table->string('mode', 50)->default('interactive');
            $table->string('project_path', 512)->nullable();
            $table->text('initial_prompt')->nullable();
            $table->string('status', 50)->default('created');
            $table->integer('pid')->nullable();
            $table->integer('exit_code')->nullable();
            $table->jsonb('pty_size')->default('{"cols": 120, "rows": 40}');
            $table->integer('total_tokens')->nullable();
            $table->decimal('total_cost', 10, 4)->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('machine_id');
            $table->index('user_id');
            $table->index('status');
            $table->index('created_at');
        });

        // Add check constraint for mode
        DB::statement("
            ALTER TABLE claude_sessions 
            ADD CONSTRAINT chk_sessions_mode 
            CHECK (mode IN ('interactive', 'headless', 'oneshot'))
        ");

        // Add check constraint for status
        DB::statement("
            ALTER TABLE claude_sessions 
            ADD CONSTRAINT chk_sessions_status 
            CHECK (status IN ('created', 'starting', 'running', 'waiting_input', 'completed', 'error', 'terminated'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claude_sessions');
    }
};
