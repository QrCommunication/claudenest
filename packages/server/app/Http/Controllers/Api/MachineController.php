<?php

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

class MachineController extends Controller
{
    /**
     * List user's machines with pagination.
     *
     * @OA\Get(
     *     path="/api/machines",
     *     tags={"Machines"},
     *     summary="List user's machines",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="search", in="query", required=false, @OA\Schema(type="string")),
     *     @OA\Parameter(name="status", in="query", required=false, @OA\Schema(type="string", enum={"online","offline","connecting"})),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Response(
     *         response=200,
     *         description="Paginated list of machines",
     *         @OA\JsonContent(ref="#/components/schemas/PaginatedResponse")
     *     )
     * )
     */
    public function index(Request $request): JsonResponse
    {
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
     *
     * @OA\Post(
     *     path="/api/machines",
     *     tags={"Machines"},
     *     summary="Register a new machine",
     *     security={{"bearerAuth": {}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/StoreMachineRequest")),
     *     @OA\Response(
     *         response=201,
     *         description="Machine registered successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="machine", ref="#/components/schemas/Machine"),
     *                 @OA\Property(property="token", type="string", example="mn_...")
     *             )
     *         )
     *     )
     * )
     */
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
     *
     * @OA\Get(
     *     path="/api/machines/{id}",
     *     tags={"Machines"},
     *     summary="Get machine details",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(
     *         response=200,
     *         description="Machine details",
     *         @OA\JsonContent(ref="#/components/schemas/Machine")
     *     ),
     *     @OA\Response(response=404, description="Machine not found")
     * )
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $machine = $request->user()
            ->machines()
            ->withCount(['sessions as active_sessions_count' => function ($q) {
                $q->whereIn('status', ['running', 'waiting_input']);
            }])
            ->find($id);

        if (!$machine) {
            return $this->errorResponse('MCH_001', 'Machine not found', 404);
        }

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
     *
     * @OA\Patch(
     *     path="/api/machines/{id}",
     *     tags={"Machines"},
     *     summary="Update machine",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/UpdateMachineRequest")),
     *     @OA\Response(
     *         response=200,
     *         description="Machine updated",
     *         @OA\JsonContent(ref="#/components/schemas/Machine")
     *     ),
     *     @OA\Response(response=404, description="Machine not found")
     * )
     */
    public function update(UpdateMachineRequest $request, string $id): JsonResponse
    {
        $machine = $request->user()->machines()->find($id);

        if (!$machine) {
            return $this->errorResponse('MCH_001', 'Machine not found', 404);
        }

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
     * @OA\Delete(
     *     path="/api/machines/{id}",
     *     tags={"Machines"},
     *     summary="Delete machine",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(
     *         response=200,
     *         description="Machine deleted",
     *         @OA\JsonContent(ref="#/components/schemas/DeletedResponse")
     *     ),
     *     @OA\Response(response=404, description="Machine not found")
     * )
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $machine = $request->user()->machines()->find($id);

        if (!$machine) {
            return $this->errorResponse('MCH_001', 'Machine not found', 404);
        }

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
     *
     * @OA\Post(
     *     path="/api/machines/{id}/wake",
     *     tags={"Machines"},
     *     summary="Wake machine via Wake-on-LAN",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(response=200, description="Wake-on-LAN command dispatched"),
     *     @OA\Response(response=400, description="Machine is already online or does not support Wake-on-LAN"),
     *     @OA\Response(response=404, description="Machine not found")
     * )
     */
    public function wake(Request $request, string $id): JsonResponse
    {
        $machine = $request->user()->machines()->find($id);

        if (!$machine) {
            return $this->errorResponse('MCH_001', 'Machine not found', 404);
        }

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
     * @OA\Get(
     *     path="/api/machines/{id}/environment",
     *     tags={"Machines"},
     *     summary="Get machine environment info",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(
     *         response=200,
     *         description="Machine environment data",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="platform", type="string", example="linux"),
     *                 @OA\Property(property="hostname", type="string", example="my-machine"),
     *                 @OA\Property(property="arch", type="string", example="x64"),
     *                 @OA\Property(property="node_version", type="string", example="20.0.0"),
     *                 @OA\Property(property="agent_version", type="string", example="1.0.0"),
     *                 @OA\Property(property="claude_version", type="string", example="1.0.0"),
     *                 @OA\Property(property="claude_path", type="string", example="/usr/local/bin/claude"),
     *                 @OA\Property(property="capabilities", type="object"),
     *                 @OA\Property(property="max_sessions", type="integer", example=10),
     *                 @OA\Property(property="fresh_data_requested", type="boolean", example=true)
     *             )
     *         )
     *     ),
     *     @OA\Response(response=400, description="Machine is offline"),
     *     @OA\Response(response=404, description="Machine not found")
     * )
     */
    public function environment(Request $request, string $id): JsonResponse
    {
        $machine = $request->user()->machines()->find($id);

        if (!$machine) {
            return $this->errorResponse('MCH_001', 'Machine not found', 404);
        }

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
     * @OA\Post(
     *     path="/api/machines/{id}/regenerate-token",
     *     tags={"Machines"},
     *     summary="Generate new machine token",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(
     *         response=200,
     *         description="New token generated",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="token", type="string", example="mn_...")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, description="Machine not found")
     * )
     */
    public function regenerateToken(Request $request, string $id): JsonResponse
    {
        $machine = $request->user()->machines()->find($id);

        if (!$machine) {
            return $this->errorResponse('MCH_001', 'Machine not found', 404);
        }

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
