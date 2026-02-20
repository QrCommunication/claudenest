<?php

namespace App\Console\Commands;

use App\Models\Machine;
use App\Models\PersonalAccessToken;
use App\Models\Session;
use App\Services\AgentGateway;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use React\EventLoop\Loop;
use React\Socket\ConnectionInterface;
use React\Socket\SocketServer;

/**
 * Dedicated WebSocket server for agent and terminal connections.
 *
 * - /ws/agent    — Agent connections (machine token auth, JSON messages)
 * - /ws/terminal — Browser terminal connections (Sanctum token auth)
 *
 * Uses ReactPHP for non-blocking I/O and Redis lists as a bridge
 * for server→agent messages (see AgentGateway service).
 *
 * Terminal connections send input directly to agents in-memory,
 * bypassing the HTTP/Redis round-trip for low-latency keystroke delivery.
 */
class AgentServe extends Command
{
    protected $signature = 'agent:serve {--port=6001} {--host=0.0.0.0}';
    protected $description = 'Start the WebSocket server for agent and terminal connections';

    /** @var array<string, array{conn: ConnectionInterface, machine: Machine, connId: int}> */
    private array $agents = [];

    /** @var array<string, array<int, ConnectionInterface>> sessionId => [connId => conn] */
    private array $terminals = [];

    /** @var array<int, array{buffer: string, upgraded: bool, machineId: ?string, frameBuffer: string, type: ?string, sessionId: ?string}> */
    private array $connState = [];

    private int $nextConnId = 0;

    public function handle(): int
    {
        $host = $this->option('host');
        $port = $this->option('port');

        $this->info("Starting WebSocket server on {$host}:{$port}");

        $socket = new SocketServer("{$host}:{$port}");

        $socket->on('connection', function (ConnectionInterface $conn) {
            $connId = ++$this->nextConnId;

            $this->connState[$connId] = [
                'buffer' => '',
                'upgraded' => false,
                'machineId' => null,
                'frameBuffer' => '',
                'type' => null,
                'sessionId' => null,
            ];

            $conn->on('data', function (string $data) use ($conn, $connId) {
                $state = &$this->connState[$connId];

                if (!$state['upgraded']) {
                    $state['buffer'] .= $data;
                    if (str_contains($state['buffer'], "\r\n\r\n")) {
                        $this->handleUpgrade($conn, $connId, $state['buffer']);
                    }
                } else {
                    $state['frameBuffer'] .= $data;
                    $this->processFrames($conn, $connId);
                }
            });

            $conn->on('close', fn () => $this->handleDisconnect($connId));
            $conn->on('error', fn (\Exception $e) => $this->handleDisconnect($connId));
        });

        // Poll Redis for server→agent messages (50ms)
        Loop::addPeriodicTimer(0.05, fn () => $this->pollRedisQueues());

        // Log stats every 60s
        Loop::addPeriodicTimer(60, function () {
            $agentCount = count($this->agents);
            $termCount = array_sum(array_map('count', $this->terminals));
            if ($agentCount > 0 || $termCount > 0) {
                $this->line("[" . date('H:i:s') . "] {$agentCount} agent(s), {$termCount} terminal(s) connected");
            }
        });

        $socket->on('error', fn (\Exception $e) => $this->error("Server error: {$e->getMessage()}"));

        $this->info("  /ws/agent    — Agent connections (machine token)");
        $this->info("  /ws/terminal — Browser terminals (Sanctum token)");
        $this->info("Press Ctrl+C to stop.");

        Loop::get()->run();

        return self::SUCCESS;
    }

    // ==================== Connection Lifecycle ====================

    private function handleUpgrade(ConnectionInterface $conn, int $connId, string $httpRequest): void
    {
        // Parse HTTP headers
        $lines = explode("\r\n", $httpRequest);
        $requestLine = $lines[0] ?? '';
        $headers = [];
        for ($i = 1; $i < count($lines); $i++) {
            if (empty($lines[$i])) break;
            $parts = explode(': ', $lines[$i], 2);
            if (count($parts) === 2) {
                $headers[strtolower($parts[0])] = $parts[1];
            }
        }

        // Must be a WebSocket upgrade
        if (strtolower($headers['upgrade'] ?? '') !== 'websocket') {
            $conn->end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
            return;
        }

        // Route by path
        if (str_contains($requestLine, '/ws/terminal')) {
            $this->handleTerminalUpgrade($conn, $connId, $requestLine, $headers);
        } elseif (str_contains($requestLine, '/ws/agent')) {
            $this->handleAgentUpgrade($conn, $connId, $headers);
        } else {
            $conn->end("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
        }
    }

    private function handleAgentUpgrade(ConnectionInterface $conn, int $connId, array $headers): void
    {
        $state = &$this->connState[$connId];

        $token = $headers['x-machine-token'] ?? '';
        $machineId = $headers['x-machine-id'] ?? '';
        if (!$token || !$machineId) {
            $conn->end("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\nMissing authentication headers");
            return;
        }

        try {
            $machine = Machine::find($machineId);
        } catch (\Throwable $e) {
            $conn->end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\nInvalid machine ID");
            return;
        }

        if (!$machine || !$machine->verifyToken($token)) {
            $this->warn("Auth failed for machine {$machineId}");
            $conn->end("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\nInvalid token");
            return;
        }

        $this->completeUpgrade($conn, $headers);

        $state['upgraded'] = true;
        $state['machineId'] = $machineId;
        $state['type'] = 'agent';

        // Replace BEFORE closing old connection so handleDisconnect
        // sees the new connId and skips markAsOffline for the old one.
        $old = $this->agents[$machineId]['conn'] ?? null;

        $this->agents[$machineId] = [
            'conn' => $conn,
            'machine' => $machine,
            'connId' => $connId,
        ];

        $machine->markAsOnline();

        if ($old) {
            $old->write($this->encodeFrame(pack('n', 1000) . 'Replaced', 0x8));
            $old->close();
        }
        $this->info("Agent connected: {$machine->name} ({$machineId})");
    }

    private function handleTerminalUpgrade(ConnectionInterface $conn, int $connId, string $requestLine, array $headers): void
    {
        $state = &$this->connState[$connId];

        // Parse query parameters: /ws/terminal?token=xxx&session=yyy
        $urlPart = explode(' ', $requestLine)[1] ?? '';
        parse_str(parse_url($urlPart, PHP_URL_QUERY) ?? '', $query);

        $token = $query['token'] ?? '';
        $sessionId = $query['session'] ?? '';

        if (!$token || !$sessionId) {
            $conn->end("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\nMissing token or session");
            return;
        }

        // Verify token using the same lookup as API middleware
        try {
            $accessToken = PersonalAccessToken::findValidToken($token);
        } catch (\Throwable $e) {
            $conn->end("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\nInvalid token");
            return;
        }

        if (!$accessToken) {
            $conn->end("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\nInvalid token");
            return;
        }

        // Verify session exists, belongs to user, and is active
        $userId = $accessToken->tokenable_id;
        $session = Session::where('id', $sessionId)
            ->where('user_id', $userId)
            ->whereIn('status', ['running', 'waiting_input', 'starting'])
            ->first();

        if (!$session) {
            $conn->end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\nSession not found or not accessible");
            return;
        }

        $this->completeUpgrade($conn, $headers);

        $state['upgraded'] = true;
        $state['type'] = 'terminal';
        $state['sessionId'] = $sessionId;
        $state['machineId'] = $session->machine_id;

        if (!isset($this->terminals[$sessionId])) {
            $this->terminals[$sessionId] = [];
        }
        $this->terminals[$sessionId][$connId] = $conn;

        $this->info("[" . date('H:i:s') . "] Terminal connected: session {$sessionId}");
    }

    private function completeUpgrade(ConnectionInterface $conn, array $headers): void
    {
        $wsKey = $headers['sec-websocket-key'] ?? '';
        $accept = base64_encode(sha1($wsKey . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', true));
        $conn->write(
            "HTTP/1.1 101 Switching Protocols\r\n" .
            "Upgrade: websocket\r\n" .
            "Connection: Upgrade\r\n" .
            "Sec-WebSocket-Accept: {$accept}\r\n\r\n"
        );
    }

    private function handleDisconnect(int $connId): void
    {
        $state = $this->connState[$connId] ?? null;
        if (!$state) return;

        $type = $state['type'] ?? null;

        if ($type === 'agent') {
            $machineId = $state['machineId'];
            if ($machineId && isset($this->agents[$machineId]) && $this->agents[$machineId]['connId'] === $connId) {
                unset($this->agents[$machineId]);

                $machine = Machine::find($machineId);
                if ($machine) {
                    $machine->markAsOffline();
                    $this->warn("Agent disconnected: {$machine->name} ({$machineId})");
                }
            }
        } elseif ($type === 'terminal') {
            $sessionId = $state['sessionId'];
            if ($sessionId && isset($this->terminals[$sessionId][$connId])) {
                unset($this->terminals[$sessionId][$connId]);
                if (empty($this->terminals[$sessionId])) {
                    unset($this->terminals[$sessionId]);
                }
                $this->line("[" . date('H:i:s') . "] Terminal disconnected: session {$sessionId}");
            }
        }

        unset($this->connState[$connId]);
    }

    // ==================== Message Handling ====================

    private function processFrames(ConnectionInterface $conn, int $connId): void
    {
        $state = &$this->connState[$connId];

        while (strlen($state['frameBuffer']) > 0) {
            $frame = $this->decodeFrame($state['frameBuffer']);
            if ($frame === null) break;

            $state['frameBuffer'] = substr($state['frameBuffer'], $frame['consumed']);

            match ($frame['opcode']) {
                0x1 => $this->handleTextMessage($connId, $frame['payload']),
                0x8 => (function () use ($conn) {
                    $conn->write($this->encodeFrame(pack('n', 1000), 0x8));
                    $conn->close();
                })(),
                0x9 => $conn->write($this->encodeFrame($frame['payload'], 0xA)),
                default => null,
            };
        }
    }

    private function handleTextMessage(int $connId, string $payload): void
    {
        $state = $this->connState[$connId] ?? null;
        if (!$state) return;

        if ($state['type'] === 'terminal') {
            $this->handleTerminalMessage($connId, $payload);
            return;
        }

        // Agent message handling
        $machineId = $state['machineId'] ?? null;
        if (!$machineId) return;

        try {
            $message = json_decode($payload, true);
            if (!$message || !isset($message['type'])) return;

            $type = $message['type'];
            $data = $message['payload'] ?? [];

            if ($type !== 'session:output' && $type !== 'ping' && $type !== 'pong') {
                $this->line("[" . date('H:i:s') . "] Agent → Server: {$type} " . json_encode($data));
            }

            match ($type) {
                'machine:info' => $this->onMachineInfo($machineId, $data),
                'session:output' => $this->onSessionOutput($machineId, $data),
                'session:status' => $this->onSessionStatus($machineId, $data),
                'session:exited' => $this->onSessionExited($machineId, $data),
                'file:browse_result' => $this->onFileBrowseResult($data),
                'project:scan_result' => $this->onRequestResponse($data),
                'orchestrator:state' => $this->onRequestResponse($data),
                'orchestrator:error' => $this->onRequestResponse($data),
                'ping' => $this->sendToAgent($machineId, 'pong', ['timestamp' => now()->getTimestampMs()]),
                'error' => $this->onAgentError($machineId, $data),
                default => $this->warn("[" . date('H:i:s') . "] Unknown agent message type: {$type}"),
            };
        } catch (\Throwable $e) {
            Log::error("Error handling agent message", [
                'machineId' => $machineId,
                'error' => $e->getMessage(),
            ]);
            $this->error("[" . date('H:i:s') . "] Error handling agent message: {$e->getMessage()}");
        }
    }

    private function handleTerminalMessage(int $connId, string $payload): void
    {
        $state = $this->connState[$connId] ?? null;
        if (!$state) return;

        $machineId = $state['machineId'] ?? null;
        $sessionId = $state['sessionId'] ?? null;
        if (!$machineId || !$sessionId) return;

        try {
            $message = json_decode($payload, true);
            if (!$message || !isset($message['type'])) return;

            if ($message['type'] === 'input') {
                $data = $message['data'] ?? '';
                if (!is_string($data)) return;

                // Forward directly to agent in-memory (no Redis, no HTTP)
                $this->sendToAgent($machineId, 'session:input', [
                    'sessionId' => $sessionId,
                    'data' => $data,
                ]);
            }
        } catch (\Throwable $e) {
            // Silently ignore malformed terminal messages
        }
    }

    // ==================== Agent → Server Handlers ====================

    private function onMachineInfo(string $machineId, array $data): void
    {
        $machine = Machine::find($machineId);
        if (!$machine) return;

        $machine->update(array_filter([
            'platform' => $data['platform'] ?? null,
            'hostname' => $data['hostname'] ?? null,
            'arch' => $data['arch'] ?? null,
            'node_version' => $data['nodeVersion'] ?? null,
            'agent_version' => $data['agentVersion'] ?? null,
            'claude_version' => $data['claudeVersion'] ?? null,
            'claude_path' => $data['claudePath'] ?? null,
            'capabilities' => $data['capabilities'] ?? null,
            'max_sessions' => $data['maxSessions'] ?? null,
        ]));

        $this->info("Machine info updated: {$machine->name}");
    }

    private function onSessionOutput(string $machineId, array $data): void
    {
        $sessionId = $data['sessionId'] ?? $data['session_id'] ?? null;
        if (!$sessionId) return;

        $session = Session::find($sessionId);
        if (!$session) return;

        $output = $data['data'] ?? '';

        $session->addLog('output', $output);
        broadcast(new \App\Events\SessionOutput($session, $output));

        // Also forward output to directly-connected browser terminals
        if (isset($this->terminals[$sessionId])) {
            $frame = $this->encodeFrame(json_encode([
                'type' => 'output',
                'data' => $output,
                'timestamp' => now()->getTimestampMs(),
            ]));
            foreach ($this->terminals[$sessionId] as $termConn) {
                $termConn->write($frame);
            }
        }
    }

    private function onSessionStatus(string $machineId, array $data): void
    {
        $sessionId = $data['sessionId'] ?? $data['session_id'] ?? null;
        $status = $data['status'] ?? null;
        if (!$sessionId || !$status) return;

        $session = Session::find($sessionId);
        if (!$session) return;

        if (isset($data['pid']) && $data['pid']) {
            $session->update(['pid' => (int) $data['pid']]);
        }

        match ($status) {
            'running' => $session->markAsRunning(),
            'waiting_input' => $session->markAsWaitingInput(),
            'error' => $session->markAsError(null, $data['error'] ?? null),
            default => $session->update(['status' => $status]),
        };
    }

    private function onSessionExited(string $machineId, array $data): void
    {
        $sessionId = $data['sessionId'] ?? $data['session_id'] ?? null;
        if (!$sessionId) return;

        $session = Session::find($sessionId);
        if (!$session) return;

        $exitCode = $data['exitCode'] ?? $data['exit_code'] ?? null;
        $session->markAsCompleted($exitCode);

        broadcast(new \App\Events\SessionTerminated($session));

        // Notify connected terminals that session ended
        if (isset($this->terminals[$sessionId])) {
            $frame = $this->encodeFrame(json_encode([
                'type' => 'session:terminated',
                'exitCode' => $exitCode,
                'timestamp' => now()->getTimestampMs(),
            ]));
            foreach ($this->terminals[$sessionId] as $termConn) {
                $termConn->write($frame);
                $termConn->write($this->encodeFrame(pack('n', 1000) . 'Session ended', 0x8));
            }
            unset($this->terminals[$sessionId]);
        }
    }

    private function onAgentError(string $machineId, array $data): void
    {
        $originalType = $data['originalType'] ?? 'unknown';
        $code = $data['code'] ?? 'UNKNOWN';
        $errorMessage = $data['message'] ?? 'No message';
        $sessionId = $data['sessionId'] ?? null;

        $this->error("[" . date('H:i:s') . "] Agent error [{$code}]: {$errorMessage} (from: {$originalType})");

        if ($originalType === 'session:create' && $sessionId) {
            $session = Session::find($sessionId);
            if ($session) {
                $session->markAsError(null, $errorMessage);
                $this->error("[" . date('H:i:s') . "] Session {$sessionId} marked as error");
            }
        }
    }

    private function onFileBrowseResult(array $data): void
    {
        $this->onRequestResponse($data);
    }

    /**
     * Generic handler for request-response pattern messages.
     * Pushes the response to Redis so the waiting controller can retrieve it.
     */
    private function onRequestResponse(array $data): void
    {
        $requestId = $data['requestId'] ?? null;
        if (!$requestId) return;

        $key = "agent:response:{$requestId}";
        Redis::rpush($key, json_encode($data));
        Redis::expire($key, 30);
    }

    // ==================== Server → Agent ====================

    private function sendToAgent(string $machineId, string $type, array $payload = []): void
    {
        if (!isset($this->agents[$machineId])) return;

        $json = json_encode([
            'type' => $type,
            'payload' => $payload,
            'id' => Str::uuid()->toString(),
            'timestamp' => now()->getTimestampMs(),
        ]);

        $this->agents[$machineId]['conn']->write($this->encodeFrame($json));
    }

    private function pollRedisQueues(): void
    {
        foreach (array_keys($this->agents) as $machineId) {
            $messages = AgentGateway::consume($machineId);
            foreach ($messages as $message) {
                $type = $message['type'] ?? 'unknown';
                $this->line("[" . date('H:i:s') . "] Forwarding to agent: {$type}");
                $frame = $this->encodeFrame(json_encode($message));
                $this->agents[$machineId]['conn']->write($frame);
            }
        }
    }

    // ==================== WebSocket Frame Codec (RFC 6455) ====================

    private function decodeFrame(string $data): ?array
    {
        $len = strlen($data);
        if ($len < 2) return null;

        $firstByte = ord($data[0]);
        $secondByte = ord($data[1]);

        $opcode = $firstByte & 0x0F;
        $masked = ($secondByte >> 7) & 1;
        $payloadLen = $secondByte & 0x7F;

        $offset = 2;

        if ($payloadLen === 126) {
            if ($len < 4) return null;
            $payloadLen = unpack('n', substr($data, 2, 2))[1];
            $offset = 4;
        } elseif ($payloadLen === 127) {
            if ($len < 10) return null;
            $payloadLen = unpack('J', substr($data, 2, 8))[1];
            $offset = 10;
        }

        $totalNeeded = $offset + ($masked ? 4 : 0) + $payloadLen;
        if ($len < $totalNeeded) return null;

        if ($masked) {
            $maskKey = substr($data, $offset, 4);
            $offset += 4;
            $payload = substr($data, $offset, $payloadLen);
            for ($i = 0; $i < $payloadLen; $i++) {
                $payload[$i] = chr(ord($payload[$i]) ^ ord($maskKey[$i % 4]));
            }
        } else {
            $payload = substr($data, $offset, $payloadLen);
        }

        return [
            'opcode' => $opcode,
            'payload' => $payload,
            'consumed' => $offset + $payloadLen,
        ];
    }

    private function encodeFrame(string $payload, int $opcode = 0x1): string
    {
        $frame = chr(0x80 | $opcode);

        $length = strlen($payload);
        if ($length < 126) {
            $frame .= chr($length);
        } elseif ($length < 65536) {
            $frame .= chr(126) . pack('n', $length);
        } else {
            $frame .= chr(127) . pack('J', $length);
        }

        return $frame . $payload;
    }
}
