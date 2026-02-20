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
     *
     * Returns a paginated, filterable list of skills registered on the given machine.
     * Supports text search, category filtering, and enabled/disabled filtering.
     * Category counts are included in the meta for sidebar/filter UIs.
     *
     * @OA\Get(
     *     path="/api/machines/{machineId}/skills",
     *     tags={"Skills"},
     *     summary="List machine skills",
     *     description="Returns a paginated list of skills for the specified machine, with optional filtering by search term, category, and enabled state. Category counts are included in the response meta.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="search",
     *         in="query",
     *         required=false,
     *         description="Search term to filter skills by name, display_name, or description",
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="category",
     *         in="query",
     *         required=false,
     *         description="Filter by skill category",
     *         @OA\Schema(type="string", enum={"auth","browser","command","mcp","search","file","git","general","api","database"})
     *     ),
     *     @OA\Parameter(
     *         name="enabled",
     *         in="query",
     *         required=false,
     *         description="Filter by enabled state (true or false)",
     *         @OA\Schema(type="boolean")
     *     ),
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         required=false,
     *         description="Number of results per page",
     *         @OA\Schema(type="integer", default=15, minimum=1, maximum=100)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Paginated skill list with category counts",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/Skill")
     *             ),
     *             @OA\Property(
     *                 property="meta",
     *                 type="object",
     *                 @OA\Property(property="timestamp", type="string", format="date-time"),
     *                 @OA\Property(property="request_id", type="string"),
     *                 @OA\Property(
     *                     property="categories",
     *                     type="object",
     *                     description="Map of category name to skill count",
     *                     @OA\AdditionalProperties(type="integer")
     *                 ),
     *                 @OA\Property(
     *                     property="pagination",
     *                     type="object",
     *                     @OA\Property(property="current_page", type="integer"),
     *                     @OA\Property(property="last_page", type="integer"),
     *                     @OA\Property(property="per_page", type="integer"),
     *                     @OA\Property(property="total", type="integer")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Machine not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="SKL_001"),
     *                 @OA\Property(property="message", type="string", example="Machine not found")
     *             )
     *         )
     *     )
     * )
     */
    public function index(Request $request, string $machine): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('SKL_001', 'Machine not found', 404);
        }

        $perPage = $request->input('per_page', 15);
        $search = $request->input('search');
        $category = $request->input('category');
        $enabled = $request->input('enabled');

        $query = Skill::forMachine($machineModel->id);

        // Apply search filter (matches name, display_name, description)
        if ($search) {
            $query->search($search);
        }

        // Apply category filter (only if valid category)
        if ($category && in_array($category, Skill::CATEGORIES)) {
            $query->byCategory($category);
        }

        // Apply enabled filter (cast string to boolean)
        if ($enabled !== null) {
            $query->where('enabled', filter_var($enabled, FILTER_VALIDATE_BOOLEAN));
        }

        $skills = $query->orderBy('category')
            ->orderBy('name')
            ->paginate($perPage);

        // Get category counts for sidebar/filter UI
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
     * Get skill details with related skills.
     *
     * Returns the full details of a single skill identified by its path,
     * along with up to 5 related enabled skills in the same category.
     *
     * @OA\Get(
     *     path="/api/machines/{machineId}/skills/{path}",
     *     tags={"Skills"},
     *     summary="Get skill details",
     *     description="Returns full details of a skill identified by its path, along with up to 5 related enabled skills in the same category.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="path",
     *         in="path",
     *         required=true,
     *         description="Unique skill path identifier (e.g. 'git/commit', 'browser/screenshot')",
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Skill details with related skills",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="skill", ref="#/components/schemas/Skill"),
     *                 @OA\Property(
     *                     property="related",
     *                     type="array",
     *                     description="Up to 5 related enabled skills in the same category",
     *                     @OA\Items(ref="#/components/schemas/Skill")
     *                 )
     *             ),
     *             @OA\Property(
     *                 property="meta",
     *                 type="object",
     *                 @OA\Property(property="timestamp", type="string", format="date-time"),
     *                 @OA\Property(property="request_id", type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Machine or skill not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="SKL_002"),
     *                 @OA\Property(property="message", type="string", example="Skill not found")
     *             )
     *         )
     *     )
     * )
     */
    public function show(Request $request, string $machine, string $path): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('SKL_001', 'Machine not found', 404);
        }

        $skill = Skill::forMachine($machineModel->id)
            ->byPath($path)
            ->first();

        if (!$skill) {
            return $this->errorResponse('SKL_002', 'Skill not found', 404);
        }

        // Get related skills in the same category (enabled only, max 5)
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
     * Register a new skill from an agent report.
     *
     * Called by the agent after skill discovery to register a new skill
     * on the server. The path must be globally unique across all skills.
     *
     * @OA\Post(
     *     path="/api/machines/{machineId}/skills",
     *     tags={"Skills"},
     *     summary="Register a skill",
     *     description="Registers a new skill discovered by the agent on the given machine. The skill path must be globally unique.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name", "category", "path"},
     *             @OA\Property(property="name", type="string", maxLength=255, example="Git Commit", description="Internal skill name"),
     *             @OA\Property(property="display_name", type="string", maxLength=255, nullable=true, example="Git Commit Helper", description="Human-readable display name"),
     *             @OA\Property(property="description", type="string", nullable=true, example="Commits staged changes with a generated message", description="Full description of what the skill does"),
     *             @OA\Property(property="category", type="string", enum={"auth","browser","command","mcp","search","file","git","general","api","database"}, example="git", description="Skill category"),
     *             @OA\Property(property="path", type="string", example="git/commit", description="Unique path identifier for the skill"),
     *             @OA\Property(property="version", type="string", maxLength=50, nullable=true, example="1.2.0", description="Semantic version of the skill"),
     *             @OA\Property(property="enabled", type="boolean", example=true, description="Whether the skill is enabled (defaults to true)"),
     *             @OA\Property(property="config", type="object", nullable=true, description="Key-value configuration for the skill"),
     *             @OA\Property(property="tags", type="array", nullable=true, @OA\Items(type="string"), example={"vcs","automation"}, description="Searchable tags"),
     *             @OA\Property(property="examples", type="array", nullable=true, @OA\Items(type="string"), example={"git commit -m 'fix: typo'"}, description="Usage examples")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Skill registered successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/Skill"),
     *             @OA\Property(
     *                 property="meta",
     *                 type="object",
     *                 @OA\Property(property="timestamp", type="string", format="date-time"),
     *                 @OA\Property(property="request_id", type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Machine not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="SKL_001"),
     *                 @OA\Property(property="message", type="string", example="Machine not found")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error (e.g. duplicate path, invalid category)",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="errors", type="object")
     *         )
     *     )
     * )
     */
    public function store(Request $request, string $machine): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('SKL_001', 'Machine not found', 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'display_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|in:' . implode(',', Skill::CATEGORIES),
            'path' => ['required', 'string', \Illuminate\Validation\Rule::unique('skills', 'path')->where('machine_id', $machineModel->id)],
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
     * Bulk upsert skills from agent sync.
     */
    public function sync(Request $request, string $machine): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('SKL_001', 'Machine not found', 404);
        }

        $validated = $request->validate([
            'skills' => 'required|array',
            'skills.*.name' => 'required|string|max:255',
            'skills.*.path' => 'required|string',
            'skills.*.description' => 'nullable|string',
            'skills.*.category' => 'required|string',
            'skills.*.version' => 'nullable|string|max:50',
            'skills.*.config' => 'nullable|array',
            'skills.*.tags' => 'nullable|array',
        ]);

        $synced = 0;
        foreach ($validated['skills'] as $skillData) {
            Skill::updateOrCreate(
                [
                    'machine_id' => $machineModel->id,
                    'path' => $skillData['path'],
                ],
                [
                    'name' => $skillData['name'],
                    'description' => $skillData['description'] ?? null,
                    'category' => $skillData['category'],
                    'version' => $skillData['version'] ?? '1.0.0',
                    'config' => $skillData['config'] ?? [],
                    'tags' => $skillData['tags'] ?? [],
                    'discovered_at' => now(),
                ]
            );
            $synced++;
        }

        return response()->json([
            'success' => true,
            'data' => ['synced' => $synced],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Update skill configuration and metadata.
     *
     * Partially updates a skill identified by its path. Only provided fields
     * are updated; omitted fields remain unchanged.
     *
     * @OA\Patch(
     *     path="/api/machines/{machineId}/skills/{path}",
     *     tags={"Skills"},
     *     summary="Update a skill",
     *     description="Partially updates a skill's enabled state, config, display name, or description. Only provided fields are modified.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="path",
     *         in="path",
     *         required=true,
     *         description="Unique skill path identifier",
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="enabled", type="boolean", example=false, description="Toggle the skill on or off"),
     *             @OA\Property(property="config", type="object", nullable=true, description="Replace the skill's entire config object"),
     *             @OA\Property(property="display_name", type="string", maxLength=255, nullable=true, example="Renamed Skill", description="Human-readable display name"),
     *             @OA\Property(property="description", type="string", nullable=true, example="Updated description", description="Full description of the skill")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Skill updated successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/Skill"),
     *             @OA\Property(
     *                 property="meta",
     *                 type="object",
     *                 @OA\Property(property="timestamp", type="string", format="date-time"),
     *                 @OA\Property(property="request_id", type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Machine or skill not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="SKL_002"),
     *                 @OA\Property(property="message", type="string", example="Skill not found")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="errors", type="object")
     *         )
     *     )
     * )
     */
    public function update(Request $request, string $machine, string $path): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('SKL_001', 'Machine not found', 404);
        }

        $skill = Skill::forMachine($machineModel->id)
            ->byPath($path)
            ->first();

        if (!$skill) {
            return $this->errorResponse('SKL_002', 'Skill not found', 404);
        }

        $validated = $request->validate([
            'enabled' => 'boolean',
            'config' => 'nullable|array',
            'display_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        // Build update array from only the provided fields
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
     *
     * Flips the enabled state of the skill: if enabled, it becomes disabled,
     * and vice versa. Returns the updated skill with its new state.
     *
     * @OA\Post(
     *     path="/api/machines/{machineId}/skills/{path}/toggle",
     *     tags={"Skills"},
     *     summary="Toggle skill enabled state",
     *     description="Flips the enabled state of the skill (enabled becomes disabled, and vice versa). Returns the updated skill.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="path",
     *         in="path",
     *         required=true,
     *         description="Unique skill path identifier",
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Skill toggled successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/Skill"),
     *             @OA\Property(
     *                 property="meta",
     *                 type="object",
     *                 @OA\Property(property="timestamp", type="string", format="date-time"),
     *                 @OA\Property(property="request_id", type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Machine or skill not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="SKL_002"),
     *                 @OA\Property(property="message", type="string", example="Skill not found")
     *             )
     *         )
     *     )
     * )
     */
    public function toggle(Request $request, string $machine, string $path): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('SKL_001', 'Machine not found', 404);
        }

        $skill = Skill::forMachine($machineModel->id)
            ->byPath($path)
            ->first();

        if (!$skill) {
            return $this->errorResponse('SKL_002', 'Skill not found', 404);
        }

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
     * Remove a skill from the machine.
     *
     * Permanently deletes the skill record. This cannot be undone;
     * the agent will need to re-discover and re-register the skill.
     *
     * @OA\Delete(
     *     path="/api/machines/{machineId}/skills/{path}",
     *     tags={"Skills"},
     *     summary="Delete a skill",
     *     description="Permanently removes a skill from the machine. The agent will need to re-discover and re-register the skill to restore it.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="path",
     *         in="path",
     *         required=true,
     *         description="Unique skill path identifier",
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Skill deleted successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="null", nullable=true),
     *             @OA\Property(
     *                 property="meta",
     *                 type="object",
     *                 @OA\Property(property="timestamp", type="string", format="date-time"),
     *                 @OA\Property(property="request_id", type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Machine or skill not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="SKL_002"),
     *                 @OA\Property(property="message", type="string", example="Skill not found")
     *             )
     *         )
     *     )
     * )
     */
    public function destroy(Request $request, string $machine, string $path): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('SKL_001', 'Machine not found', 404);
        }

        $skill = Skill::forMachine($machineModel->id)
            ->byPath($path)
            ->first();

        if (!$skill) {
            return $this->errorResponse('SKL_002', 'Skill not found', 404);
        }

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
     * Bulk update skills (enable or disable multiple skills at once).
     *
     * Accepts an array of skill paths and a target enabled state.
     * All matching skills on the machine are updated in a single query.
     * Returns the count of actually updated rows.
     *
     * @OA\Post(
     *     path="/api/machines/{machineId}/skills/bulk",
     *     tags={"Skills"},
     *     summary="Bulk update skills",
     *     description="Enables or disables multiple skills at once by their paths. Returns the number of skills actually updated.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"paths", "enabled"},
     *             @OA\Property(
     *                 property="paths",
     *                 type="array",
     *                 description="List of skill paths to update",
     *                 @OA\Items(type="string"),
     *                 example={"git/commit", "git/push", "browser/screenshot"}
     *             ),
     *             @OA\Property(
     *                 property="enabled",
     *                 type="boolean",
     *                 description="Target enabled state for all listed skills",
     *                 example=true
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Bulk update result",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="updated_count", type="integer", example=3, description="Number of skills actually updated"),
     *                 @OA\Property(property="enabled", type="boolean", example=true, description="The applied enabled state")
     *             ),
     *             @OA\Property(
     *                 property="meta",
     *                 type="object",
     *                 @OA\Property(property="timestamp", type="string", format="date-time"),
     *                 @OA\Property(property="request_id", type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Machine not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="SKL_001"),
     *                 @OA\Property(property="message", type="string", example="Machine not found")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error (e.g. missing paths or enabled field)",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="errors", type="object")
     *         )
     *     )
     * )
     */
    public function bulkUpdate(Request $request, string $machine): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('SKL_001', 'Machine not found', 404);
        }

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

    // ==================== PRIVATE HELPERS ====================

    /**
     * Resolve and authorize a machine for the authenticated user.
     *
     * @param  Request  $request  The current HTTP request (provides the authenticated user)
     * @param  string   $machineId  UUID of the machine to look up
     * @return Machine|null  The machine model if found and owned by the user, null otherwise
     */
    private function getMachine(Request $request, string $machineId): ?Machine
    {
        return $request->user()
            ->machines()
            ->find($machineId);
    }

    /**
     * Build a standardized error JSON response.
     *
     * @param  string  $code     Application-level error code (e.g. SKL_001)
     * @param  string  $message  Human-readable error message
     * @param  int     $status   HTTP status code
     * @return JsonResponse
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
