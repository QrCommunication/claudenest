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
        if (!Schema::hasTable('pairing_codes')) {
            Schema::create('pairing_codes', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('code', 10)->unique();
                $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignUuid('machine_id')->nullable()->constrained()->nullOnDelete();
                $table->string('machine_token')->nullable();
                $table->string('status', 20)->default('pending');
                $table->jsonb('agent_info')->nullable();
                $table->timestamp('expires_at');
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();

                $table->index(['code', 'status']);
                $table->index('expires_at');
                $table->index('status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pairing_codes');
    }
};
