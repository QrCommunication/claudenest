<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Enable required PostgreSQL extensions
        DB::statement('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        DB::statement('CREATE EXTENSION IF NOT EXISTS "vector"');
        DB::statement('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP EXTENSION IF EXISTS "vector"');
        DB::statement('DROP EXTENSION IF EXISTS "pgcrypto"');
        DB::statement('DROP EXTENSION IF EXISTS "uuid-ossp"');
    }
};
