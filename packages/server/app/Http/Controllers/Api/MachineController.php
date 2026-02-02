<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMachineRequest;
use App\Http\Requests\UpdateMachineRequest;
use App\Http\Resources\MachineResource;
use App\Models\Machine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MachineController extends Controller
{
    /**
     * List user's machines with pagination.
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

        // In a real implementation, this would trigger a WoL packet
        // through a background job or websocket command to an online machine
        // on the same network, or via a configured WoL proxy

        return response()->json([
            'success' => true,
            'data' => [
                'message' => 'Wake-on-LAN signal sent',
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

        // This would typically be fetched from the agent via WebSocket
        // For now, return stored capabilities
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
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Generate new machine token.
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
