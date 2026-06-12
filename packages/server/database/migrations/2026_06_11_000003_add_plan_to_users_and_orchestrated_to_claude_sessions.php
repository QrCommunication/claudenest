<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Server-driven orchestration runtime:
     * - users.plan drives the concurrent agent cap (config claudenest.plans)
     * - claude_sessions.orchestrated flags worker sessions spawned by the
     *   WorkerPoolService (vs. human-created sessions).
     */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'plan')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('plan', 50)->default('community');
            });
        }

        if (! Schema::hasColumn('claude_sessions', 'orchestrated')) {
            Schema::table('claude_sessions', function (Blueprint $table) {
                $table->boolean('orchestrated')->default(false);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('claude_sessions', 'orchestrated')) {
            Schema::table('claude_sessions', function (Blueprint $table) {
                $table->dropColumn('orchestrated');
            });
        }

        if (Schema::hasColumn('users', 'plan')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('plan');
            });
        }
    }
};
