<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EpicResource;
use App\Models\Epic;
use App\Models\SharedProject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
            'color' => $validated['color'] ?? null,
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

        $epic->update($validated);

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

        // Nullify epic_id on related tasks before deletion
        $epic->tasks()->update(['epic_id' => null]);

        $epic->delete();

        return response()->json([
            'success' => true,
            'data' => null,
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

        return response()->json([
            'success' => true,
            'data' => new EpicResource($epic),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

}
