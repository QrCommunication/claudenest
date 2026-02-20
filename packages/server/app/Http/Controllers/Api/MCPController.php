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

/**
 * @OA\Tag(
 *     name="MCP Servers",
 *     description="Manage Model Context Protocol servers on machines"
 * )
 */
class MCPController extends Controller
{
    /**
     * List MCP servers for a machine.
     *
     * Returns all MCP servers registered on the given machine, with optional
     * filtering by status and transport type. Includes aggregate statistics
     * (total, running, stopped, error counts, total tools).
     *
     * @OA\Get(
     *     path="/api/machines/{machineId}/mcp",
     *     operationId="listMCPServers",
     *     tags={"MCP Servers"},
     *     summary="List MCP servers for a machine",
     *     description="Retrieve all MCP servers registered on the specified machine with optional status/transport filters and aggregate stats.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="status",
     *         in="query",
     *         required=false,
     *         description="Filter by server status",
     *         @OA\Schema(type="string", enum={"running","stopped","starting","stopping","error"})
     *     ),
     *     @OA\Parameter(
     *         name="transport",
     *         in="query",
     *         required=false,
     *         description="Filter by transport type",
     *         @OA\Schema(type="string", enum={"stdio","sse","http","websocket"})
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="List of MCP servers with aggregate stats",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/MCPServer")
     *             ),
     *             @OA\Property(
     *                 property="meta",
     *                 type="object",
     *                 @OA\Property(property="timestamp", type="string", format="date-time"),
     *                 @OA\Property(property="request_id", type="string"),
     *                 @OA\Property(
     *                     property="stats",
     *                     type="object",
     *                     @OA\Property(property="total", type="integer", example=5),
     *                     @OA\Property(property="running", type="integer", example=2),
     *                     @OA\Property(property="stopped", type="integer", example=2),
     *                     @OA\Property(property="error", type="integer", example=1),
     *                     @OA\Property(property="total_tools", type="integer", example=14)
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
     *                 @OA\Property(property="code", type="string", example="MCP_001"),
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
     * Get MCP server details by name.
     *
     * Returns the full configuration, status, tools, and metadata for a single
     * MCP server identified by its unique name on the machine.
     *
     * @OA\Get(
     *     path="/api/machines/{machineId}/mcp/{name}",
     *     operationId="getMCPServer",
     *     tags={"MCP Servers"},
     *     summary="Get MCP server details",
     *     description="Retrieve full details for a specific MCP server by name, including configuration, status, tools, and timestamps.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="name",
     *         in="path",
     *         required=true,
     *         description="Unique name of the MCP server on this machine",
     *         @OA\Schema(type="string", example="filesystem-server")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="MCP server details",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/MCPServer"),
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
     *         description="Machine or MCP server not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="MCP_002"),
     *                 @OA\Property(property="message", type="string", example="MCP server not found")
     *             )
     *         )
     *     )
     * )
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
     * Register a new MCP server on a machine.
     *
     * Creates a new MCP server registration with the given configuration.
     * The server starts in "stopped" status and must be explicitly started
     * via the start endpoint. Server names must be unique per machine.
     *
     * @OA\Post(
     *     path="/api/machines/{machineId}/mcp",
     *     operationId="registerMCPServer",
     *     tags={"MCP Servers"},
     *     summary="Register an MCP server",
     *     description="Register a new MCP server on the machine. The server is created in 'stopped' status. Names must be unique per machine.",
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
     *             required={"name", "transport"},
     *             @OA\Property(property="name", type="string", maxLength=255, example="filesystem-server", description="Unique server name on this machine"),
     *             @OA\Property(property="display_name", type="string", maxLength=255, nullable=true, example="Filesystem MCP", description="Human-readable display name"),
     *             @OA\Property(property="description", type="string", nullable=true, example="Provides file read/write tools", description="Server description"),
     *             @OA\Property(property="transport", type="string", enum={"stdio","sse","http","websocket"}, example="stdio", description="Transport protocol"),
     *             @OA\Property(property="command", type="string", nullable=true, example="npx -y @modelcontextprotocol/server-filesystem /tmp", description="Command to start the server (required for stdio transport)"),
     *             @OA\Property(property="url", type="string", format="url", nullable=true, example="http://localhost:3001/sse", description="Server URL (required for sse/http/websocket transports)"),
     *             @OA\Property(property="env_vars", type="object", nullable=true, example={"NODE_ENV": "production"}, description="Environment variables passed to the server process"),
     *             @OA\Property(property="config", type="object", nullable=true, example={"timeout": 30}, description="Additional configuration")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="MCP server registered successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/MCPServer"),
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
     *                 @OA\Property(property="code", type="string", example="MCP_001"),
     *                 @OA\Property(property="message", type="string", example="Machine not found")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=409,
     *         description="Server name already exists on this machine",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="MCP_003"),
     *                 @OA\Property(property="message", type="string", example="MCP server with this name already exists")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="The name field is required."),
     *             @OA\Property(property="errors", type="object")
     *         )
     *     )
     * )
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

        // Check if server with same name exists on this machine
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
     * Start an MCP server.
     *
     * Initiates startup of the specified MCP server by dispatching a
     * "mcp:start" command to the machine's agent via WebSocket broadcast.
     * The server is immediately marked as "starting"; the agent will update
     * the status to "running" (or "error") asynchronously once the process
     * has actually started.
     *
     * @OA\Post(
     *     path="/api/machines/{machineId}/mcp/{name}/start",
     *     operationId="startMCPServer",
     *     tags={"MCP Servers"},
     *     summary="Start an MCP server",
     *     description="Dispatch a start command to the agent. The server transitions to 'starting' immediately; the agent updates to 'running' or 'error' asynchronously.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="name",
     *         in="path",
     *         required=true,
     *         description="Unique name of the MCP server",
     *         @OA\Schema(type="string", example="filesystem-server")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Start command dispatched successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="message", type="string", example="MCP server start initiated"),
     *                 @OA\Property(property="status", type="string", example="starting"),
     *                 @OA\Property(property="server", ref="#/components/schemas/MCPServer")
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
     *         response=400,
     *         description="Server is already running",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="MCP_004"),
     *                 @OA\Property(property="message", type="string", example="MCP server is already running")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Machine or MCP server not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="MCP_002"),
     *                 @OA\Property(property="message", type="string", example="MCP server not found")
     *             )
     *         )
     *     )
     * )
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

        // Mark as starting (agent will update to running/error asynchronously)
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
     * Stop an MCP server.
     *
     * Initiates shutdown of the specified MCP server by dispatching a
     * "mcp:stop" command to the machine's agent via WebSocket broadcast.
     * The server is immediately marked as "stopping"; the agent will update
     * the status to "stopped" asynchronously once the process has terminated.
     *
     * @OA\Post(
     *     path="/api/machines/{machineId}/mcp/{name}/stop",
     *     operationId="stopMCPServer",
     *     tags={"MCP Servers"},
     *     summary="Stop an MCP server",
     *     description="Dispatch a stop command to the agent. The server transitions to 'stopping' immediately; the agent updates to 'stopped' asynchronously.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="name",
     *         in="path",
     *         required=true,
     *         description="Unique name of the MCP server",
     *         @OA\Schema(type="string", example="filesystem-server")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Stop command dispatched successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="message", type="string", example="MCP server stop initiated"),
     *                 @OA\Property(property="status", type="string", example="stopping"),
     *                 @OA\Property(property="server", ref="#/components/schemas/MCPServer")
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
     *         response=400,
     *         description="Server is already stopped",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="MCP_005"),
     *                 @OA\Property(property="message", type="string", example="MCP server is already stopped")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Machine or MCP server not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="MCP_002"),
     *                 @OA\Property(property="message", type="string", example="MCP server not found")
     *             )
     *         )
     *     )
     * )
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

        // Mark as stopping (agent will update to stopped asynchronously)
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
     * Get available tools from an MCP server.
     *
     * Returns the cached tool list for the server. If the server is running,
     * a fresh "mcp:list_tools" discovery command is also dispatched to the
     * agent; the agent will update the tool list asynchronously via WebSocket.
     *
     * @OA\Get(
     *     path="/api/machines/{machineId}/mcp/{name}/tools",
     *     operationId="listMCPServerTools",
     *     tags={"MCP Servers"},
     *     summary="List tools for an MCP server",
     *     description="Return cached tools for the server. If the server is running, a fresh discovery request is dispatched to the agent asynchronously.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="name",
     *         in="path",
     *         required=true,
     *         description="Unique name of the MCP server",
     *         @OA\Schema(type="string", example="filesystem-server")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Tool list (possibly cached)",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="server", ref="#/components/schemas/MCPServer"),
     *                 @OA\Property(
     *                     property="tools",
     *                     type="array",
     *                     @OA\Items(
     *                         type="object",
     *                         @OA\Property(property="name", type="string", example="read_file"),
     *                         @OA\Property(property="description", type="string", example="Read a file from disk"),
     *                         @OA\Property(property="parameters", type="object")
     *                     )
     *                 ),
     *                 @OA\Property(property="count", type="integer", example=5),
     *                 @OA\Property(property="fresh_data_requested", type="boolean", example=true, description="Whether an async tool refresh was dispatched to the agent")
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
     *         description="Machine or MCP server not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="MCP_002"),
     *                 @OA\Property(property="message", type="string", example="MCP server not found")
     *             )
     *         )
     *     )
     * )
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
     *
     * Updates mutable configuration fields (display_name, description,
     * command, url, env_vars, config) for the specified MCP server.
     * The transport type cannot be changed after creation — the server
     * must be deleted and re-created with the new transport.
     *
     * @OA\Patch(
     *     path="/api/machines/{machineId}/mcp/{name}",
     *     operationId="updateMCPServer",
     *     tags={"MCP Servers"},
     *     summary="Update MCP server configuration",
     *     description="Update mutable fields of an MCP server. Transport type cannot be changed (delete and recreate instead).",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="name",
     *         in="path",
     *         required=true,
     *         description="Unique name of the MCP server",
     *         @OA\Schema(type="string", example="filesystem-server")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="display_name", type="string", maxLength=255, nullable=true, example="Filesystem MCP v2"),
     *             @OA\Property(property="description", type="string", nullable=true, example="Updated description"),
     *             @OA\Property(property="command", type="string", nullable=true, example="npx -y @modelcontextprotocol/server-filesystem /home"),
     *             @OA\Property(property="url", type="string", format="url", nullable=true, example="http://localhost:3002/sse"),
     *             @OA\Property(property="env_vars", type="object", nullable=true, example={"NODE_ENV": "development"}),
     *             @OA\Property(property="config", type="object", nullable=true, example={"timeout": 60})
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="MCP server updated successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/MCPServer"),
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
     *         description="Machine or MCP server not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="MCP_002"),
     *                 @OA\Property(property="message", type="string", example="MCP server not found")
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

        // Prevent updating transport — would require re-creation
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
     * Delete an MCP server.
     *
     * Removes the MCP server registration from the machine. If the server
     * is currently running, it is marked as stopped before deletion.
     * This does not send a stop command to the agent — the agent should
     * detect the removal on the next sync.
     *
     * @OA\Delete(
     *     path="/api/machines/{machineId}/mcp/{name}",
     *     operationId="deleteMCPServer",
     *     tags={"MCP Servers"},
     *     summary="Delete an MCP server",
     *     description="Remove the MCP server registration. If running, it is marked as stopped before deletion. The agent detects removal on next sync.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="name",
     *         in="path",
     *         required=true,
     *         description="Unique name of the MCP server",
     *         @OA\Schema(type="string", example="filesystem-server")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="MCP server deleted successfully",
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
     *         description="Machine or MCP server not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="MCP_002"),
     *                 @OA\Property(property="message", type="string", example="MCP server not found")
     *             )
     *         )
     *     )
     * )
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

        // Stop if running before deletion
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
     * Get all tools from all running MCP servers on a machine.
     *
     * Aggregates tools from every MCP server that is currently in "running"
     * status on the machine. Each tool entry includes a reference to its
     * parent server (id, name, display_name) for disambiguation.
     *
     * @OA\Get(
     *     path="/api/machines/{machineId}/mcp/all-tools",
     *     operationId="listAllMCPTools",
     *     tags={"MCP Servers"},
     *     summary="List all tools across running MCP servers",
     *     description="Aggregate tools from all running MCP servers on the machine. Each tool includes a server reference for disambiguation.",
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
     *         description="Aggregated tool list from all running servers",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(
     *                     property="tools",
     *                     type="array",
     *                     @OA\Items(
     *                         type="object",
     *                         @OA\Property(property="name", type="string", example="read_file"),
     *                         @OA\Property(property="description", type="string", example="Read a file from disk"),
     *                         @OA\Property(property="parameters", type="object"),
     *                         @OA\Property(
     *                             property="server",
     *                             type="object",
     *                             @OA\Property(property="id", type="string", format="uuid"),
     *                             @OA\Property(property="name", type="string", example="filesystem-server"),
     *                             @OA\Property(property="display_name", type="string", example="Filesystem MCP")
     *                         )
     *                     )
     *                 ),
     *                 @OA\Property(property="count", type="integer", example=14),
     *                 @OA\Property(property="servers_count", type="integer", example=3)
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
     *                 @OA\Property(property="code", type="string", example="MCP_001"),
     *                 @OA\Property(property="message", type="string", example="Machine not found")
     *             )
     *         )
     *     )
     * )
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
     *
     * Dispatches a "mcp:call_tool" command to the machine's agent via
     * WebSocket broadcast. The tool must exist on the server and the
     * server must be running. Execution is asynchronous — the response
     * includes a request_id that can be used to correlate the result
     * when it arrives via WebSocket.
     *
     * @OA\Post(
     *     path="/api/machines/{machineId}/mcp/{name}/execute",
     *     operationId="executeMCPTool",
     *     tags={"MCP Servers"},
     *     summary="Execute a tool on an MCP server",
     *     description="Dispatch a tool execution command to the agent. The tool must exist on the server and the server must be running. Results arrive asynchronously via WebSocket.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="machineId",
     *         in="path",
     *         required=true,
     *         description="UUID of the machine",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="name",
     *         in="path",
     *         required=true,
     *         description="Unique name of the MCP server",
     *         @OA\Schema(type="string", example="filesystem-server")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"tool"},
     *             @OA\Property(property="tool", type="string", example="read_file", description="Name of the tool to execute"),
     *             @OA\Property(property="params", type="object", nullable=true, example={"path": "/tmp/example.txt"}, description="Arguments to pass to the tool")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Tool execution dispatched",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="message", type="string", example="Tool execution initiated"),
     *                 @OA\Property(property="tool", type="string", example="read_file"),
     *                 @OA\Property(property="params", type="object", example={"path": "/tmp/example.txt"}),
     *                 @OA\Property(property="status", type="string", example="executing"),
     *                 @OA\Property(property="request_id", type="string", example="mcp_tool_679a1b2c3d4e5", description="Correlation ID for matching async results")
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
     *         response=400,
     *         description="Server is not running",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="MCP_006"),
     *                 @OA\Property(property="message", type="string", example="MCP server is not running")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Machine, server, or tool not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="MCP_007"),
     *                 @OA\Property(property="message", type="string", example="Tool 'unknown_tool' not found on this server")
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

        // Verify tool exists on this server
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
     * Bulk upsert MCP servers from agent sync.
     */
    public function sync(Request $request, string $machine): JsonResponse
    {
        $machineModel = $this->getMachine($request, $machine);

        if (!$machineModel) {
            return $this->errorResponse('MCP_001', 'Machine not found', 404);
        }

        $validated = $request->validate([
            'servers' => 'required|array',
            'servers.*.name' => 'required|string|max:255',
            'servers.*.description' => 'nullable|string',
            'servers.*.command' => 'nullable|string',
            'servers.*.args' => 'nullable|array',
            'servers.*.env' => 'nullable|array',
            'servers.*.enabled' => 'nullable|boolean',
            'servers.*.auto_start' => 'nullable|boolean',
            'servers.*.status' => 'nullable|string|in:' . implode(',', MCPServer::STATUSES),
            'servers.*.tools' => 'nullable|array',
            'servers.*.tools.*.name' => 'required|string',
            'servers.*.tools.*.description' => 'nullable|string',
            'servers.*.tools.*.parameters' => 'nullable|array',
        ]);

        $synced = 0;
        foreach ($validated['servers'] as $serverData) {
            MCPServer::updateOrCreate(
                [
                    'machine_id' => $machineModel->id,
                    'name' => $serverData['name'],
                ],
                [
                    'description' => $serverData['description'] ?? null,
                    'transport' => 'stdio',
                    'command' => $serverData['command'] ?? null,
                    'env_vars' => $serverData['env'] ?? [],
                    'config' => [
                        'args' => $serverData['args'] ?? [],
                        'auto_start' => $serverData['auto_start'] ?? false,
                    ],
                    'status' => $serverData['status'] ?? 'stopped',
                    'tools' => $serverData['tools'] ?? [],
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

    // ==================== PRIVATE HELPERS ====================

    /**
     * Get machine model for the authenticated user.
     *
     * Fetches the machine by ID, scoped to the currently authenticated user
     * to enforce ownership authorization.
     *
     * @param  Request  $request  The current HTTP request (provides the authenticated user)
     * @param  string   $machineId  UUID of the machine to retrieve
     * @return Machine|null  The machine model, or null if not found / not owned by the user
     */
    private function getMachine(Request $request, string $machineId): ?Machine
    {
        return $request->user()
            ->machines()
            ->find($machineId);
    }

    /**
     * Build a standardized error response.
     *
     * All error responses follow the project convention:
     * { success: false, error: { code, message }, meta: { timestamp, request_id } }
     *
     * @param  string  $code     Application-level error code (e.g. "MCP_001")
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
