<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MachineController extends Controller
{
    /**
     * List user's machines.
     */
    public function index(Request $request): JsonResponse
    {
        $machines = $request->user()
            ->machines()
            ->withCount(['sessions as active_sessions_count' => function ($q) {
                $q->whereIn('status', ['running', 'waiting_input']);
            }])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(fn ($machine) => $this->formatMachine($machine));

        return response()->json([
            'success' => true,
            'data' => $machines,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Register a new machine.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'platform' => 'required|string|in:darwin,win32,linux',
            'hostname' => 'nullable|string|max:255',
            'arch' => 'nullable|string|max:50',
            'node_version' => 'nullable|string|max:50',
            'agent_version' => 'nullable|string|max:50',
            'claude_version' => 'nullable|string|max:50',
            'claude_path' => 'nullable|string|max:512',
            'capabilities' => 'array',
            'max_sessions' => 'integer|min:1|max:100',
        ]);

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

        return response()->json([
            'success' => true,
            'data' => [
                'machine' => $this->formatMachine($machine),
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
            'data' => $this->formatMachine($machine),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Update machine.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $machine = $request->user()->machines()->find($id);

        if (!$machine) {
            return $this->errorResponse('MCH_001', 'Machine not found', 404);
        }

        $validated = $request->validate([
            'name' => 'string|max:255',
            'claude_version' => 'nullable|string|max:50',
            'claude_path' => 'nullable|string|max:512',
            'capabilities' => 'array',
            'max_sessions' => 'integer|min:1|max:100',
        ]);

        $machine->update($validated);

        return response()->json([
            'success' => true,
            'data' => $this->formatMachine($machine),
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
     * Helper: Format machine data.
     */
    private function formatMachine(Machine $machine): array
    {
        return [
            'id' => $machine->id,
            'name' => $machine->name,
            'platform' => $machine->platform,
            'hostname' => $machine->hostname,
            'arch' => $machine->arch,
            'status' => $machine->status,
            'is_online' => $machine->is_online,
            'claude_version' => $machine->claude_version,
            'agent_version' => $machine->agent_version,
            'capabilities' => $machine->capabilities,
            'max_sessions' => $machine->max_sessions,
            'active_sessions_count' => $machine->active_sessions_count ?? 0,
            'last_seen_at' => $machine->last_seen_at,
            'connected_at' => $machine->connected_at,
            'created_at' => $machine->created_at,
            'updated_at' => $machine->updated_at,
        ];
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
