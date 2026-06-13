<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Ajoute le support de l'archivage des projets partagés :
     *  - `archived_at`      : marqueur d'archivage (NULL = projet actif).
     *  - `archived_context` : snapshot JSON du contexte au moment de
     *    l'archivage (summary/architecture/conventions/current_focus/
     *    recent_changes) pour pouvoir restaurer un projet recover().
     *
     * Idempotent (gardes hasColumn) : la migration sœur peut ajouter
     * les mêmes colonnes — la première qui passe gagne, l'autre est no-op.
     */
    public function up(): void
    {
        Schema::table('shared_projects', function (Blueprint $table) {
            if (! Schema::hasColumn('shared_projects', 'archived_at')) {
                // after() est ignoré sur PostgreSQL — conservé pour cohérence.
                $table->timestamp('archived_at')->nullable()->after('settings');
            }

            if (! Schema::hasColumn('shared_projects', 'archived_context')) {
                $table->jsonb('archived_context')->nullable()->after('archived_at');
            }
        });

        // Index composite pour filtrer rapidement actifs (archived_at IS NULL)
        // vs archivés, scopé par utilisateur. Posé hors du closure pour
        // garantir que les colonnes existent (au cas où une migration sœur
        // les a déjà créées avant ce run).
        if (Schema::hasColumn('shared_projects', 'archived_at')
            && ! $this->indexExists('shared_projects', 'shared_projects_user_id_archived_at_index')) {
            Schema::table('shared_projects', function (Blueprint $table) {
                $table->index(['user_id', 'archived_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if ($this->indexExists('shared_projects', 'shared_projects_user_id_archived_at_index')) {
            Schema::table('shared_projects', function (Blueprint $table) {
                $table->dropIndex(['user_id', 'archived_at']);
            });
        }

        Schema::table('shared_projects', function (Blueprint $table) {
            $columns = array_values(array_filter(
                ['archived_context', 'archived_at'],
                fn (string $column) => Schema::hasColumn('shared_projects', $column)
            ));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
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
