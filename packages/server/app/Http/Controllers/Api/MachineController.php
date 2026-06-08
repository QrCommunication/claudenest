<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMachineRequest;
use App\Http\Requests\UpdateMachineRequest;
use App\Http\Resources\MachineResource;
use App\Events\MachineCommand;
use App\Models\Machine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

class MachineController extends Controller
{
    /**
     * List user's machines with pagination.
     */
    #[OA\Get(
        path: '/api/machines',
        summary: "List user's machines",
        security: [['bearerAuth' => []]],
        tags: ['Machines'],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['online', 'offline', 'connecting'])),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 15)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated list of machines',
                content: new OA\JsonContent(ref: '#/components/schemas/PaginatedResponse')
            ),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Machine::class);
        
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search');
        $status = $request->input('status');

        $query = $request->user()
            ->machines()
            ->withCount(['sessions as active_sessions_count' => function ($q) {
                $q->whereIn('status', ['running', 'waiting_input']);
            }]);

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('hostname', 'like', "%{$search}%");
            });
        }

        // Apply status filter
        if ($status && in_array($status, Machine::STATUSES)) {
            $query->where('status', $status);
        }

        $machines = $query->orderBy('updated_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => MachineResource::collection($machines),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
                'pagination' => [
                    'current_page' => $machines->currentPage(),
                    'last_page' => $machines->lastPage(),
                    'per_page' => $machines->perPage(),
                    'total' => $machines->total(),
                ],
            ],
        ]);
    }

    /**
     * Register a new machine.
     */
    #[OA\Post(
        path: '/api/machines',
        summary: 'Register a new machine',
        security: [['bearerAuth' => []]],
        tags: ['Machines'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/StoreMachineRequest')
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Machine registered successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'machine', ref: '#/components/schemas/Machine'),
                                new OA\Property(property: 'token', type: 'string', example: 'mn_...'),
                            ]
                        ),
                    ]
                )
            ),
        ]
    )]
    public function store(StoreMachineRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Check if machine name already exists for user
        $existing = $request->user()
            ->machines()
            ->where('name', $validated['name'])
            ->first();

        if ($existing) {
            // Update existing machine
            $existing->update([
                'platform' => $validated['platform'],
                'hostname' => $validated['hostname'] ?? null,
                'arch' => $validated['arch'] ?? null,
                'node_version' => $validated['node_version'] ?? null,
                'agent_version' => $validated['agent_version'] ?? null,
                'claude_version' => $validated['claude_version'] ?? null,
                'claude_path' => $validated['claude_path'] ?? null,
                'capabilities' => $validated['capabilities'] ?? [],
                'max_sessions' => $validated['max_sessions'] ?? 10,
                'status' => 'online',
                'connected_at' => now(),
                'last_seen_at' => now(),
            ]);

            $token = $existing->generateToken();
            $machine = $existing;
        } else {
            // Create new machine
            $machine = $request->user()->machines()->create([
                'name' => $validated['name'],
                'platform' => $validated['platform'],
                'hostname' => $validated['hostname'] ?? null,
                'arch' => $validated['arch'] ?? null,
                'node_version' => $validated['node_version'] ?? null,
                'agent_version' => $validated['agent_version'] ?? null,
                'claude_version' => $validated['claude_version'] ?? null,
                'claude_path' => $validated['claude_path'] ?? null,
                'capabilities' => $validated['capabilities'] ?? [],
                'max_sessions' => $validated['max_sessions'] ?? 10,
                'status' => 'online',
                'connected_at' => now(),
                'last_seen_at' => now(),
            ]);

            $token = $machine->generateToken();
        }

        // Load active sessions count
        $machine->loadCount(['sessions as active_sessions_count' => function ($q) {
            $q->whereIn('status', ['running', 'waiting_input']);
        }]);

        return response()->json([
            'success' => true,
            'data' => [
                'machine' => new MachineResource($machine),
                'token' => $token,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Show machine details.
     */
    #[OA\Get(
        path: '/api/machines/{id}',
        summary: 'Get machine details',
        security: [['bearerAuth' => []]],
        tags: ['Machines'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Machine details', content: new OA\JsonContent(ref: '#/components/schemas/Machine')),
            new OA\Response(response: 404, description: 'Machine not found'),
        ]
    )]
    public function show(Request $request, string $id): JsonResponse
    {
        $machine = Machine::withCount(['sessions as active_sessions_count' => function ($q) {
            $q->whereIn('status', ['running', 'waiting_input']);
        }])->findOrFail($id);
        
        $this->authorize('view', $machine);

        return response()->json([
            'success' => true,
            'data' => new MachineResource($machine),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Update machine.
     */
    #[OA\Patch(
        path: '/api/machines/{id}',
        summary: 'Update machine',
        security: [['bearerAuth' => []]],
        tags: ['Machines'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/UpdateMachineRequest')
        ),
        responses: [
            new OA\Response(response: 200, description: 'Machine updated', content: new OA\JsonContent(ref: '#/components/schemas/Machine')),
            new OA\Response(response: 404, description: 'Machine not found'),
        ]
    )]
    public function update(UpdateMachineRequest $request, string $id): JsonResponse
    {
        $machine = Machine::findOrFail($id);
        $this->authorize('update', $machine);

        $machine->update($request->validated());

        // Load active sessions count
        $machine->loadCount(['sessions as active_sessions_count' => function ($q) {
            $q->whereIn('status', ['running', 'waiting_input']);
        }]);

        return response()->json([
            'success' => true,
            'data' => new MachineResource($machine),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Delete machine.
     *
     * Terminates all active sessions before removing the machine record.
     */
    #[OA\Delete(
        path: '/api/machines/{id}',
        summary: 'Delete machine',
        security: [['bearerAuth' => []]],
        tags: ['Machines'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Machine deleted', content: new OA\JsonContent(ref: '#/components/schemas/DeletedResponse')),
            new OA\Response(response: 404, description: 'Machine not found'),
        ]
    )]
    public function destroy(Request $request, string $id): JsonResponse
    {
        $machine = Machine::findOrFail($id);
        $this->authorize('delete', $machine);

        // Terminate active sessions
        $machine->sessions()
            ->whereIn('status', ['created', 'starting', 'running', 'waiting_input'])
            ->update(['status' => 'terminated', 'completed_at' => now()]);

        $machine->delete();

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
     * Wake-on-LAN for machine.
     */
    #[OA\Post(
        path: '/api/machines/{id}/wake',
        summary: 'Wake machine via Wake-on-LAN',
        security: [['bearerAuth' => []]],
        tags: ['Machines'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Wake-on-LAN command dispatched'),
            new OA\Response(response: 400, description: 'Machine is already online or does not support Wake-on-LAN'),
            new OA\Response(response: 404, description: 'Machine not found'),
        ]
    )]
    public function wake(Request $request, string $id): JsonResponse
    {
        $machine = Machine::findOrFail($id);
        $this->authorize('update', $machine);

        // Check if machine supports WoL
        if (!$machine->hasCapability('wake_on_lan')) {
            return $this->errorResponse('MCH_003', 'Machine does not support Wake-on-LAN', 400);
        }

        // Check if machine is already online
        if ($machine->is_online) {
            return $this->errorResponse('MCH_004', 'Machine is already online', 400);
        }

        // Update status to connecting
        $machine->update(['status' => 'connecting']);

        // Dispatch wake command to the agent via WebSocket broadcast
        MachineCommand::dispatch($machine->id, 'machine:wake', []);

        return response()->json([
            'success' => true,
            'data' => [
                'message' => 'Wake-on-LAN command dispatched',
                'command_dispatched' => true,
                'machine' => new MachineResource($machine),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Get machine environment info.
     *
     * Returns currently stored environment data and requests a fresh update
     * from the agent asynchronously via WebSocket broadcast.
     */
    #[OA\Get(
        path: '/api/machines/{id}/environment',
        summary: 'Get machine environment info',
        security: [['bearerAuth' => []]],
        tags: ['Machines'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Machine environment data',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'platform', type: 'string', example: 'linux'),
                                new OA\Property(property: 'hostname', type: 'string', example: 'my-machine'),
                                new OA\Property(property: 'arch', type: 'string', example: 'x64'),
                                new OA\Property(property: 'node_version', type: 'string', example: '20.0.0'),
                                new OA\Property(property: 'agent_version', type: 'string', example: '1.0.0'),
                                new OA\Property(property: 'claude_version', type: 'string', example: '1.0.0'),
                                new OA\Property(property: 'claude_path', type: 'string', example: '/usr/local/bin/claude'),
                                new OA\Property(property: 'capabilities', type: 'object'),
                                new OA\Property(property: 'max_sessions', type: 'integer', example: 10),
                                new OA\Property(property: 'fresh_data_requested', type: 'boolean', example: true),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 400, description: 'Machine is offline'),
            new OA\Response(response: 404, description: 'Machine not found'),
        ]
    )]
    public function environment(Request $request, string $id): JsonResponse
    {
        $machine = Machine::findOrFail($id);
        $this->authorize('view', $machine);

        if ($machine->status !== 'online') {
            return $this->errorResponse('MCH_002', 'Machine is offline', 400);
        }

        // Request fresh environment data from the agent via WebSocket broadcast.
        // The agent will update the machine record asynchronously via REST callback.
        MachineCommand::dispatch($machine->id, 'machine:get_info', []);

        // Return currently stored data immediately
        return response()->json([
            'success' => true,
            'data' => [
                'platform' => $machine->platform,
                'hostname' => $machine->hostname,
                'arch' => $machine->arch,
                'node_version' => $machine->node_version,
                'agent_version' => $machine->agent_version,
                'claude_version' => $machine->claude_version,
                'claude_path' => $machine->claude_path,
                'capabilities' => $machine->capabilities,
                'max_sessions' => $machine->max_sessions,
                'fresh_data_requested' => true,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Generate new machine token.
     *
     * Invalidates the previous token and issues a fresh one. The agent must
     * reconnect using the new token.
     */
    #[OA\Post(
        path: '/api/machines/{id}/regenerate-token',
        summary: 'Generate new machine token',
        security: [['bearerAuth' => []]],
        tags: ['Machines'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'New token generated',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'token', type: 'string', example: 'mn_...'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Machine not found'),
        ]
    )]
    public function regenerateToken(Request $request, string $id): JsonResponse
    {
        $machine = Machine::findOrFail($id);
        $this->authorize('regenerateToken', $machine);

        $token = $machine->generateToken();

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

}
