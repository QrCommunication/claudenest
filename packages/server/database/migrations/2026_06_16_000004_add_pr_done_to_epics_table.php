<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Epic-level "pull request done" flag.
 *
 * Distinct from `pr_state` (which mirrors the GitHub PR lifecycle open|merged|
 * closed): `pr_done` is the durable, terminal marker that THIS epic's pull
 * request has been merged and the epic's work is shipped. It drives two flows:
 *
 *  - the board hides the "Generate PR" button once an epic is pr_done (no point
 *    re-finalizing already-shipped work);
 *  - the epic-merge intent uses it (with the `previousSiblings` scope on the
 *    Epic model) to skip already-merged siblings when reconciling branches.
 *
 * Canonical contract (mirrored by EpicResource, the Epic model cast and the
 * TS Epic type): `pr_done : bool` (default false). Idempotent (hasColumn guard)
 * and reversible.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('epics', 'pr_done')) {
            Schema::table('epics', function (Blueprint $table) {
                $table->boolean('pr_done')->default(false)->after('finalized_at');
            });
        }
    }

    public function down(): void
    {
        Schema::table('epics', function (Blueprint $table) {
            if (Schema::hasColumn('epics', 'pr_done')) {
                $table->dropColumn('pr_done');
            }
        });
    }
};
