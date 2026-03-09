<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('claude_sessions', function (Blueprint $table) {
            $table->foreignUuid('credential_id')->nullable()->constrained('claude_credentials')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('claude_sessions', function (Blueprint $table) {
            $table->dropForeign(['credential_id']);
            $table->dropColumn('credential_id');
        });
    }
};
