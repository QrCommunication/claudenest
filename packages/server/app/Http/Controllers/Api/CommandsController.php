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

        // Apply search filter
        if ($search) {
            $query->search($search);
        }

        // Apply category filter
        if ($category) {
            $query->byCategory($category);
        }

        // Apply skill filter
        if ($skillPath) {
            $query->bySkill($skillPath);
        }

        $commands = $query->orderBy('category')
            ->orderBy('name')
            ->paginate($perPage);

        // Get category counts
        $categoryCounts = DiscoveredCommand::forMachine($machineModel->id)
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category')
            ->toArray();

        // Get skill counts
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
     * Get command details.
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

        // Get related commands (same category)
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
     * Register a discovered command.
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

        // Check if command already exists
        $existing = DiscoveredCommand::forMachine($machineModel->id)
            ->where('name', $validated['name'])
            ->first();

        if ($existing) {
            // Update existing command
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
     * Bulk register commands.
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
     * Delete a command.
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
     * Execute a command (proxy to agent).
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
