<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('claude_credentials', function (Blueprint $table) {
            $table->string('key_hint', 50)->nullable()->after('refresh_token_enc');
            $table->unique(['user_id', 'name'], 'credentials_user_name_unique');
        });
    }

    public function down(): void
    {
        Schema::table('claude_credentials', function (Blueprint $table) {
            $table->dropUnique('credentials_user_name_unique');
            $table->dropColumn('key_hint');
        });
    }
};
