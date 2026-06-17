<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Events\EpicUpdated;
use App\Events\SprintUpdated;
use App\Http\Controllers\Controller;
use App\Http\Resources\SprintResource;
use App\Models\Epic;
use App\Models\SharedProject;
use App\Models\Sprint;
use App\Services\CoordinatorService;
use App\Services\SprintFinalizeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

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

        // Sprints under an archived epic are hidden from the board by default
        // (the epic was archived, so its waves' sprints follow it out of the
        // active listing). ?archived=true stops hiding them so an archived
        // epic's sprints can be inspected — parsed via $request->boolean()
        // (lenient: accepts "true"/"1"/"on"), NOT a `boolean` validation rule,
        // which would reject the string "true" with a 422.
        $query = $project->sprints()
            ->when(
                ! $request->boolean('archived'),
                fn ($q) => $q->excludingArchivedEpics(),
            )
            ->ordered();

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
        // Eager-load tasks (ordered) so the detail view embeds a deterministic
        // task list via SprintResource::whenLoaded('tasks').
        $sprint = Sprint::with(['tasks' => fn ($query) => $query->ordered()])->findOrFail($id);
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

        // Broadcast sprint update to the project channel
        broadcast(new SprintUpdated($sprint->fresh(), 'updated'))->toOthers();

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
                'Another sprint is already active for this project: '.$activeSprint->name,
                422
            );
        }

        $sprint->start();

        // Broadcast sprint start to the project channel
        broadcast(new SprintUpdated($sprint->fresh(), 'started'))->toOthers();

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

        // Broadcast sprint completion to the project channel
        broadcast(new SprintUpdated($sprint->fresh(), 'completed'))->toOthers();

        // Cascade epic completion: closing a sprint may have been the last open
        // sprint blocking an epic from reaching `done` (see Epic::recomputeStatus).
        // The epic↔sprint link is indirect — resolved through the sprint's tasks.
        // Best-effort: the sprint is already completed, recompute must never break
        // the completion response. Only broadcast EpicUpdated when the status moved.
        try {
            $epicIds = $sprint->tasks()
                ->whereNotNull('epic_id')
                ->distinct()
                ->pluck('epic_id');

            Epic::whereIn('id', $epicIds)->get()->each(function (Epic $epic): void {
                if ($epic->recomputeStatus()) {
                    broadcast(new EpicUpdated($epic->fresh(), 'updated'))->toOthers();
                }
            });
        } catch (Throwable $e) {
            Log::warning('Epic cascade failed on sprint completion', [
                'sprint_id' => $sprint->id,
                'error' => $e->getMessage(),
            ]);
        }

        // Coordinator trigger: a completed sprint is a review opportunity.
        // Best-effort — coordination must never break the completion itself.
        try {
            app(CoordinatorService::class)->reportIncident(
                $sprint->project,
                CoordinatorService::INCIDENT_SPRINT_REVIEW,
                [
                    'sprint_id' => $sprint->id,
                    'sprint_name' => $sprint->name,
                    'velocity' => $sprint->velocity,
                ],
            );
        } catch (Throwable $e) {
            Log::warning('Coordinator trigger failed on sprint completion', [
                'sprint_id' => $sprint->id,
                'error' => $e->getMessage(),
            ]);
        }

        // Auto-PR: ask the project's agent to open a pull request for the
        // sprint's work. Best-effort — never breaks the completion response.
        try {
            app(SprintFinalizeService::class)->dispatchPullRequest($sprint);
        } catch (Throwable $e) {
            Log::warning('Sprint PR dispatch failed', [
                'sprint_id' => $sprint->id,
                'error' => $e->getMessage(),
            ]);
        }

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
