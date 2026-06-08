<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * MachineController@store creates the machine first, then calls
     * generateToken() (an UPDATE) to set token_hash. That two-step flow needs
     * token_hash to be nullable at insert time; the original migration made it
     * NOT NULL, so every POST /api/machines failed with a 23502 violation.
     */
    public function up(): void
    {
        if (Schema::hasColumn('machines', 'token_hash')) {
            Schema::table('machines', function (Blueprint $table) {
                $table->string('token_hash')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('machines', 'token_hash')) {
            Schema::table('machines', function (Blueprint $table) {
                $table->string('token_hash')->nullable(false)->change();
            });
        }
    }
};
