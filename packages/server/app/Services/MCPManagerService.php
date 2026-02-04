<?php

namespace App\Services;

use App\Models\Machine;
use App\Models\MCPServer;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Symfony\Component\Process\Process as SymfonyProcess;

/**
 * Service for managing MCP (Model Context Protocol) servers.
 * 
 * Handles starting, stopping, and communicating with MCP servers
 * that provide tools for extending Claude's capabilities.
 */
class MCPManagerService
{
    /**
     * Active process handles for running MCP servers.
     * 
     * @var array<string, SymfonyProcess>
     */
    protected array $processes = [];

    /**
     * Start an MCP server.
     *
     * @param string $machineId The machine ID
     * @param string $name The MCP server name
     * @return bool Whether the start was successful
     */
    public function startServer(string $machineId, string $name): bool
    {
        $server = MCPServer::forMachine($machineId)
            ->where('name', $name)
            ->first();

        if (!$server) {
            Log::error('MCP server not found', [
                'machine_id' => $machineId,
                'name' => $name,
            ]);
            return false;
        }

        if ($server->is_running) {
            Log::info('MCP server already running', [
                'machine_id' => $machineId,
                'name' => $name,
            ]);
            return true;
        }

        try {
            $server->markAsStarting();

            if ($server->transport === 'stdio') {
                $success = $this->startStdioServer($server);
            } else {
                $success = $this->startHttpServer($server);
            }

            if ($success) {
                $server->markAsRunning();
                
                // Fetch tools from the server
                $this->fetchAndUpdateTools($server);
                
                Log::info('MCP server started', [
                    'machine_id' => $machineId,
                    'name' => $name,
                    'transport' => $server->transport,
                ]);
            } else {
                $server->markAsError('Failed to start server process');
            }

            return $success;
        } catch (\Exception $e) {
            $server->markAsError($e->getMessage());
            
            Log::error('Failed to start MCP server', [
                'machine_id' => $machineId,
                'name' => $name,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }

    /**
     * Stop an MCP server.
     *
     * @param string $machineId The machine ID
     * @param string $name The MCP server name
     * @return bool Whether the stop was successful
     */
    public function stopServer(string $machineId, string $name): bool
    {
        $server = MCPServer::forMachine($machineId)
            ->where('name', $name)
            ->first();

        if (!$server) {
            Log::error('MCP server not found', [
                'machine_id' => $machineId,
                'name' => $name,
            ]);
            return false;
        }

        if ($server->is_stopped) {
            return true;
        }

        try {
            $server->markAsStopping();

            $processKey = "{$machineId}:{$name}";
            
            if (isset($this->processes[$processKey])) {
                $process = $this->processes[$processKey];
                
                if ($process->isRunning()) {
                    $process->stop(5, SIGTERM);
                }
                
                unset($this->processes[$processKey]);
            }

            // For HTTP-based servers, we might need to send a shutdown request
            if ($server->transport !== 'stdio' && $server->url) {
                try {
                    Http::timeout(5)->post("{$server->url}/shutdown");
                } catch (\Exception $e) {
                    // Ignore shutdown errors
                }
            }

            $server->markAsStopped();
            
            Log::info('MCP server stopped', [
                'machine_id' => $machineId,
                'name' => $name,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to stop MCP server', [
                'machine_id' => $machineId,
                'name' => $name,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }

    /**
     * Get the status of an MCP server.
     *
     * @param string $machineId The machine ID
     * @param string $name The MCP server name
     * @return array Status information
     */
    public function getStatus(string $machineId, string $name): array
    {
        $server = MCPServer::forMachine($machineId)
            ->where('name', $name)
            ->first();

        if (!$server) {
            return [
                'exists' => false,
                'status' => 'not_found',
                'is_running' => false,
            ];
        }

        $processKey = "{$machineId}:{$name}";
        $isRunning = false;

        if (isset($this->processes[$processKey])) {
            $isRunning = $this->processes[$processKey]->isRunning();
        }

        // For HTTP-based servers, check if the endpoint is responsive
        if ($server->transport !== 'stdio' && $server->url) {
            $isRunning = $this->checkHttpServerHealth($server->url);
        }

        // Update status if it changed
        if ($isRunning && !$server->is_running) {
            $server->markAsRunning();
        } elseif (!$isRunning && $server->is_running) {
            $server->markAsStopped();
        }

        return [
            'exists' => true,
            'status' => $server->status,
            'is_running' => $isRunning,
            'uptime' => $server->uptime,
            'tools_count' => $server->tools_count,
            'transport' => $server->transport,
            'error_message' => $server->error_message,
        ];
    }

    /**
     * List available tools from an MCP server.
     *
     * @param string $machineId The machine ID
     * @param string $name The MCP server name
     * @return array List of available tools
     */
    public function listTools(string $machineId, string $name): array
    {
        $server = MCPServer::forMachine($machineId)
            ->where('name', $name)
            ->first();

        if (!$server) {
            return [];
        }

        // If server is not running, return cached tools
        if (!$server->is_running) {
            return $server->tools ?? [];
        }

        try {
            $tools = $this->fetchToolsFromServer($server);
            
            // Update tools in database
            $server->updateTools($tools);
            
            return $tools;
        } catch (\Exception $e) {
            Log::error('Failed to fetch tools from MCP server', [
                'machine_id' => $machineId,
                'name' => $name,
                'error' => $e->getMessage(),
            ]);
            
            return $server->tools ?? [];
        }
    }

    /**
     * Execute a tool on an MCP server.
     *
     * @param string $machineId The machine ID
     * @param string $name The MCP server name
     * @param string $toolName The tool name to execute
     * @param array $params Tool parameters
     * @return mixed Tool execution result
     * @throws \Exception If execution fails
     */
    public function executeTool(string $machineId, string $name, string $toolName, array $params = []): mixed
    {
        $server = MCPServer::forMachine($machineId)
            ->where('name', $name)
            ->first();

        if (!$server) {
            throw new \Exception("MCP server '{$name}' not found");
        }

        if (!$server->is_running) {
            throw new \Exception("MCP server '{$name}' is not running");
        }

        if (!$server->hasTool($toolName)) {
            throw new \Exception("Tool '{$toolName}' not found on server '{$name}'");
        }

        try {
            if ($server->transport === 'stdio') {
                return $this->executeToolOnStdioServer($server, $toolName, $params);
            } else {
                return $this->executeToolOnHttpServer($server, $toolName, $params);
            }
        } catch (\Exception $e) {
            Log::error('Failed to execute MCP tool', [
                'machine_id' => $machineId,
                'name' => $name,
                'tool' => $toolName,
                'error' => $e->getMessage(),
            ]);
            
            throw $e;
        }
    }

    /**
     * Restart an MCP server.
     *
     * @param string $machineId The machine ID
     * @param string $name The MCP server name
     * @return bool Whether the restart was successful
     */
    public function restartServer(string $machineId, string $name): bool
    {
        $this->stopServer($machineId, $name);
        
        // Wait a moment for cleanup
        usleep(500000); // 500ms
        
        return $this->startServer($machineId, $name);
    }

    /**
     * Get server logs.
     *
     * @param string $machineId The machine ID
     * @param string $name The MCP server name
     * @param int $lines Number of lines to return
     * @return array Log lines
     */
    public function getLogs(string $machineId, string $name, int $lines = 100): array
    {
        $processKey = "{$machineId}:{$name}";
        
        if (!isset($this->processes[$processKey])) {
            return [];
        }

        $process = $this->processes[$processKey];
        
        // Get output from the process
        // This is a simplified version - in production, you might want to
        // stream logs to a file and read from there
        return [
            'stdout' => '',
            'stderr' => '',
        ];
    }

    /**
     * Start a stdio-based MCP server.
     *
     * @param MCPServer $server The MCP server model
     * @return bool Whether the start was successful
     */
    protected function startStdioServer(MCPServer $server): bool
    {
        if (!$server->command) {
            throw new \Exception('No command specified for stdio server');
        }

        $processKey = "{$server->machine_id}:{$server->name}";
        
        // Parse command into array
        $command = $this->parseCommand($server->command);
        
        $process = new SymfonyProcess(
            $command,
            null, // cwd
            $server->env_vars, // env
            null, // input
            0 // timeout (no timeout)
        );

        $process->start(function ($type, $buffer) use ($server) {
            if ($type === SymfonyProcess::ERR) {
                Log::debug("MCP Server {$server->name} stderr: {$buffer}");
            } else {
                Log::debug("MCP Server {$server->name} stdout: {$buffer}");
            }
        });

        // Wait a moment to see if the process starts successfully
        usleep(1000000); // 1 second

        if (!$process->isRunning()) {
            $exitCode = $process->getExitCode();
            $errorOutput = $process->getErrorOutput();
            
            throw new \Exception(
                "Process exited with code {$exitCode}: {$errorOutput}"
            );
        }

        $this->processes[$processKey] = $process;

        return true;
    }

    /**
     * Start an HTTP-based MCP server.
     *
     * @param MCPServer $server The MCP server model
     * @return bool Whether the start was successful
     */
    protected function startHttpServer(MCPServer $server): bool
    {
        // For HTTP-based servers, we just verify the endpoint is accessible
        if (!$server->url) {
            throw new \Exception('No URL specified for HTTP server');
        }

        // Check if the server is already running
        if ($this->checkHttpServerHealth($server->url)) {
            return true;
        }

        // If there's a command to start the server, execute it
        if ($server->command) {
            $processKey = "{$server->machine_id}:{$server->name}";
            $command = $this->parseCommand($server->command);
            
            $process = new SymfonyProcess(
                $command,
                null,
                $server->env_vars,
                null,
                0
            );

            $process->start();
            
            // Wait for server to start
            $maxAttempts = 30;
            $attempt = 0;
            
            while ($attempt < $maxAttempts) {
                usleep(500000); // 500ms
                
                if ($this->checkHttpServerHealth($server->url)) {
                    $this->processes[$processKey] = $process;
                    return true;
                }
                
                if (!$process->isRunning()) {
                    throw new \Exception(
                        'Server process exited: ' . $process->getErrorOutput()
                    );
                }
                
                $attempt++;
            }
            
            throw new \Exception('Server failed to start within timeout');
        }

        throw new \Exception('HTTP server is not accessible and no start command provided');
    }

    /**
     * Check if an HTTP server is healthy.
     *
     * @param string $url The server URL
     * @return bool Whether the server is healthy
     */
    protected function checkHttpServerHealth(string $url): bool
    {
        try {
            $response = Http::timeout(5)->get("{$url}/health");
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Fetch tools from an MCP server.
     *
     * @param MCPServer $server The MCP server model
     * @return array List of tools
     */
    protected function fetchToolsFromServer(MCPServer $server): array
    {
        if ($server->transport === 'stdio') {
            return $this->fetchToolsFromStdioServer($server);
        } else {
            return $this->fetchToolsFromHttpServer($server);
        }
    }

    /**
     * Fetch tools from a stdio-based MCP server.
     *
     * @param MCPServer $server The MCP server model
     * @return array List of tools
     */
    protected function fetchToolsFromStdioServer(MCPServer $server): array
    {
        $processKey = "{$server->machine_id}:{$server->name}";
        
        if (!isset($this->processes[$processKey])) {
            throw new \Exception('Server process not found');
        }

        $process = $this->processes[$processKey];

        // Send list_tools request via stdin
        $request = json_encode([
            'jsonrpc' => '2.0',
            'id' => uniqid(),
            'method' => 'tools/list',
        ]) . "\n";

        $process->setInput($request);

        // Read response (this is simplified - real implementation would need proper JSON-RPC handling)
        usleep(500000); // 500ms

        // For now, return empty array - real implementation would parse response
        return [];
    }

    /**
     * Fetch tools from an HTTP-based MCP server.
     *
     * @param MCPServer $server The MCP server model
     * @return array List of tools
     */
    protected function fetchToolsFromHttpServer(MCPServer $server): array
    {
        $response = Http::timeout(30)->get("{$server->url}/tools");

        if (!$response->successful()) {
            throw new \Exception('Failed to fetch tools: ' . $response->body());
        }

        $data = $response->json();

        return $data['tools'] ?? [];
    }

    /**
     * Execute a tool on a stdio-based MCP server.
     *
     * @param MCPServer $server The MCP server model
     * @param string $toolName The tool name
     * @param array $params Tool parameters
     * @return mixed Tool result
     */
    protected function executeToolOnStdioServer(MCPServer $server, string $toolName, array $params): mixed
    {
        $processKey = "{$server->machine_id}:{$server->name}";
        
        if (!isset($this->processes[$processKey])) {
            throw new \Exception('Server process not found');
        }

        $process = $this->processes[$processKey];

        // Send tool call request via stdin
        $request = json_encode([
            'jsonrpc' => '2.0',
            'id' => uniqid(),
            'method' => 'tools/call',
            'params' => [
                'name' => $toolName,
                'arguments' => $params,
            ],
        ]) . "\n";

        $process->setInput($request);

        // Read response (simplified)
        usleep(1000000); // 1 second

        // Real implementation would parse the JSON-RPC response
        return ['status' => 'pending'];
    }

    /**
     * Execute a tool on an HTTP-based MCP server.
     *
     * @param MCPServer $server The MCP server model
     * @param string $toolName The tool name
     * @param array $params Tool parameters
     * @return mixed Tool result
     */
    protected function executeToolOnHttpServer(MCPServer $server, string $toolName, array $params): mixed
    {
        $response = Http::timeout(60)->post("{$server->url}/tools/call", [
            'name' => $toolName,
            'arguments' => $params,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Tool execution failed: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Fetch and update tools for a server.
     *
     * @param MCPServer $server The MCP server model
     * @return void
     */
    protected function fetchAndUpdateTools(MCPServer $server): void
    {
        try {
            $tools = $this->fetchToolsFromServer($server);
            $server->updateTools($tools);
        } catch (\Exception $e) {
            Log::warning('Failed to fetch tools after server start', [
                'server' => $server->name,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Parse a command string into an array.
     *
     * @param string $command The command string
     * @return array Parsed command array
     */
    protected function parseCommand(string $command): array
    {
        // Use shell-style parsing
        return array_filter(str_getcsv($command, ' ', '"'));
    }

    /**
     * Stop all running MCP servers.
     *
     * Called during shutdown to clean up processes.
     *
     * @return void
     */
    public function stopAll(): void
    {
        foreach ($this->processes as $key => $process) {
            if ($process->isRunning()) {
                $process->stop(5, SIGTERM);
            }
        }

        $this->processes = [];
    }

    /**
     * Get running servers for a machine.
     *
     * @param string $machineId The machine ID
     * @return array Running server names
     */
    public function getRunningServers(string $machineId): array
    {
        $running = [];
        
        foreach ($this->processes as $key => $process) {
            if (str_starts_with($key, "{$machineId}:") && $process->isRunning()) {
                $running[] = explode(':', $key)[1];
            }
        }

        return $running;
    }
}
