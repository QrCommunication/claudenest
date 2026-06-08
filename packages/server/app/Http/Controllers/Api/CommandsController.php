<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Events\MachineCommand;
use App\Http\Controllers\Controller;
use App\Http\Resources\CommandResource;
use App\Models\DiscoveredCommand;
use App\Models\Machine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class CommandsController extends Controller
{
    /**
     * List discovered commands for a machine.
     */
    #[OA\Get(
        path: '/api/machines/{machineId}/commands',
        summary: 'List machine commands',
        description: 'Returns a paginated list of commands for the specified machine, with optional filtering by search term, category, and skill path. Category and skill counts are included in the response meta.',
        security: [['bearerAuth' => []]],
        tags: ['Commands'],
        parameters: [
            new OA\Parameter(name: 'machineId', in: 'path', required: true, description: 'UUID of the machine', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'search', in: 'query', required: false, description: 'Search term to filter commands by name, description, or aliases', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'category', in: 'query', required: false, description: 'Filter by command category', schema: new OA\Schema(type: 'string', enum: ['general', 'git', 'file', 'search', 'build', 'test', 'deploy', 'docker', 'npm', 'composer'])),
            new OA\Parameter(name: 'skill_path', in: 'query', required: false, description: "Filter by originating skill path (e.g. 'git/commit')", schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, description: 'Number of results per page', schema: new OA\Schema(type: 'integer', default: 50, minimum: 1, maximum: 100)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated command list with category and skill counts',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/DiscoveredCommand')),
                        new OA\Property(
                            property: 'meta',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'timestamp', type: 'string', format: 'date-time'),
                                new OA\Property(property: 'request_id', type: 'string'),
                                new OA\Property(
                                    property: 'categories',
                                    type: 'object',
                                    description: 'Map of category name to command count',
                                    additionalProperties: new OA\AdditionalProperties(type: 'integer')
                                ),
                                new OA\Property(
                                    property: 'skills',
                                    type: 'object',
                                    description: 'Map of skill path to command count',
                                    additionalProperties: new OA\AdditionalProperties(type: 'integer')
                                ),
                                new OA\Property(
                                    property: 'pagination',
                                    type: 'object',
                                    properties: [
                                        new OA\Property(property: 'current_page', type: 'integer'),
                                        new OA\Property(property: 'last_page', type: 'integer'),
                                        new OA\Property(property: 'per_page', type: 'integer'),
                                        new OA\Property(property: 'total', type: 'integer'),
                                    ]
                                ),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: 'Machine not found',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: false),
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'code', type: 'string', example: 'CMD_001'),
                                new OA\Property(property: 'message', type: 'string', example: 'Machine not found'),
                            ]
                        ),
                    ]
                )
            ),
        ],
    )]
    public function index(Request $request, string $machine): JsonResponse
    {
        $machineModel = Machine::findOrFail($machine);
        $this->authorize('view', $machineModel);

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
     */
    #[OA\Get(
        path: '/api/machines/{machineId}/commands/{id}',
        summary: 'Get command details',
        description: 'Returns full details of a command identified by its UUID, along with up to 5 related commands in the same category.',
        security: [['bearerAuth' => []]],
        tags: ['Commands'],
        parameters: [
            new OA\Parameter(name: 'machineId', in: 'path', required: true, description: 'UUID of the machine', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'UUID of the command', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Command details with related commands',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'command', ref: '#/components/schemas/DiscoveredCommand'),
                                new OA\Property(property: 'related', type: 'array', description: 'Up to 5 related commands in the same category', items: new OA\Items(ref: '#/components/schemas/DiscoveredCommand')),
                            ]
                        ),
                        new OA\Property(
                            property: 'meta',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'timestamp', type: 'string', format: 'date-time'),
                                new OA\Property(property: 'request_id', type: 'string'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: 'Machine or command not found',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: false),
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'code', type: 'string', example: 'CMD_002'),
                                new OA\Property(property: 'message', type: 'string', example: 'Command not found'),
                            ]
                        ),
                    ]
                )
            ),
        ],
    )]
    public function show(Request $request, string $machine, string $id): JsonResponse
    {
        $machineModel = Machine::findOrFail($machine);
        $this->authorize('view', $machineModel);

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
     */
    #[OA\Post(
        path: '/api/machines/{machineId}/commands',
        summary: 'Register a command',
        description: 'Registers a newly discovered command on the given machine. If a command with the same name already exists, it is updated (upsert). Returns 201 on creation, 200 on update.',
        security: [['bearerAuth' => []]],
        tags: ['Commands'],
        parameters: [
            new OA\Parameter(name: 'machineId', in: 'path', required: true, description: 'UUID of the machine', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'category'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', maxLength: 255, description: 'Unique command name on this machine', example: 'git:commit'),
                    new OA\Property(property: 'description', type: 'string', nullable: true, description: 'Human-readable description', example: 'Commit staged changes'),
                    new OA\Property(property: 'category', type: 'string', maxLength: 100, description: 'Command category', example: 'git'),
                    new OA\Property(
                        property: 'parameters',
                        type: 'array',
                        nullable: true,
                        description: 'List of command parameters',
                        items: new OA\Items(
                            type: 'object',
                            required: ['name'],
                            properties: [
                                new OA\Property(property: 'name', type: 'string', example: 'message'),
                                new OA\Property(property: 'type', type: 'string', example: 'string'),
                                new OA\Property(property: 'required', type: 'boolean', example: true),
                                new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Commit message'),
                            ]
                        )
                    ),
                    new OA\Property(property: 'aliases', type: 'array', nullable: true, description: 'Alternative names for the command', items: new OA\Items(type: 'string'), example: ['gc', 'commit']),
                    new OA\Property(property: 'examples', type: 'array', nullable: true, description: 'Usage examples', items: new OA\Items(type: 'string'), example: ["git commit -m 'fix: typo'"]),
                    new OA\Property(property: 'skill_path', type: 'string', nullable: true, description: 'Path of the skill that provides this command', example: 'git/commit'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Command registered successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', ref: '#/components/schemas/DiscoveredCommand'),
                        new OA\Property(
                            property: 'meta',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'timestamp', type: 'string', format: 'date-time'),
                                new OA\Property(property: 'request_id', type: 'string'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 200,
                description: 'Existing command updated (upsert)',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', ref: '#/components/schemas/DiscoveredCommand'),
                        new OA\Property(
                            property: 'meta',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'timestamp', type: 'string', format: 'date-time'),
                                new OA\Property(property: 'request_id', type: 'string'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: 'Machine not found',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: false),
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'code', type: 'string', example: 'CMD_001'),
                                new OA\Property(property: 'message', type: 'string', example: 'Machine not found'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                        new OA\Property(property: 'errors', type: 'object'),
                    ]
                )
            ),
        ],
    )]
    public function store(Request $request, string $machine): JsonResponse
    {
        $machineModel = Machine::findOrFail($machine);
        $this->authorize('update', $machineModel);

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
     */
    #[OA\Post(
        path: '/api/machines/{machineId}/commands/bulk',
        summary: 'Bulk register commands',
        description: 'Registers multiple commands in a single request. Each command is upserted: created if new, updated if a command with the same name already exists. Returns a summary of created/updated counts.',
        security: [['bearerAuth' => []]],
        tags: ['Commands'],
        parameters: [
            new OA\Parameter(name: 'machineId', in: 'path', required: true, description: 'UUID of the machine', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['commands'],
                properties: [
                    new OA\Property(
                        property: 'commands',
                        type: 'array',
                        description: 'Array of commands to register',
                        items: new OA\Items(
                            type: 'object',
                            required: ['name', 'category'],
                            properties: [
                                new OA\Property(property: 'name', type: 'string', maxLength: 255, example: 'git:commit'),
                                new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Commit staged changes'),
                                new OA\Property(property: 'category', type: 'string', maxLength: 100, example: 'git'),
                                new OA\Property(property: 'parameters', type: 'array', nullable: true, items: new OA\Items(type: 'object')),
                                new OA\Property(property: 'aliases', type: 'array', nullable: true, items: new OA\Items(type: 'string')),
                                new OA\Property(property: 'examples', type: 'array', nullable: true, items: new OA\Items(type: 'string')),
                                new OA\Property(property: 'skill_path', type: 'string', nullable: true, example: 'git/commit'),
                            ]
                        )
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Bulk operation result summary',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'created', type: 'integer', description: 'Number of newly created commands', example: 8),
                                new OA\Property(property: 'updated', type: 'integer', description: 'Number of existing commands updated', example: 3),
                                new OA\Property(property: 'total', type: 'integer', description: 'Total commands processed', example: 11),
                            ]
                        ),
                        new OA\Property(
                            property: 'meta',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'timestamp', type: 'string', format: 'date-time'),
                                new OA\Property(property: 'request_id', type: 'string'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: 'Machine not found',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: false),
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'code', type: 'string', example: 'CMD_001'),
                                new OA\Property(property: 'message', type: 'string', example: 'Machine not found'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                        new OA\Property(property: 'errors', type: 'object'),
                    ]
                )
            ),
        ],
    )]
    public function bulkStore(Request $request, string $machine): JsonResponse
    {
        $machineModel = Machine::findOrFail($machine);
        $this->authorize('update', $machineModel);

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
     */
    #[OA\Delete(
        path: '/api/machines/{machineId}/commands/{id}',
        summary: 'Delete a command',
        description: "Permanently deletes a single command identified by its UUID from the machine's command registry.",
        security: [['bearerAuth' => []]],
        tags: ['Commands'],
        parameters: [
            new OA\Parameter(name: 'machineId', in: 'path', required: true, description: 'UUID of the machine', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'UUID of the command to delete', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Command deleted successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', type: 'null', example: null),
                        new OA\Property(
                            property: 'meta',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'timestamp', type: 'string', format: 'date-time'),
                                new OA\Property(property: 'request_id', type: 'string'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: 'Machine or command not found',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: false),
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'code', type: 'string', example: 'CMD_002'),
                                new OA\Property(property: 'message', type: 'string', example: 'Command not found'),
                            ]
                        ),
                    ]
                )
            ),
        ],
    )]
    public function destroy(Request $request, string $machine, string $id): JsonResponse
    {
        $machineModel = Machine::findOrFail($machine);
        $this->authorize('update', $machineModel);

        $command = DiscoveredCommand::forMachine($machineModel->id)
            ->findOrFail($id);

        $this->authorize('delete', $command);

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
     */
    #[OA\Delete(
        path: '/api/machines/{machineId}/commands',
        summary: 'Clear all commands',
        description: 'Permanently deletes all commands registered on the given machine. Returns the number of deleted commands. Typically used before a full re-discovery sweep.',
        security: [['bearerAuth' => []]],
        tags: ['Commands'],
        parameters: [
            new OA\Parameter(name: 'machineId', in: 'path', required: true, description: 'UUID of the machine', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'All commands cleared',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'deleted_count', type: 'integer', description: 'Number of commands deleted', example: 42),
                            ]
                        ),
                        new OA\Property(
                            property: 'meta',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'timestamp', type: 'string', format: 'date-time'),
                                new OA\Property(property: 'request_id', type: 'string'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: 'Machine not found',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: false),
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'code', type: 'string', example: 'CMD_001'),
                                new OA\Property(property: 'message', type: 'string', example: 'Machine not found'),
                            ]
                        ),
                    ]
                )
            ),
        ],
    )]
    public function clear(Request $request, string $machine): JsonResponse
    {
        $machineModel = Machine::findOrFail($machine);
        $this->authorize('update', $machineModel);

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
     */
    #[OA\Get(
        path: '/api/machines/{machineId}/commands/search',
        summary: 'Search commands',
        description: 'Performs a text search across command names, descriptions, and aliases. Returns up to `limit` matching commands in a flat list (no pagination).',
        security: [['bearerAuth' => []]],
        tags: ['Commands'],
        parameters: [
            new OA\Parameter(name: 'machineId', in: 'path', required: true, description: 'UUID of the machine', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'q', in: 'query', required: true, description: 'Search query string (minimum 1 character)', schema: new OA\Schema(type: 'string', minLength: 1)),
            new OA\Parameter(name: 'limit', in: 'query', required: false, description: 'Maximum number of results to return', schema: new OA\Schema(type: 'integer', default: 20, minimum: 1, maximum: 50)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Search results',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'query', type: 'string', description: 'The search query that was executed', example: 'git'),
                                new OA\Property(property: 'results', type: 'array', description: 'Matching commands', items: new OA\Items(ref: '#/components/schemas/DiscoveredCommand')),
                                new OA\Property(property: 'count', type: 'integer', description: 'Number of matching results', example: 5),
                            ]
                        ),
                        new OA\Property(
                            property: 'meta',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'timestamp', type: 'string', format: 'date-time'),
                                new OA\Property(property: 'request_id', type: 'string'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: 'Machine not found',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: false),
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'code', type: 'string', example: 'CMD_001'),
                                new OA\Property(property: 'message', type: 'string', example: 'Machine not found'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error (missing or empty query)',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                        new OA\Property(property: 'errors', type: 'object'),
                    ]
                )
            ),
        ],
    )]
    public function search(Request $request, string $machine): JsonResponse
    {
        $machineModel = Machine::findOrFail($machine);
        $this->authorize('view', $machineModel);

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
     */
    #[OA\Post(
        path: '/api/machines/{machineId}/commands/{id}/execute',
        summary: 'Execute a command',
        description: 'Dispatches the command to the remote agent for execution via WebSocket. The execution is asynchronous: results are delivered through WebSocket events on the machine\'s private channel. Returns a request ID to correlate the response.',
        security: [['bearerAuth' => []]],
        tags: ['Commands'],
        parameters: [
            new OA\Parameter(name: 'machineId', in: 'path', required: true, description: 'UUID of the machine', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'UUID of the command to execute', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'args', type: 'array', nullable: true, description: 'Positional arguments to pass to the command', items: new OA\Items(type: 'string'), example: ['--message', 'fix: typo in readme']),
                    new OA\Property(property: 'options', type: 'object', nullable: true, description: 'Named options / flags for the command', example: ['verbose' => true, 'dry-run' => false]),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Command execution dispatched to the agent',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'message', type: 'string', example: 'Command execution initiated'),
                                new OA\Property(property: 'command', type: 'string', description: 'Name of the dispatched command', example: 'git:commit'),
                                new OA\Property(property: 'args', type: 'array', description: 'Arguments passed', items: new OA\Items(type: 'string')),
                                new OA\Property(property: 'options', type: 'object', description: 'Options passed'),
                                new OA\Property(property: 'status', type: 'string', description: "Always 'dispatched' on success", example: 'dispatched'),
                                new OA\Property(property: 'request_id', type: 'string', description: 'Unique ID to correlate WebSocket response', example: 'cmd_exec_679a3b2e1f4c8'),
                            ]
                        ),
                        new OA\Property(
                            property: 'meta',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'timestamp', type: 'string', format: 'date-time'),
                                new OA\Property(property: 'request_id', type: 'string'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: 'Machine or command not found',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: false),
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'code', type: 'string', example: 'CMD_002'),
                                new OA\Property(property: 'message', type: 'string', example: 'Command not found'),
                            ]
                        ),
                    ]
                )
            ),
        ],
    )]
    public function execute(Request $request, string $machine, string $id): JsonResponse
    {
        $machineModel = Machine::findOrFail($machine);
        $this->authorize('update', $machineModel);

        $command = DiscoveredCommand::forMachine($machineModel->id)
            ->findOrFail($id);

        $this->authorize('execute', $command);

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
    protected function errorResponse(string $code, string $message, int $status): JsonResponse
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
