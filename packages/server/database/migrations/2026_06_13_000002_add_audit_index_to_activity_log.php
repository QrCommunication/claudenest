<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Index composite pour la piste d'audit consultable :
     *  - `(project_id, created_at)` existe déjà depuis la migration de création
     *    (2024_01_01_000009) — couvre la pagination chronologique par projet.
     *  - `(project_id, type, created_at)` est ajouté ici : il couvre le cas
     *    réel d'une piste d'audit FILTRÉE PAR TYPE et triée chrono
     *    (ex: n'afficher que les `conflict`/`task_completed` d'un projet),
     *    sans scanner l'index `(project_id, created_at)` puis filtrer le type
     *    en mémoire.
     *
     * Idempotent (garde indexExists) : la migration peut être rejouée sans
     * erreur "duplicate index".
     */
    public function up(): void
    {
        if (! Schema::hasTable('activity_log')) {
            return;
        }

        if (! $this->indexExists('activity_log', 'activity_log_project_id_type_created_at_index')) {
            Schema::table('activity_log', function (Blueprint $table) {
                $table->index(['project_id', 'type', 'created_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('activity_log')
            && $this->indexExists('activity_log', 'activity_log_project_id_type_created_at_index')) {
            Schema::table('activity_log', function (Blueprint $table) {
                $table->dropIndex(['project_id', 'type', 'created_at']);
            });
        }
    }

    /**
     * Vérifie l'existence d'un index (compatible PostgreSQL).
     */
    private function indexExists(string $table, string $index): bool
    {
        return collect(Schema::getIndexes($table))
            ->contains(fn (array $idx) => $idx['name'] === $index);
    }
};
