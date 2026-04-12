<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EpicResource;
use App\Models\Epic;
use App\Models\SharedProject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EpicController extends Controller
{
    /**
     * List epics for a project.
     *
     * @OA\Get(
     *     path="/api/projects/{projectId}/epics",
     *     tags={"Epics"},
     *     summary="List project epics",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="projectId", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Parameter(name="status", in="query", required=false, @OA\Schema(type="string", enum={"open","in_progress","done"})),
     *     @OA\Parameter(name="priority", in="query", required=false, @OA\Schema(type="string", enum={"low","medium","high","critical"})),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=20)),
     *     @OA\Response(response=200, description="Paginated epic list", @OA\JsonContent(ref="#/components/schemas/PaginatedResponse")),
     *     @OA\Response(response=404, description="Project not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
     */
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
     *
     * @OA\Post(
     *     path="/api/projects/{projectId}/epics",
     *     tags={"Epics"},
     *     summary="Create an epic",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="projectId", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(response=201, description="Epic created", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")),
     *     @OA\Response(response=404, description="Project not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
     */
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
     *
     * @OA\Get(
     *     path="/api/epics/{id}",
     *     tags={"Epics"},
     *     summary="Get epic details",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(response=200, description="Epic details", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")),
     *     @OA\Response(response=404, description="Epic not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
     */
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
     *
     * @OA\Patch(
     *     path="/api/epics/{id}",
     *     tags={"Epics"},
     *     summary="Update an epic",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(response=200, description="Epic updated", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")),
     *     @OA\Response(response=404, description="Epic not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
     */
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
     *
     * @OA\Delete(
     *     path="/api/epics/{id}",
     *     tags={"Epics"},
     *     summary="Delete an epic",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(response=200, description="Epic deleted", @OA\JsonContent(ref="#/components/schemas/DeletedResponse")),
     *     @OA\Response(response=404, description="Epic not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
     */
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
     *
     * @OA\Post(
     *     path="/api/epics/{id}/reorder",
     *     tags={"Epics"},
     *     summary="Reorder an epic",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"position"},
     *         @OA\Property(property="position", type="integer", minimum=0)
     *     )),
     *     @OA\Response(response=200, description="Epic reordered", @OA\JsonContent(ref="#/components/schemas/SuccessResponse")),
     *     @OA\Response(response=404, description="Epic not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
     */
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
