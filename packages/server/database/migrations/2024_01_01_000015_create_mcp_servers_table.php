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
        Schema::create('mcp_servers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('machine_id')
                ->constrained()
                ->onDelete('cascade');
            $table->string('name');
            $table->string('display_name')->nullable();
            $table->text('description')->nullable();
            $table->string('status', 50)->default('stopped');
            $table->string('transport', 50)->default('stdio');
            $table->text('command')->nullable();
            $table->text('url')->nullable();
            $table->jsonb('env_vars')->nullable();
            $table->jsonb('tools')->default('[]');
            $table->jsonb('config')->default('{}');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('stopped_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            // Unique constraint for machine + name
            $table->unique(['machine_id', 'name']);

            // Indexes
            $table->index('machine_id');
            $table->index('status');
            $table->index('transport');
        });

        // Add check constraint for status
        DB::statement("
            ALTER TABLE mcp_servers 
            ADD CONSTRAINT chk_mcp_servers_status 
            CHECK (status IN ('running', 'stopped', 'error', 'starting', 'stopping'))
        ");

        // Add check constraint for transport
        DB::statement("
            ALTER TABLE mcp_servers 
            ADD CONSTRAINT chk_mcp_servers_transport 
            CHECK (transport IN ('stdio', 'sse', 'http', 'websocket'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mcp_servers');
    }
};
