<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fix personal_access_tokens table to match Sanctum v4 expected schema.
     *
     * Sanctum expects: tokenable_type, tokenable_id (polymorphic) and token column.
     * Current schema has: user_id and token_hash.
     */
    public function up(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            // Add polymorphic columns required by Sanctum
            $table->string('tokenable_type')->default('App\\Models\\User')->after('id');
            $table->uuid('tokenable_id')->nullable()->after('tokenable_type');

            // Rename token_hash to token (Sanctum expects 'token')
            $table->renameColumn('token_hash', 'token');
        });

        // Populate tokenable_id from user_id for existing rows
        DB::statement('UPDATE personal_access_tokens SET tokenable_id = user_id');

        // Make tokenable_id non-nullable now that it's populated
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->uuid('tokenable_id')->nullable(false)->change();
        });

        // Add Sanctum's expected index
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->index(['tokenable_type', 'tokenable_id'], 'personal_access_tokens_tokenable_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropIndex('personal_access_tokens_tokenable_index');
            $table->renameColumn('token', 'token_hash');
            $table->dropColumn(['tokenable_type', 'tokenable_id']);
        });
    }
};
