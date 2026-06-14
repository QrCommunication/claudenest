<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Store the account-level OAuth metadata (scopes, subscriptionType,
 * rateLimitTier) captured from ~/.claude/.credentials.json. Without the full
 * scopes — crucially `user:sessions:claude_code` — and subscriptionType,
 * Claude Code rejects an otherwise-valid token and prompts "/login".
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('claude_credentials', 'oauth_meta')) {
            Schema::table('claude_credentials', function (Blueprint $table) {
                $table->jsonb('oauth_meta')->nullable()->after('expires_at');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('claude_credentials', 'oauth_meta')) {
            Schema::table('claude_credentials', function (Blueprint $table) {
                $table->dropColumn('oauth_meta');
            });
        }
    }
};
