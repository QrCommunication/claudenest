<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->dropUnique('skills_path_unique');
            $table->unique(['machine_id', 'path'], 'skills_machine_path_unique');
        });
    }

    public function down(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->dropUnique('skills_machine_path_unique');
            $table->unique('path', 'skills_path_unique');
        });
    }
};
