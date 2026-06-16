<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-session input/output token accounting on claude_sessions.
 *
 * `total_tokens` already exists but conflates the two; pricing differs sharply
 * between input and output (and is what the project budget/cost UI needs), so
 * the agent token parser reports them split. Defaulted to 0 (non-negative,
 * clean SUM for budget aggregation) with bigint headroom for cache-heavy runs.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('claude_sessions', 'input_tokens')) {
            Schema::table('claude_sessions', function (Blueprint $table) {
                $table->unsignedBigInteger('input_tokens')->default(0)->after('total_tokens');
            });
        }

        if (! Schema::hasColumn('claude_sessions', 'output_tokens')) {
            Schema::table('claude_sessions', function (Blueprint $table) {
                $table->unsignedBigInteger('output_tokens')->default(0)->after('input_tokens');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('claude_sessions', function (Blueprint $table) {
            if (Schema::hasColumn('claude_sessions', 'input_tokens')) {
                $table->dropColumn('input_tokens');
            }
            if (Schema::hasColumn('claude_sessions', 'output_tokens')) {
                $table->dropColumn('output_tokens');
            }
        });
    }
};
