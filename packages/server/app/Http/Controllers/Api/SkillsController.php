<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SkillResource;
use App\Models\Machine;
use App\Models\Skill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SkillsController extends Controller
{
    /**
     * List discovered skills for a machine.
     */
    public function index(Request $request, string $machine): JsonResponse
    {
        $machineModel = Machine::findOrFail($machine);
        $this->authorize('view', $machineModel);

        $perPage = $request->input('per_page', 15);
        $search = $request->input('search');
        $category = $request->input('category');
        $enabled = $request->input('enabled');

        $query = Skill::forMachine($machineModel->id);

        // Apply search filter
        if ($search) {
            $query->search($search);
        }

        // Apply category filter
        if ($category && in_array($category, Skill::CATEGORIES)) {
            $query->byCategory($category);
        }

        // Apply enabled filter
        if ($enabled !== null) {
            $query->where('enabled', filter_var($enabled, FILTER_VALIDATE_BOOLEAN));
        }

        $skills = $query->orderBy('category')
            ->orderBy('name')
            ->paginate($perPage);

        // Get category counts for sidebar/filter
        $categoryCounts = Skill::forMachine($machineModel->id)
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category')
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => SkillResource::collection($skills),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
                'categories' => $categoryCounts,
                'pagination' => [
                    'current_page' => $skills->currentPage(),
                    'last_page' => $skills->lastPage(),
                    'per_page' => $skills->perPage(),
                    'total' => $skills->total(),
                ],
            ],
        ]);
    }

    /**
     * Get skill details.
     */
    public function show(Request $request, string $machine, string $path): JsonResponse
    {
        $machineModel = Machine::findOrFail($machine);
        $this->authorize('view', $machineModel);

        $skill = Skill::forMachine($machineModel->id)
            ->byPath($path)
            ->first();

        if (!$skill) {
            return $this->errorResponse('SKL_002', 'Skill not found', 404);
        }

        // Get related skills in same category
        $relatedSkills = Skill::forMachine($machineModel->id)
            ->byCategory($skill->category)
            ->where('id', '!=', $skill->id)
            ->where('enabled', true)
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'skill' => new SkillResource($skill),
                'related' => SkillResource::collection($relatedSkills),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Register skill from agent report.
     */
    public function store(Request $request, string $machine): JsonResponse
    {
        $machineModel = Machine::findOrFail($machine);
        $this->authorize('update', $machineModel);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'display_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|in:' . implode(',', Skill::CATEGORIES),
            'path' => 'required|string|unique:skills,path',
            'version' => 'nullable|string|max:50',
            'enabled' => 'boolean',
            'config' => 'nullable|array',
            'tags' => 'nullable|array',
            'examples' => 'nullable|array',
        ]);

        $skill = Skill::create([
            'machine_id' => $machineModel->id,
            'name' => $validated['name'],
            'display_name' => $validated['display_name'] ?? null,
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'path' => $validated['path'],
            'version' => $validated['version'] ?? '1.0.0',
            'enabled' => $validated['enabled'] ?? true,
            'config' => $validated['config'] ?? [],
            'tags' => $validated['tags'] ?? [],
            'examples' => $validated['examples'] ?? [],
            'discovered_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new SkillResource($skill),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Update skill configuration.
     */
    public function update(Request $request, string $machine, string $path): JsonResponse
    {
        $machineModel = Machine::findOrFail($machine);
        $this->authorize('update', $machineModel);

        $skill = Skill::forMachine($machineModel->id)
            ->byPath($path)
            ->firstOrFail();
        
        $this->authorize('update', $skill);

        $validated = $request->validate([
            'enabled' => 'boolean',
            'config' => 'nullable|array',
            'display_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $updateData = [];

        if (isset($validated['enabled'])) {
            $updateData['enabled'] = $validated['enabled'];
        }

        if (isset($validated['config'])) {
            $updateData['config'] = $validated['config'];
        }

        if (isset($validated['display_name'])) {
            $updateData['display_name'] = $validated['display_name'];
        }

        if (isset($validated['description'])) {
            $updateData['description'] = $validated['description'];
        }

        $skill->update($updateData);

        return response()->json([
            'success' => true,
            'data' => new SkillResource($skill),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Toggle skill enabled status.
     */
    public function toggle(Request $request, string $machine, string $path): JsonResponse
    {
        $machineModel = Machine::findOrFail($machine);
        $this->authorize('update', $machineModel);

        $skill = Skill::forMachine($machineModel->id)
            ->byPath($path)
            ->firstOrFail();
        
        $this->authorize('update', $skill);

        $skill->toggle();
        $skill->refresh();

        return response()->json([
            'success' => true,
            'data' => new SkillResource($skill),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Remove skill.
     */
    public function destroy(Request $request, string $machine, string $path): JsonResponse
    {
        $machineModel = Machine::findOrFail($machine);
        $this->authorize('update', $machineModel);

        $skill = Skill::forMachine($machineModel->id)
            ->byPath($path)
            ->firstOrFail();
        
        $this->authorize('delete', $skill);

        $skill->delete();

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
     * Bulk update skills (e.g., enable/disable multiple).
     */
    public function bulkUpdate(Request $request, string $machine): JsonResponse
    {
        $machineModel = Machine::findOrFail($machine);
        $this->authorize('update', $machineModel);

        $validated = $request->validate([
            'paths' => 'required|array',
            'paths.*' => 'string',
            'enabled' => 'required|boolean',
        ]);

        $count = Skill::forMachine($machineModel->id)
            ->whereIn('path', $validated['paths'])
            ->update(['enabled' => $validated['enabled']]);

        return response()->json([
            'success' => true,
            'data' => [
                'updated_count' => $count,
                'enabled' => $validated['enabled'],
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Get machine model for the authenticated user.
     */
    private function getMachine(Request $request, string $machineId): ?Machine
    {
        return $request->user()
            ->machines()
            ->find($machineId);
    }

    /**
     * Helper: Error response.
     */
    private function errorResponse(string $code, string $message, int $status): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => request()->header('X-Request-ID', uniqid()),
            ],
        ], $status);
    }
}
