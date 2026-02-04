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
        Schema::create('session_logs', function (Blueprint $table) {
            $table->id('id');
            $table->foreignUuid('session_id')
                ->constrained('claude_sessions')
                ->onDelete('cascade');
            $table->string('type', 50);
            $table->text('data');
            $table->jsonb('metadata')->default('{}');
            $table->timestamp('created_at')->useCurrent();

            // Indexes
            $table->index('session_id');
            $table->index('created_at');
            $table->index(['session_id', 'created_at']);
        });

        // Add check constraint for type
        DB::statement("
            ALTER TABLE session_logs 
            ADD CONSTRAINT chk_session_logs_type 
            CHECK (type IN ('output', 'input', 'status', 'error'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('session_logs');
    }
};
