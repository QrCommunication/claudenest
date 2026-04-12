<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SprintResource;
use App\Models\SharedProject;
use App\Models\Sprint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SprintController extends Controller
{
    /**
     * List sprints for a project.
     */
    public function index(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('view', $project);

        $validated = $request->validate([
            'status' => 'string|in:planning,active,completed,cancelled',
            'per_page' => 'integer|min:1|max:100',
        ]);

        $query = $project->sprints()->ordered();

        if (isset($validated['status'])) {
            $query->byStatus($validated['status']);
        }

        $sprints = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => SprintResource::collection($sprints),
            'meta' => [
                'pagination' => [
                    'current_page' => $sprints->currentPage(),
                    'per_page' => $sprints->perPage(),
                    'total' => $sprints->total(),
                    'last_page' => $sprints->lastPage(),
                ],
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Create a new sprint for a project.
     */
    public function store(Request $request, string $projectId): JsonResponse
    {
        $project = SharedProject::findOrFail($projectId);
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'goal' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'capacity' => 'nullable|integer|min:1',
        ]);

        $sprint = $project->sprints()->create([
            'name' => $validated['name'],
            'goal' => $validated['goal'] ?? null,
            'status' => 'planning',
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'capacity' => $validated['capacity'] ?? null,
            'sort_order' => $project->sprints()->max('sort_order') + 1,
        ]);

        return response()->json([
            'success' => true,
            'data' => new SprintResource($sprint),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Show sprint details with tasks.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $sprint = Sprint::with('tasks')->findOrFail($id);
        $this->authorize('view', $sprint->project);

        return response()->json([
            'success' => true,
            'data' => new SprintResource($sprint),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Partially update a sprint.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $sprint = Sprint::findOrFail($id);
        $this->authorize('update', $sprint->project);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'goal' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'capacity' => 'nullable|integer|min:1',
            'velocity' => 'nullable|integer|min:0',
            'sort_order' => 'integer|min:0',
        ]);

        $sprint->update($validated);

        return response()->json([
            'success' => true,
            'data' => new SprintResource($sprint->fresh()),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Delete a sprint. Tasks lose their sprint_id (set null via DB cascade).
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $sprint = Sprint::findOrFail($id);
        $this->authorize('update', $sprint->project);

        // Detach tasks from this sprint before deletion
        $sprint->tasks()->update(['sprint_id' => null]);
        $sprint->delete();

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
     * Start a sprint. Only one sprint can be active per project.
     */
    public function start(Request $request, string $id): JsonResponse
    {
        $sprint = Sprint::findOrFail($id);
        $this->authorize('update', $sprint->project);

        if ($sprint->status === 'active') {
            return $this->errorResponse('SPRINT_ALREADY_ACTIVE', 'This sprint is already active.', 422);
        }

        $activeSprint = Sprint::forProject($sprint->project_id)->active()->first();

        if ($activeSprint) {
            return $this->errorResponse(
                'SPRINT_CONFLICT',
                'Another sprint is already active for this project: ' . $activeSprint->name,
                422
            );
        }

        $sprint->start();

        return response()->json([
            'success' => true,
            'data' => new SprintResource($sprint->fresh()),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Complete a sprint.
     */
    public function complete(Request $request, string $id): JsonResponse
    {
        $sprint = Sprint::findOrFail($id);
        $this->authorize('update', $sprint->project);

        if ($sprint->status === 'completed') {
            return $this->errorResponse('SPRINT_ALREADY_COMPLETED', 'This sprint is already completed.', 422);
        }

        if ($sprint->status !== 'active') {
            return $this->errorResponse(
                'SPRINT_NOT_ACTIVE',
                'Only an active sprint can be completed.',
                422
            );
        }

        $sprint->complete();

        return response()->json([
            'success' => true,
            'data' => new SprintResource($sprint->fresh()),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Get burndown chart data for a sprint.
     */
    public function burndown(Request $request, string $id): JsonResponse
    {
        $sprint = Sprint::findOrFail($id);
        $this->authorize('view', $sprint->project);

        return response()->json([
            'success' => true,
            'data' => [
                'sprint' => new SprintResource($sprint),
                'burndown' => $sprint->getBurndownData(),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

}
