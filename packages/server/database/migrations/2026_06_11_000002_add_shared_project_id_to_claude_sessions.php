<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('claude_sessions', 'shared_project_id')) {
            return;
        }

        Schema::table('claude_sessions', function (Blueprint $table) {
            $table->foreignUuid('shared_project_id')->nullable()->after('user_id')
                  ->constrained('shared_projects')->nullOnDelete();
            $table->index('shared_project_id');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('claude_sessions', 'shared_project_id')) {
            return;
        }

        Schema::table('claude_sessions', function (Blueprint $table) {
            $table->dropForeign(['shared_project_id']);
            $table->dropIndex(['shared_project_id']);
            $table->dropColumn('shared_project_id');
        });
    }
};
