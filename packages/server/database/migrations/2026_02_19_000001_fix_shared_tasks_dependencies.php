<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Convert dependencies from uuid to jsonb
        DB::statement('ALTER TABLE shared_tasks ALTER COLUMN dependencies TYPE jsonb USING COALESCE(to_jsonb(ARRAY[dependencies]::text[]), \'[]\'::jsonb)');
        DB::statement("ALTER TABLE shared_tasks ALTER COLUMN dependencies SET DEFAULT '[]'::jsonb");

        // Convert files and files_modified from text to jsonb if not already
        DB::statement("ALTER TABLE shared_tasks ALTER COLUMN files TYPE jsonb USING COALESCE(files::jsonb, '[]'::jsonb)");
        DB::statement("ALTER TABLE shared_tasks ALTER COLUMN files SET DEFAULT '[]'::jsonb");
        DB::statement("ALTER TABLE shared_tasks ALTER COLUMN files_modified TYPE jsonb USING COALESCE(files_modified::jsonb, '[]'::jsonb)");
        DB::statement("ALTER TABLE shared_tasks ALTER COLUMN files_modified SET DEFAULT '[]'::jsonb");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE shared_tasks ALTER COLUMN dependencies TYPE uuid USING NULL');
        DB::statement('ALTER TABLE shared_tasks ALTER COLUMN dependencies DROP DEFAULT');
    }
};
