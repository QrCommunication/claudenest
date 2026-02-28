<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE claude_sessions DROP CONSTRAINT IF EXISTS chk_sessions_mode');
        DB::statement("
            ALTER TABLE claude_sessions
            ADD CONSTRAINT chk_sessions_mode
            CHECK (mode IN ('interactive', 'headless', 'oneshot', 'bash'))
        ");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE claude_sessions DROP CONSTRAINT IF EXISTS chk_sessions_mode');
        DB::statement("
            ALTER TABLE claude_sessions
            ADD CONSTRAINT chk_sessions_mode
            CHECK (mode IN ('interactive', 'headless', 'oneshot'))
        ");
    }
};
