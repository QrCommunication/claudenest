<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shared_tasks', function (Blueprint $table) {
            $table->integer('wave')->nullable()->after('project_id');
            $table->index('wave');
        });
    }

    public function down(): void
    {
        Schema::table('shared_tasks', function (Blueprint $table) {
            $table->dropIndex(['wave']);
            $table->dropColumn('wave');
        });
    }
};
