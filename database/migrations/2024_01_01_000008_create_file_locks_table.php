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
        Schema::create('file_locks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')
                ->constrained('shared_projects')
                ->onDelete('cascade');

            $table->string('path', 1024);
            $table->string('locked_by');
            $table->string('reason')->nullable();

            $table->timestamp('locked_at')->useCurrent();
            $table->timestamp('expires_at');

            // Unique constraint - only one lock per path per project
            $table->unique(['project_id', 'path']);

            // Indexes
            $table->index('project_id');
            $table->index('locked_by');
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('file_locks');
    }
};
