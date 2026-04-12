<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SharedProject;
use App\Services\RunnerAgentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RunnerController extends Controller
{
    public function __construct(
        private readonly RunnerAgentService $runnerService,
    ) {}

    /**
     * Rapport de santé complet d'un projet.
     */
    public function healthCheck(Request $request, SharedProject $project): JsonResponse
    {
        $this->authorize('view', $project);

        return response()->json([
            'success' => true,
            'data' => $this->runnerService->healthCheck($project),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Mise à jour automatique des statuts basée sur l'état réel.
     */
    public function autoUpdate(Request $request, SharedProject $project): JsonResponse
    {
        $this->authorize('update', $project);

        $updates = $this->runnerService->autoUpdateStatuses($project);

        if (count($updates) > 0) {
            $project->logActivity('runner_auto_update', null, [
                'updates_count' => count($updates),
                'updates' => $updates,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'updates' => $updates,
                'count' => count($updates),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Métriques de progression détaillées du projet.
     */
    public function progress(Request $request, SharedProject $project): JsonResponse
    {
        $this->authorize('view', $project);

        return response()->json([
            'success' => true,
            'data' => $this->runnerService->getProgressMetrics($project),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }
}
