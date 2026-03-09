<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shared_projects', function (Blueprint $table) {
            $table->text('prd')->nullable()->after('conventions');
            $table->jsonb('master_plan')->nullable()->after('prd');
        });
    }

    public function down(): void
    {
        Schema::table('shared_projects', function (Blueprint $table) {
            $table->dropColumn(['prd', 'master_plan']);
        });
    }
};
