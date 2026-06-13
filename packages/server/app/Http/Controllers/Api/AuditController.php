<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditResource;
use App\Models\ActivityLog;
use App\Models\SharedProject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

/**
 * Public audit trail.
 *
 * Exposes a project's activity_log as a paginated, filterable audit trail to
 * ANY authenticated user with access to the project (the `view` policy = project
 * ownership). There is intentionally NO role/plan gating: the audit trail is a
 * first-class feature for every user of the free-unlimited model.
 */
class AuditController extends Controller
{
    /** List the project audit trail (paginated, optional filters). */
    #[OA\Get(
        path: '/api/projects/{id}/audit',
        summary: 'List the project audit trail (paginated)',
        security: [['bearerAuth' => []]],
        tags: ['Audit'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'Project UUID',
                schema: new OA\Schema(type: 'string', format: 'uuid'),
            ),
            new OA\Parameter(
                name: 'type',
                in: 'query',
                required: false,
                description: 'Filter by activity type',
                schema: new OA\Schema(type: 'string'),
            ),
            new OA\Parameter(
                name: 'instance_id',
                in: 'query',
                required: false,
                description: 'Filter by acting instance',
                schema: new OA\Schema(type: 'string'),
            ),
            new OA\Parameter(
                name: 'from',
                in: 'query',
                required: false,
                description: 'Only entries on or after this date/time (inclusive)',
                schema: new OA\Schema(type: 'string', format: 'date-time'),
            ),
            new OA\Parameter(
                name: 'to',
                in: 'query',
                required: false,
                description: 'Only entries strictly before this date/time',
                schema: new OA\Schema(type: 'string', format: 'date-time'),
            ),
            new OA\Parameter(
                name: 'per_page',
                in: 'query',
                required: false,
                description: 'Items per page (1-100, default 25)',
                schema: new OA\Schema(type: 'integer', default: 25),
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated audit trail'),
            new OA\Response(response: 403, description: 'No access to project'),
            new OA\Response(response: 404, description: 'Project not found'),
        ],
    )]
    public function index(Request $request, string $id): JsonResponse
    {
        $project = SharedProject::findOrFail($id);
        $this->authorize('view', $project);

        $validated = $request->validate([
            'type' => ['sometimes', 'string', 'max:50'],
            'instance_id' => ['sometimes', 'string', 'max:255'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 25);

        $query = ActivityLog::forProject($project->id)
            ->when(
                isset($validated['type']),
                fn ($q) => $q->byType($validated['type']),
            )
            ->when(
                isset($validated['instance_id']),
                fn ($q) => $q->byInstance($validated['instance_id']),
            )
            ->when(
                isset($validated['from']),
                fn ($q) => $q->since($validated['from']),
            )
            ->when(
                isset($validated['to']),
                fn ($q) => $q->before($validated['to']),
            )
            ->orderByDesc('created_at');

        $logs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => AuditResource::collection($logs),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
                'pagination' => [
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                ],
            ],
        ]);
    }
}
