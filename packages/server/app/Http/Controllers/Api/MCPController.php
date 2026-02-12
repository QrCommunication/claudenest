<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MCPResource;
use App\Models\Machine;
use App\Models\MCPServer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Events\MachineCommand;
use Illuminate\Support\Facades\Log;

class MCPController extends Controller
{
    /**
     * List MCP servers for a machine.
     */
    public function index(Request $request, string $machine): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('MCP_001', 'Machine not found', 404);
        }

        $status = $request->input('status');
        $transport = $request->input('transport');

        $query = MCPServer::forMachine($machineModel->id);

        // Apply status filter
        if ($status && in_array($status, MCPServer::STATUSES)) {
            $query->where('status', $status);
        }

        // Apply transport filter
        if ($transport && in_array($transport, MCPServer::TRANSPORTS)) {
            $query->byTransport($transport);
        }

        $servers = $query->orderBy('name')->get();

        // Aggregate stats
        $stats = [
            'total' => $servers->count(),
            'running' => $servers->where('status', 'running')->count(),
            'stopped' => $servers->where('status', 'stopped')->count(),
            'error' => $servers->where('status', 'error')->count(),
            'total_tools' => $servers->sum(fn ($s) => count($s->tools ?? [])),
        ];

        return response()->json([
            'success' => true,
            'data' => MCPResource::collection($servers),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
                'stats' => $stats,
            ],
        ]);
    }

    /**
     * Get MCP server details.
     */
    public function show(Request $request, string $machine, string $name): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('MCP_001', 'Machine not found', 404);
        }

        $server = MCPServer::forMachine($machineModel->id)
            ->where('name', $name)
            ->first();

        if (!$server) {
            return $this->errorResponse('MCP_002', 'MCP server not found', 404);
        }

        return response()->json([
            'success' => true,
            'data' => new MCPResource($server),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Register a new MCP server.
     */
    public function store(Request $request, string $machine): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('MCP_001', 'Machine not found', 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'display_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'transport' => 'required|string|in:' . implode(',', MCPServer::TRANSPORTS),
            'command' => 'required_if:transport,stdio|string|nullable',
            'url' => 'required_if:transport,sse,http,websocket|url|nullable',
            'env_vars' => 'nullable|array',
            'config' => 'nullable|array',
        ]);

        // Check if server with same name exists
        $existing = MCPServer::forMachine($machineModel->id)
            ->where('name', $validated['name'])
            ->first();

        if ($existing) {
            return $this->errorResponse('MCP_003', 'MCP server with this name already exists', 409);
        }

        $server = MCPServer::create([
            'machine_id' => $machineModel->id,
            'name' => $validated['name'],
            'display_name' => $validated['display_name'] ?? null,
            'description' => $validated['description'] ?? null,
            'transport' => $validated['transport'],
            'command' => $validated['command'] ?? null,
            'url' => $validated['url'] ?? null,
            'env_vars' => $validated['env_vars'] ?? [],
            'config' => $validated['config'] ?? [],
            'status' => 'stopped',
            'tools' => [],
        ]);

        return response()->json([
            'success' => true,
            'data' => new MCPResource($server),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Start MCP server.
     */
    public function start(Request $request, string $machine, string $name): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('MCP_001', 'Machine not found', 404);
        }

        $server = MCPServer::forMachine($machineModel->id)
            ->where('name', $name)
            ->first();

        if (!$server) {
            return $this->errorResponse('MCP_002', 'MCP server not found', 404);
        }

        // Check if already running
        if ($server->is_running) {
            return $this->errorResponse('MCP_004', 'MCP server is already running', 400);
        }

        // Mark as starting
        $server->markAsStarting();

        // Dispatch command to the agent via WebSocket broadcast
        MachineCommand::dispatch($server->machine_id, 'mcp:start', [
            'server_name' => $name,
            'config' => $server->toArray(),
        ]);

        Log::info("MCP server '{$server->name}' start requested", [
            'machine_id' => $machineModel->id,
            'server_id' => $server->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'message' => 'MCP server start initiated',
                'status' => 'starting',
                'server' => new MCPResource($server),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Stop MCP server.
     */
    public function stop(Request $request, string $machine, string $name): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('MCP_001', 'Machine not found', 404);
        }

        $server = MCPServer::forMachine($machineModel->id)
            ->where('name', $name)
            ->first();

        if (!$server) {
            return $this->errorResponse('MCP_002', 'MCP server not found', 404);
        }

        // Check if already stopped
        if ($server->is_stopped) {
            return $this->errorResponse('MCP_005', 'MCP server is already stopped', 400);
        }

        // Mark as stopping
        $server->markAsStopping();

        // Dispatch command to the agent via WebSocket broadcast
        MachineCommand::dispatch($server->machine_id, 'mcp:stop', [
            'server_name' => $name,
        ]);

        Log::info("MCP server '{$server->name}' stop requested", [
            'machine_id' => $machineModel->id,
            'server_id' => $server->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'message' => 'MCP server stop initiated',
                'status' => 'stopping',
                'server' => new MCPResource($server),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Get available tools from MCP server.
     */
    public function tools(Request $request, string $machine, string $name): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('MCP_001', 'Machine not found', 404);
        }

        $server = MCPServer::forMachine($machineModel->id)
            ->where('name', $name)
            ->first();

        if (!$server) {
            return $this->errorResponse('MCP_002', 'MCP server not found', 404);
        }

        // Dispatch a fresh tool discovery request to the agent if the server is running.
        // The cached tools are returned immediately; the agent will update them
        // asynchronously via WebSocket once discovery completes.
        if ($server->status === 'running') {
            MachineCommand::dispatch($server->machine_id, 'mcp:list_tools', [
                'server_name' => $name,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'server' => new MCPResource($server),
                'tools' => $server->tools ?? [],
                'count' => count($server->tools ?? []),
                'fresh_data_requested' => $server->status === 'running',
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Update MCP server configuration.
     */
    public function update(Request $request, string $machine, string $name): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('MCP_001', 'Machine not found', 404);
        }

        $server = MCPServer::forMachine($machineModel->id)
            ->where('name', $name)
            ->first();

        if (!$server) {
            return $this->errorResponse('MCP_002', 'MCP server not found', 404);
        }

        $validated = $request->validate([
            'display_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'command' => 'nullable|string',
            'url' => 'nullable|url',
            'env_vars' => 'nullable|array',
            'config' => 'nullable|array',
        ]);

        // Prevent updating transport - would require re-creation
        unset($validated['transport']);

        $server->update($validated);

        return response()->json([
            'success' => true,
            'data' => new MCPResource($server),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Delete MCP server.
     */
    public function destroy(Request $request, string $machine, string $name): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('MCP_001', 'Machine not found', 404);
        }

        $server = MCPServer::forMachine($machineModel->id)
            ->where('name', $name)
            ->first();

        if (!$server) {
            return $this->errorResponse('MCP_002', 'MCP server not found', 404);
        }

        // Stop if running
        if ($server->is_running) {
            $server->markAsStopped();
        }

        $server->delete();

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
     * Get all tools from all MCP servers.
     */
    public function allTools(Request $request, string $machine): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('MCP_001', 'Machine not found', 404);
        }

        $servers = MCPServer::forMachine($machineModel->id)
            ->running()
            ->get();

        $allTools = [];

        foreach ($servers as $server) {
            foreach ($server->tools ?? [] as $tool) {
                $allTools[] = [
                    'name' => $tool['name'] ?? 'unknown',
                    'description' => $tool['description'] ?? '',
                    'parameters' => $tool['parameters'] ?? [],
                    'server' => [
                        'id' => $server->id,
                        'name' => $server->name,
                        'display_name' => $server->display_name,
                    ],
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'tools' => $allTools,
                'count' => count($allTools),
                'servers_count' => $servers->count(),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Execute a tool on an MCP server.
     */
    public function executeTool(Request $request, string $machine, string $name): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('MCP_001', 'Machine not found', 404);
        }

        $server = MCPServer::forMachine($machineModel->id)
            ->where('name', $name)
            ->first();

        if (!$server) {
            return $this->errorResponse('MCP_002', 'MCP server not found', 404);
        }

        if (!$server->is_running) {
            return $this->errorResponse('MCP_006', 'MCP server is not running', 400);
        }

        $validated = $request->validate([
            'tool' => 'required|string',
            'params' => 'nullable|array',
        ]);

        $toolName = $validated['tool'];
        $params = $validated['params'] ?? [];

        // Verify tool exists
        if (!$server->hasTool($toolName)) {
            return $this->errorResponse('MCP_007', "Tool '{$toolName}' not found on this server", 404);
        }

        $requestId = uniqid('mcp_tool_');

        // Dispatch tool execution command to the agent via WebSocket broadcast
        MachineCommand::dispatch($server->machine_id, 'mcp:call_tool', [
            'server_name' => $name,
            'tool_name' => $toolName,
            'arguments' => $params,
            'request_id' => $requestId,
        ]);

        Log::info("MCP tool execution requested", [
            'machine_id' => $machineModel->id,
            'server_id' => $server->id,
            'tool' => $toolName,
            'params' => $params,
            'request_id' => $requestId,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'message' => 'Tool execution initiated',
                'tool' => $toolName,
                'params' => $params,
                'status' => 'executing',
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
