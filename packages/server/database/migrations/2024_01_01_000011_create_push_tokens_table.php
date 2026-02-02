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
        Schema::create('push_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')
                ->constrained()
                ->onDelete('cascade');
            $table->text('token');
            $table->string('platform', 20);
            $table->jsonb('device_info')->default('{}');
            $table->timestamp('last_used_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            // Indexes
            $table->index('user_id');
            $table->index('platform');
            $table->index('token');
        });

        // Add check constraint for platform
        DB::statement("
            ALTER TABLE push_tokens 
            ADD CONSTRAINT chk_push_tokens_platform 
            CHECK (platform IN ('ios', 'android'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('push_tokens');
    }
};
