<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Claude Code sessions discovered on a machine (scanned, not agent-spawned).
     * Each row mirrors one transcript; a live row has a running claude process.
     */
    public function up(): void
    {
        Schema::create('discovered_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('machine_id')->constrained()->cascadeOnDelete();

            // Claude session UUID (= transcript filename). Unique per machine.
            $table->string('session_id');

            $table->string('project_slug');
            $table->string('cwd', 1024);
            $table->string('project_name');
            $table->string('transcript_path', 1024);

            $table->boolean('is_live')->default(false);
            $table->unsignedInteger('pid')->nullable();
            $table->string('tty')->nullable();

            $table->timestamp('started_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->text('last_preview')->nullable();

            $table->boolean('adopted')->default(false);
            $table->string('agent_session_id')->nullable();

            $table->timestamps();

            $table->unique(['machine_id', 'session_id']);
            $table->index(['machine_id', 'is_live']);
            $table->index('last_activity_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discovered_sessions');
    }
};
