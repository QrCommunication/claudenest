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
        Schema::create('context_chunks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')
                ->constrained('shared_projects')
                ->onDelete('cascade');

            // Content
            $table->text('content');
            $table->string('type', 50);

            // Vector Embedding (384 dimensions for bge-small-en)
            $table->vector('embedding', 384)->nullable();

            // Metadata
            $table->string('instance_id')->nullable();
            $table->uuid('task_id')->nullable();
            $table->text('files')->nullable(); // PostgreSQL array
            $table->float('importance_score')->default(0.5);

            // Timestamps
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            // Indexes
            $table->index('project_id');
            $table->index('created_at');
            $table->index('type');
            $table->index('task_id');
            $table->index('expires_at');
        });

        // Add check constraint for type
        DB::statement("
            ALTER TABLE context_chunks 
            ADD CONSTRAINT chk_context_chunks_type 
            CHECK (type IN ('task_completion', 'context_update', 'file_change', 'decision', 'summary', 'broadcast'))
        ");

        // Add check constraint for importance_score
        DB::statement("
            ALTER TABLE context_chunks 
            ADD CONSTRAINT chk_context_chunks_importance 
            CHECK (importance_score >= 0 AND importance_score <= 1)
        ");

        // Create vector index for fast similarity search
        DB::statement("
            CREATE INDEX idx_context_chunks_embedding ON context_chunks 
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100)
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('context_chunks');
    }
};
