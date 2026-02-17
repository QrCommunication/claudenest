<?php

namespace App\Http\Controllers\Api;

use App\Events\MachineCommand;
use App\Http\Controllers\Controller;
use App\Http\Resources\CommandResource;
use App\Models\DiscoveredCommand;
use App\Models\Machine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommandsController extends Controller
{
    /**
     * List discovered commands for a machine.
     *
     * Returns a paginated, filterable list of commands registered on the given machine.
     * Supports text search, category filtering, and skill path filtering.
     * Category and skill counts are included in the meta for sidebar/filter UIs.
     *
     * @OA\Get(
     *     path="/api/machines/{machineId}/commands",
     *     tags={"Commands"},
     *     summary="List machine commands",
     *     description="Returns a paginated list of commands for the specified machine, with optional filtering by search term, category, and skill path. Category and skill counts are included in the response meta.",
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
     *         description="Search term to filter commands by name, description, or aliases",
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="category",
     *         in="query",
     *         required=false,
     *         description="Filter by command category",
     *         @OA\Schema(type="string", enum={"general","git","file","search","build","test","deploy","docker","npm","composer"})
     *     ),
     *     @OA\Parameter(
     *         name="skill_path",
     *         in="query",
     *         required=false,
     *         description="Filter by originating skill path (e.g. 'git/commit')",
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         required=false,
     *         description="Number of results per page",
     *         @OA\Schema(type="integer", default=50, minimum=1, maximum=100)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Paginated command list with category and skill counts",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/Command")
     *             ),
     *             @OA\Property(
     *                 property="meta",
     *                 type="object",
     *                 @OA\Property(property="timestamp", type="string", format="date-time"),
     *                 @OA\Property(property="request_id", type="string"),
     *                 @OA\Property(
     *                     property="categories",
     *                     type="object",
     *                     description="Map of category name to command count",
     *                     @OA\AdditionalProperties(type="integer")
     *                 ),
     *                 @OA\Property(
     *                     property="skills",
     *                     type="object",
     *                     description="Map of skill path to command count",
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
     *                 @OA\Property(property="code", type="string", example="CMD_001"),
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
            return $this->errorResponse('CMD_001', 'Machine not found', 404);
        }

        $perPage = $request->input('per_page', 50);
        $search = $request->input('search');
        $category = $request->input('category');
        $skillPath = $request->input('skill_path');

        $query = DiscoveredCommand::forMachine($machineModel->id);

        // Apply search filter (matches name, description, aliases)
        if ($search) {
            $query->search($search);
        }

        // Apply category filter
        if ($category) {
            $query->byCategory($category);
        }

        // Apply skill path filter
        if ($skillPath) {
            $query->bySkill($skillPath);
        }

        $commands = $query->orderBy('category')
            ->orderBy('name')
            ->paginate($perPage);

        // Get category counts for sidebar/filter UI
        $categoryCounts = DiscoveredCommand::forMachine($machineModel->id)
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category')
            ->toArray();

        // Get skill path counts for grouping by skill
        $skillCounts = DiscoveredCommand::forMachine($machineModel->id)
            ->whereNotNull('skill_path')
            ->selectRaw('skill_path, COUNT(*) as count')
            ->groupBy('skill_path')
            ->pluck('count', 'skill_path')
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => CommandResource::collection($commands),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
                'categories' => $categoryCounts,
                'skills' => $skillCounts,
                'pagination' => [
                    'current_page' => $commands->currentPage(),
                    'last_page' => $commands->lastPage(),
                    'per_page' => $commands->perPage(),
                    'total' => $commands->total(),
                ],
            ],
        ]);
    }

    /**
     * Get command details with related commands.
     *
     * Returns the full details of a single command identified by its UUID,
     * along with up to 5 related commands in the same category.
     *
     * @OA\Get(
     *     path="/api/machines/{machineId}/commands/{id}",
     *     tags={"Commands"},
     *     summary="Get command details",
     *     description="Returns full details of a command identified by its UUID, along with up to 5 related commands in the same category.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="UUID of the command",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Command details with related commands",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="command", ref="#/components/schemas/Command"),
     *                 @OA\Property(
     *                     property="related",
     *                     type="array",
     *                     description="Up to 5 related commands in the same category",
     *                     @OA\Items(ref="#/components/schemas/Command")
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
     *         description="Machine or command not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="CMD_002"),
     *                 @OA\Property(property="message", type="string", example="Command not found")
     *             )
     *         )
     *     )
     * )
     */
    public function show(Request $request, string $machine, string $id): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('CMD_001', 'Machine not found', 404);
        }

        $command = DiscoveredCommand::forMachine($machineModel->id)
            ->find($id);

        if (!$command) {
            return $this->errorResponse('CMD_002', 'Command not found', 404);
        }

        // Get related commands in the same category (max 5)
        $relatedCommands = DiscoveredCommand::forMachine($machineModel->id)
            ->byCategory($command->category)
            ->where('id', '!=', $command->id)
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'command' => new CommandResource($command),
                'related' => CommandResource::collection($relatedCommands),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Register a discovered command on a machine.
     *
     * Called by the agent after command discovery to register a new command
     * on the server. If a command with the same name already exists on this
     * machine, it is updated instead (upsert behavior).
     *
     * @OA\Post(
     *     path="/api/machines/{machineId}/commands",
     *     tags={"Commands"},
     *     summary="Register a command",
     *     description="Registers a newly discovered command on the given machine. If a command with the same name already exists, it is updated (upsert). Returns 201 on creation, 200 on update.",
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
     *             required={"name", "category"},
     *             @OA\Property(property="name", type="string", maxLength=255, example="git:commit", description="Unique command name on this machine"),
     *             @OA\Property(property="description", type="string", nullable=true, example="Commit staged changes", description="Human-readable description"),
     *             @OA\Property(property="category", type="string", maxLength=100, example="git", description="Command category"),
     *             @OA\Property(
     *                 property="parameters",
     *                 type="array",
     *                 nullable=true,
     *                 description="List of command parameters",
     *                 @OA\Items(
     *                     type="object",
     *                     required={"name"},
     *                     @OA\Property(property="name", type="string", example="message"),
     *                     @OA\Property(property="type", type="string", example="string"),
     *                     @OA\Property(property="required", type="boolean", example=true),
     *                     @OA\Property(property="description", type="string", nullable=true, example="Commit message")
     *                 )
     *             ),
     *             @OA\Property(property="aliases", type="array", nullable=true, @OA\Items(type="string"), example={"gc","commit"}, description="Alternative names for the command"),
     *             @OA\Property(property="examples", type="array", nullable=true, @OA\Items(type="string"), example={"git commit -m 'fix: typo'"}, description="Usage examples"),
     *             @OA\Property(property="skill_path", type="string", nullable=true, example="git/commit", description="Path of the skill that provides this command")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Command registered successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/Command"),
     *             @OA\Property(
     *                 property="meta",
     *                 type="object",
     *                 @OA\Property(property="timestamp", type="string", format="date-time"),
     *                 @OA\Property(property="request_id", type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Existing command updated (upsert)",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/Command"),
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
     *                 @OA\Property(property="code", type="string", example="CMD_001"),
     *                 @OA\Property(property="message", type="string", example="Machine not found")
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
    public function store(Request $request, string $machine): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('CMD_001', 'Machine not found', 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'parameters' => 'nullable|array',
            'parameters.*.name' => 'required|string',
            'parameters.*.type' => 'string',
            'parameters.*.required' => 'boolean',
            'parameters.*.description' => 'nullable|string',
            'aliases' => 'nullable|array',
            'examples' => 'nullable|array',
            'skill_path' => 'nullable|string',
        ]);

        // Check if command already exists on this machine (upsert behavior)
        $existing = DiscoveredCommand::forMachine($machineModel->id)
            ->where('name', $validated['name'])
            ->first();

        if ($existing) {
            // Update existing command with fresh data
            $existing->update([
                'description' => $validated['description'] ?? null,
                'category' => $validated['category'],
                'parameters' => $validated['parameters'] ?? [],
                'aliases' => $validated['aliases'] ?? [],
                'examples' => $validated['examples'] ?? [],
                'skill_path' => $validated['skill_path'] ?? null,
                'discovered_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => new CommandResource($existing),
                'meta' => [
                    'timestamp' => now()->toIso8601String(),
                    'request_id' => $request->header('X-Request-ID', uniqid()),
                ],
            ]);
        }

        $command = DiscoveredCommand::create([
            'machine_id' => $machineModel->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'parameters' => $validated['parameters'] ?? [],
            'aliases' => $validated['aliases'] ?? [],
            'examples' => $validated['examples'] ?? [],
            'skill_path' => $validated['skill_path'] ?? null,
            'discovered_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new CommandResource($command),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Bulk register multiple commands at once.
     *
     * Accepts an array of commands and performs upsert for each one.
     * Returns a summary with counts of created and updated commands.
     * Typically called by the agent after a full discovery sweep.
     *
     * @OA\Post(
     *     path="/api/machines/{machineId}/commands/bulk",
     *     tags={"Commands"},
     *     summary="Bulk register commands",
     *     description="Registers multiple commands in a single request. Each command is upserted: created if new, updated if a command with the same name already exists. Returns a summary of created/updated counts.",
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
     *             required={"commands"},
     *             @OA\Property(
     *                 property="commands",
     *                 type="array",
     *                 description="Array of commands to register",
     *                 @OA\Items(
     *                     type="object",
     *                     required={"name", "category"},
     *                     @OA\Property(property="name", type="string", maxLength=255, example="git:commit"),
     *                     @OA\Property(property="description", type="string", nullable=true, example="Commit staged changes"),
     *                     @OA\Property(property="category", type="string", maxLength=100, example="git"),
     *                     @OA\Property(property="parameters", type="array", nullable=true, @OA\Items(type="object")),
     *                     @OA\Property(property="aliases", type="array", nullable=true, @OA\Items(type="string")),
     *                     @OA\Property(property="examples", type="array", nullable=true, @OA\Items(type="string")),
     *                     @OA\Property(property="skill_path", type="string", nullable=true, example="git/commit")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Bulk operation result summary",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="created", type="integer", example=8, description="Number of newly created commands"),
     *                 @OA\Property(property="updated", type="integer", example=3, description="Number of existing commands updated"),
     *                 @OA\Property(property="total", type="integer", example=11, description="Total commands processed")
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
     *                 @OA\Property(property="code", type="string", example="CMD_001"),
     *                 @OA\Property(property="message", type="string", example="Machine not found")
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
    public function bulkStore(Request $request, string $machine): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('CMD_001', 'Machine not found', 404);
        }

        $validated = $request->validate([
            'commands' => 'required|array',
            'commands.*.name' => 'required|string|max:255',
            'commands.*.description' => 'nullable|string',
            'commands.*.category' => 'required|string|max:100',
            'commands.*.parameters' => 'nullable|array',
            'commands.*.aliases' => 'nullable|array',
            'commands.*.examples' => 'nullable|array',
            'commands.*.skill_path' => 'nullable|string',
        ]);

        $created = 0;
        $updated = 0;

        foreach ($validated['commands'] as $cmdData) {
            $existing = DiscoveredCommand::forMachine($machineModel->id)
                ->where('name', $cmdData['name'])
                ->first();

            if ($existing) {
                $existing->update([
                    'description' => $cmdData['description'] ?? null,
                    'category' => $cmdData['category'],
                    'parameters' => $cmdData['parameters'] ?? [],
                    'aliases' => $cmdData['aliases'] ?? [],
                    'examples' => $cmdData['examples'] ?? [],
                    'skill_path' => $cmdData['skill_path'] ?? null,
                    'discovered_at' => now(),
                ]);
                $updated++;
            } else {
                DiscoveredCommand::create([
                    'machine_id' => $machineModel->id,
                    'name' => $cmdData['name'],
                    'description' => $cmdData['description'] ?? null,
                    'category' => $cmdData['category'],
                    'parameters' => $cmdData['parameters'] ?? [],
                    'aliases' => $cmdData['aliases'] ?? [],
                    'examples' => $cmdData['examples'] ?? [],
                    'skill_path' => $cmdData['skill_path'] ?? null,
                    'discovered_at' => now(),
                ]);
                $created++;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'created' => $created,
                'updated' => $updated,
                'total' => count($validated['commands']),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Delete a single command.
     *
     * Permanently removes a command from the machine's registry.
     * The command is identified by its UUID.
     *
     * @OA\Delete(
     *     path="/api/machines/{machineId}/commands/{id}",
     *     tags={"Commands"},
     *     summary="Delete a command",
     *     description="Permanently deletes a single command identified by its UUID from the machine's command registry.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="UUID of the command to delete",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Command deleted successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="null", example=null),
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
     *         description="Machine or command not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="CMD_002"),
     *                 @OA\Property(property="message", type="string", example="Command not found")
     *             )
     *         )
     *     )
     * )
     */
    public function destroy(Request $request, string $machine, string $id): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('CMD_001', 'Machine not found', 404);
        }

        $command = DiscoveredCommand::forMachine($machineModel->id)
            ->find($id);

        if (!$command) {
            return $this->errorResponse('CMD_002', 'Command not found', 404);
        }

        $command->delete();

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
     * Clear all commands for a machine.
     *
     * Permanently removes every command registered on the given machine.
     * Typically used before a full re-discovery to avoid stale entries.
     *
     * @OA\Delete(
     *     path="/api/machines/{machineId}/commands",
     *     tags={"Commands"},
     *     summary="Clear all commands",
     *     description="Permanently deletes all commands registered on the given machine. Returns the number of deleted commands. Typically used before a full re-discovery sweep.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="All commands cleared",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="deleted_count", type="integer", example=42, description="Number of commands deleted")
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
     *                 @OA\Property(property="code", type="string", example="CMD_001"),
     *                 @OA\Property(property="message", type="string", example="Machine not found")
     *             )
     *         )
     *     )
     * )
     */
    public function clear(Request $request, string $machine): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('CMD_001', 'Machine not found', 404);
        }

        $count = DiscoveredCommand::forMachine($machineModel->id)->delete();

        return response()->json([
            'success' => true,
            'data' => [
                'deleted_count' => $count,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Search commands across all categories.
     *
     * Performs a text search across command names, descriptions, and aliases.
     * Returns a flat list of matching commands (no pagination, capped by limit).
     *
     * @OA\Get(
     *     path="/api/machines/{machineId}/commands/search",
     *     tags={"Commands"},
     *     summary="Search commands",
     *     description="Performs a text search across command names, descriptions, and aliases. Returns up to `limit` matching commands in a flat list (no pagination).",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="q",
     *         in="query",
     *         required=true,
     *         description="Search query string (minimum 1 character)",
     *         @OA\Schema(type="string", minLength=1)
     *     ),
     *     @OA\Parameter(
     *         name="limit",
     *         in="query",
     *         required=false,
     *         description="Maximum number of results to return",
     *         @OA\Schema(type="integer", default=20, minimum=1, maximum=50)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Search results",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="query", type="string", example="git", description="The search query that was executed"),
     *                 @OA\Property(
     *                     property="results",
     *                     type="array",
     *                     description="Matching commands",
     *                     @OA\Items(ref="#/components/schemas/Command")
     *                 ),
     *                 @OA\Property(property="count", type="integer", example=5, description="Number of matching results")
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
     *                 @OA\Property(property="code", type="string", example="CMD_001"),
     *                 @OA\Property(property="message", type="string", example="Machine not found")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error (missing or empty query)",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="errors", type="object")
     *         )
     *     )
     * )
     */
    public function search(Request $request, string $machine): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('CMD_001', 'Machine not found', 404);
        }

        $validated = $request->validate([
            'q' => 'required|string|min:1',
            'limit' => 'integer|min:1|max:50',
        ]);

        $query = $validated['q'];
        $limit = $validated['limit'] ?? 20;

        $commands = DiscoveredCommand::forMachine($machineModel->id)
            ->search($query)
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'query' => $query,
                'results' => CommandResource::collection($commands),
                'count' => $commands->count(),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Execute a command on the remote machine via the agent.
     *
     * Dispatches a MachineCommand event over the WebSocket channel
     * to instruct the agent to execute the specified command with the
     * provided arguments and options. Execution is asynchronous; the
     * result will arrive via WebSocket events.
     *
     * @OA\Post(
     *     path="/api/machines/{machineId}/commands/{id}/execute",
     *     tags={"Commands"},
     *     summary="Execute a command",
     *     description="Dispatches the command to the remote agent for execution via WebSocket. The execution is asynchronous: results are delivered through WebSocket events on the machine's private channel. Returns a request ID to correlate the response.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="UUID of the command to execute",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\RequestBody(
     *         required=false,
     *         @OA\JsonContent(
     *             @OA\Property(
     *                 property="args",
     *                 type="array",
     *                 nullable=true,
     *                 description="Positional arguments to pass to the command",
     *                 @OA\Items(type="string"),
     *                 example={"--message", "fix: typo in readme"}
     *             ),
     *             @OA\Property(
     *                 property="options",
     *                 type="object",
     *                 nullable=true,
     *                 description="Named options / flags for the command",
     *                 example={"verbose": true, "dry-run": false}
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Command execution dispatched to the agent",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="message", type="string", example="Command execution initiated"),
     *                 @OA\Property(property="command", type="string", example="git:commit", description="Name of the dispatched command"),
     *                 @OA\Property(property="args", type="array", @OA\Items(type="string"), description="Arguments passed"),
     *                 @OA\Property(property="options", type="object", description="Options passed"),
     *                 @OA\Property(property="status", type="string", example="dispatched", description="Always 'dispatched' on success"),
     *                 @OA\Property(property="request_id", type="string", example="cmd_exec_679a3b2e1f4c8", description="Unique ID to correlate WebSocket response")
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
     *         description="Machine or command not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="CMD_002"),
     *                 @OA\Property(property="message", type="string", example="Command not found")
     *             )
     *         )
     *     )
     * )
     */
    public function execute(Request $request, string $machine, string $id): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('CMD_001', 'Machine not found', 404);
        }

        $command = DiscoveredCommand::forMachine($machineModel->id)
            ->find($id);

        if (!$command) {
            return $this->errorResponse('CMD_002', 'Command not found', 404);
        }

        $validated = $request->validate([
            'args' => 'nullable|array',
            'options' => 'nullable|array',
        ]);

        $requestId = uniqid('cmd_exec_');

        // Dispatch execution event to the agent via WebSocket
        MachineCommand::dispatch($command->machine_id, 'commands:execute', [
            'command_name' => $command->name,
            'command_path' => $command->path,
            'args' => $validated['args'] ?? [],
            'options' => $validated['options'] ?? [],
            'request_id' => $requestId,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'message' => 'Command execution initiated',
                'command' => $command->name,
                'args' => $validated['args'] ?? [],
                'options' => $validated['options'] ?? [],
                'status' => 'dispatched',
                'request_id' => $requestId,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Resolve and authorize the machine for the authenticated user.
     *
     * @param  Request  $request  The current HTTP request (for auth context)
     * @param  string   $machineId  UUID of the machine to look up
     * @return Machine|null  The machine if found and owned by the user, null otherwise
     */
    private function getMachine(Request $request, string $machineId): ?Machine
    {
        return $request->user()
            ->machines()
            ->find($machineId);
    }

    /**
     * Build a standardized JSON error response.
     *
     * @param  string  $code     Application-specific error code (e.g. CMD_001)
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
