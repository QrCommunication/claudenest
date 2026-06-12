<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The mobile push-token registration contract accepts an optional platform
 * ('ios'|'android'), but the original push_tokens table declared the column
 * NOT NULL. Make it nullable (additive, idempotent). The existing CHECK
 * constraint chk_push_tokens_platform is unaffected: in PostgreSQL a NULL
 * value evaluates a CHECK to UNKNOWN, which passes.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('push_tokens') || ! Schema::hasColumn('push_tokens', 'platform')) {
            return;
        }

        if (DB::connection()->getDriverName() === 'pgsql') {
            // Idempotent: DROP NOT NULL is a no-op when already nullable.
            DB::statement('ALTER TABLE push_tokens ALTER COLUMN platform DROP NOT NULL');

            return;
        }

        Schema::table('push_tokens', function (Blueprint $table) {
            $table->string('platform', 20)->nullable()->change();
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('push_tokens') || ! Schema::hasColumn('push_tokens', 'platform')) {
            return;
        }

        // Rows without a platform cannot satisfy NOT NULL; drop them (push
        // tokens are re-registered by clients on next app launch).
        DB::table('push_tokens')->whereNull('platform')->delete();

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE push_tokens ALTER COLUMN platform SET NOT NULL');

            return;
        }

        Schema::table('push_tokens', function (Blueprint $table) {
            $table->string('platform', 20)->nullable(false)->change();
        });
    }
};
