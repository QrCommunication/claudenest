<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Events\EpicUpdated;
use App\Http\Controllers\Controller;
use App\Http\Resources\EpicResource;
use App\Models\Epic;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Sprint;
use App\Services\EpicFinalizeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

class EpicController extends Controller
{
    /**
     * List epics for a project.
     */
    #[OA\Get(
        path: '/api/projects/{projectId}/epics',
        summary: 'List project epics',
        security: [['bearerAuth' => []]],
        tags: ['Epics'],
        parameters: [
            new OA\Parameter(name: 'projectId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['open', 'in_progress', 'done'])),
            new OA\Parameter(name: 'priority', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['low', 'medium', 'high', 'critical'])),
            new OA\Parameter(name: 'archived', in: 'query', required: false, description: 'true = archived epics only; default = active (non-archived)', schema: new OA\Schema(type: 'boolean', default: false)),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 20)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated epic list', content: new OA\JsonContent(ref: '#/components/schemas/PaginatedResponse')),
            new OA\Response(response: 404, description: 'Project not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function index(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('view', $project);

        $validated = $request->validate([
            'status' => 'string|in:open,in_progress,done',
            'priority' => 'string|in:low,medium,high,critical',
        ]);

        $query = $project->epics()->ordered();

        // Default to the active (non-archived) set; ?archived=true returns the
        // archived epics only. Parsed via $request->boolean() (lenient: accepts
        // "true"/"1"/"on") rather than a strict `boolean` rule that rejects "true".
        $query->when(
            $request->boolean('archived'),
            fn ($q) => $q->archived(),
            fn ($q) => $q->active(),
        );

        if (isset($validated['status'])) {
            $query->byStatus($validated['status']);
        }

        if (isset($validated['priority'])) {
            $query->where('priority', $validated['priority']);
        }

        $epics = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => EpicResource::collection($epics),
            'meta' => [
                'pagination' => [
                    'current_page' => $epics->currentPage(),
                    'per_page' => $epics->perPage(),
                    'total' => $epics->total(),
                    'last_page' => $epics->lastPage(),
                ],
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Create a new epic.
     */
    #[OA\Post(
        path: '/api/projects/{projectId}/epics',
        summary: 'Create an epic',
        security: [['bearerAuth' => []]],
        tags: ['Epics'],
        parameters: [
            new OA\Parameter(name: 'projectId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 201, description: 'Epic created', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Project not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function store(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('update', $project);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:50',
            'priority' => 'string|in:low,medium,high,critical',
        ]);

        $epic = $project->epics()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            // epics.color is NOT NULL with a DB default — an explicit null
            // would override the default and throw a 23502 violation.
            'color' => $validated['color'] ?? Epic::DEFAULT_COLOR,
            'icon' => $validated['icon'] ?? null,
            'priority' => $validated['priority'] ?? 'medium',
            'status' => 'open',
            'sort_order' => $project->epics()->max('sort_order') + 1,
        ]);

        return response()->json([
            'success' => true,
            'data' => new EpicResource($epic),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Show epic details with its tasks.
     */
    #[OA\Get(
        path: '/api/epics/{id}',
        summary: 'Get epic details',
        security: [['bearerAuth' => []]],
        tags: ['Epics'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Epic details', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Epic not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function show(Request $request, string $id): JsonResponse
    {
        $epic = Epic::with(['project', 'tasks'])->findOrFail($id);
        $this->authorize('view', $epic->project);

        return response()->json([
            'success' => true,
            'data' => new EpicResource($epic),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Update an epic.
     */
    #[OA\Patch(
        path: '/api/epics/{id}',
        summary: 'Update an epic',
        security: [['bearerAuth' => []]],
        tags: ['Epics'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Epic updated', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Epic not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function update(Request $request, string $id): JsonResponse
    {
        $epic = Epic::with('project')->findOrFail($id);
        $this->authorize('update', $epic->project);

        $validated = $request->validate([
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:50',
            'status' => 'string|in:open,in_progress,done',
            'priority' => 'string|in:low,medium,high,critical',
        ]);

        // epics.color is NOT NULL — an explicit `"color": null` payload would
        // throw a 23502 violation; treat it as "reset to the default color".
        if (array_key_exists('color', $validated) && $validated['color'] === null) {
            $validated['color'] = Epic::DEFAULT_COLOR;
        }

        $epic->update($validated);

        // Broadcast epic update to the project channel
        broadcast(new EpicUpdated($epic, 'updated'))->toOthers();

        return response()->json([
            'success' => true,
            'data' => new EpicResource($epic),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Delete an epic. Tasks lose their epic_id (set null).
     */
    #[OA\Delete(
        path: '/api/epics/{id}',
        summary: 'Delete an epic',
        security: [['bearerAuth' => []]],
        tags: ['Epics'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Epic deleted', content: new OA\JsonContent(ref: '#/components/schemas/DeletedResponse')),
            new OA\Response(response: 404, description: 'Epic not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function destroy(Request $request, string $id): JsonResponse
    {
        $epic = Epic::with('project')->findOrFail($id);
        $this->authorize('update', $epic->project);

        // Cascade: deleting an epic removes its tasks and any sprint that becomes
        // empty as a result (epic-from-PRD generates dedicated sprints + tasks,
        // so they belong to the epic). Sprints still holding other tasks are
        // preserved. Atomic.
        $deleted = DB::transaction(function () use ($epic) {
            $sprintIds = $epic->tasks()
                ->whereNotNull('sprint_id')
                ->distinct()
                ->pluck('sprint_id')
                ->all();

            $tasksDeleted = $epic->tasks()->delete();

            $sprintsDeleted = 0;
            foreach ($sprintIds as $sprintId) {
                if (SharedTask::where('sprint_id', $sprintId)->count() === 0) {
                    $sprintsDeleted += Sprint::where('id', $sprintId)->delete();
                }
            }

            $epic->delete();

            return ['tasks' => $tasksDeleted, 'sprints' => $sprintsDeleted];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'tasks_deleted' => $deleted['tasks'],
                'sprints_deleted' => $deleted['sprints'],
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Change the sort_order of an epic.
     */
    #[OA\Post(
        path: '/api/epics/{id}/reorder',
        summary: 'Reorder an epic',
        security: [['bearerAuth' => []]],
        tags: ['Epics'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['position'],
            properties: [
                new OA\Property(property: 'position', type: 'integer', minimum: 0),
            ]
        )),
        responses: [
            new OA\Response(response: 200, description: 'Epic reordered', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Epic not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function reorder(Request $request, string $id): JsonResponse
    {
        $epic = Epic::with('project')->findOrFail($id);
        $this->authorize('update', $epic->project);

        $validated = $request->validate([
            'position' => 'required|integer|min:0',
        ]);

        $epic->reorder($validated['position']);

        // Broadcast reorder to the project channel
        broadcast(new EpicUpdated($epic, 'reordered'))->toOthers();

        return response()->json([
            'success' => true,
            'data' => new EpicResource($epic),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Archive an epic (hidden from the active board; its sprints/tasks follow
     * via the archived-epic scopes). Reversible — see {@see unarchive()}.
     */
    #[OA\Post(
        path: '/api/epics/{id}/archive',
        summary: 'Archive an epic',
        security: [['bearerAuth' => []]],
        tags: ['Epics'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Epic archived', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Epic not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function archive(Request $request, string $id): JsonResponse
    {
        $epic = Epic::with('project')->findOrFail($id);
        $this->authorize('update', $epic->project);

        $epic->archive();

        broadcast(new EpicUpdated($epic, 'archived'))->toOthers();

        return response()->json([
            'success' => true,
            'data' => new EpicResource($epic),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Restore an archived epic to the active board.
     */
    #[OA\Post(
        path: '/api/epics/{id}/unarchive',
        summary: 'Unarchive an epic',
        security: [['bearerAuth' => []]],
        tags: ['Epics'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Epic unarchived', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 404, description: 'Epic not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function unarchive(Request $request, string $id): JsonResponse
    {
        $epic = Epic::with('project')->findOrFail($id);
        $this->authorize('update', $epic->project);

        $epic->unarchive();

        broadcast(new EpicUpdated($epic, 'unarchived'))->toOthers();

        return response()->json([
            'success' => true,
            'data' => new EpicResource($epic),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Finalize a completed epic: ask the project's agent to open a pull request
     * for the epic's work (mirror of sprint completion's auto-PR, but explicit).
     * Only a 100%-complete epic can be finalized. The dispatch stamps the
     * finalize intent (pr_branch + finalized_at); pr_url/pr_number/pr_state arrive
     * later when the agent reports `epic:finalized` (see AgentServe::onEpicFinalized).
     */
    #[OA\Post(
        path: '/api/epics/{id}/finalize',
        summary: 'Finalize an epic — open its pull request',
        security: [['bearerAuth' => []]],
        tags: ['Epics'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'PR dispatch requested', content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')),
            new OA\Response(response: 422, description: 'Epic not complete', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 404, description: 'Epic not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function finalize(Request $request, string $id, EpicFinalizeService $finalizer): JsonResponse
    {
        $epic = Epic::with('project')->findOrFail($id);
        $this->authorize('update', $epic->project);

        // Only a complete epic (every task done) can open its PR — mirrors the
        // frontend's "create PR" button surfaced at 100%.
        if ($epic->tasks_count === 0 || $epic->progress_percentage < 100.0) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'EPIC_NOT_COMPLETE',
                    'message' => 'Only a 100%-complete epic can be finalized.',
                ],
                'meta' => [
                    'timestamp' => now()->toIso8601String(),
                    'request_id' => $request->header('X-Request-ID', uniqid()),
                ],
            ], 422);
        }

        // Best-effort dispatch: false when the project has no machine/path or the
        // machine is offline. The endpoint still succeeds (the user can retry once
        // the agent is online), surfacing the outcome via `dispatched`.
        $dispatched = $finalizer->dispatchPullRequest($epic);

        // Reconcile earlier siblings that are done but never shipped, so the
        // whole sequence merges together. Best-effort and idempotent — already
        // shipped epics (pr_done = true) are skipped so re-finalizing converges.
        $backfilled = $finalizer->backfillPreviousEpics($epic);

        broadcast(new EpicUpdated($epic->fresh(), 'finalizing'))->toOthers();

        return response()->json([
            'success' => true,
            'data' => [
                'epic' => new EpicResource($epic->fresh()),
                'dispatched' => $dispatched,
                'backfilled' => $backfilled,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }
}
