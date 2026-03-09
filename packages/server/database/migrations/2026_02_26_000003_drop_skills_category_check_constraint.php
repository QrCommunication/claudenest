<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Drop the restrictive category check constraint.
     * Skills discovered from ~/.claude/skills/ have free-form categories
     * (content, coding, design, etc.) that don't fit a fixed enum.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE skills DROP CONSTRAINT IF EXISTS chk_skills_category');
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        DB::statement("
            ALTER TABLE skills
            ADD CONSTRAINT chk_skills_category
            CHECK (category IN ('auth', 'browser', 'command', 'mcp', 'search', 'file', 'git', 'general', 'api', 'database'))
        ");
    }
};
