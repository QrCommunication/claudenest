<?php

namespace App\Console\Commands;

use App\Models\Machine;
use App\Models\Session;
use App\Services\AgentGateway;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use React\EventLoop\Loop;
use React\Socket\ConnectionInterface;
use React\Socket\SocketServer;

/**
 * Dedicated WebSocket server for agent connections.
 *
 * Agents connect with raw WebSocket (JSON messages), not Pusher protocol.
 * Uses ReactPHP for non-blocking I/O and Redis lists as a bridge
 * for server→agent messages (see AgentGateway service).
 *
 * Message format: {type: string, payload: object, id: string, timestamp: int}
 */
class AgentServe extends Command
{
    protected $signature = 'agent:serve {--port=6001} {--host=0.0.0.0}';
    protected $description = 'Start the WebSocket server for agent connections';

    /** @var array<string, array{conn: ConnectionInterface, machine: Machine, connId: int}> */
    private array $agents = [];

    /** @var array<int, array{buffer: string, upgraded: bool, machineId: ?string, frameBuffer: string}> */
    private array $connState = [];

    private int $nextConnId = 0;

    public function handle(): int
    {
        $host = $this->option('host');
        $port = $this->option('port');

        $this->info("Starting agent WebSocket server on {$host}:{$port}");

        $socket = new SocketServer("{$host}:{$port}");

        $socket->on('connection', function (ConnectionInterface $conn) {
            $connId = ++$this->nextConnId;

            $this->connState[$connId] = [
                'buffer' => '',
                'upgraded' => false,
                'machineId' => null,
                'frameBuffer' => '',
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
            $count = count($this->agents);
            if ($count > 0) {
                $this->line("[" . date('H:i:s') . "] {$count} agent(s) connected");
            }
        });

        $socket->on('error', fn (\Exception $e) => $this->error("Server error: {$e->getMessage()}"));

        $this->info("Agent WebSocket server listening on ws://{$host}:{$port}/ws/agent");
        $this->info("Press Ctrl+C to stop.");

        Loop::get()->run();

        return self::SUCCESS;
    }

    // ==================== Connection Lifecycle ====================

    private function handleUpgrade(ConnectionInterface $conn, int $connId, string $httpRequest): void
    {
        $state = &$this->connState[$connId];

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

        // Must be a WebSocket upgrade to /ws/agent
        if (!str_contains($requestLine, '/ws/agent') ||
            strtolower($headers['upgrade'] ?? '') !== 'websocket') {
            $conn->write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
            $conn->close();
            return;
        }

        // Extract auth
        $token = $headers['x-machine-token'] ?? '';
        $machineId = $headers['x-machine-id'] ?? '';
        if (!$token || !$machineId) {
            $conn->write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\nMissing authentication headers");
            $conn->close();
            return;
        }

        // Verify machine token
        $machine = Machine::find($machineId);
        if (!$machine || !$machine->verifyToken($token)) {
            $this->warn("Auth failed for machine {$machineId}");
            $conn->write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\nInvalid token");
            $conn->close();
            return;
        }

        // Replace existing connection for this machine
        if (isset($this->agents[$machineId])) {
            $old = $this->agents[$machineId]['conn'];
            $old->write($this->encodeFrame(pack('n', 1000) . 'Replaced', 0x8));
            $old->close();
        }

        // WebSocket accept handshake
        $wsKey = $headers['sec-websocket-key'] ?? '';
        $accept = base64_encode(sha1($wsKey . '258EAFA5-E914-47DA-95CA-5AB5FC11B65B', true));
        $conn->write(
            "HTTP/1.1 101 Switching Protocols\r\n" .
            "Upgrade: websocket\r\n" .
            "Connection: Upgrade\r\n" .
            "Sec-WebSocket-Accept: {$accept}\r\n\r\n"
        );

        $state['upgraded'] = true;
        $state['machineId'] = $machineId;

        $this->agents[$machineId] = [
            'conn' => $conn,
            'machine' => $machine,
            'connId' => $connId,
        ];

        $machine->markAsOnline();
        $this->info("Agent connected: {$machine->name} ({$machineId})");
    }

    private function handleDisconnect(int $connId): void
    {
        $state = $this->connState[$connId] ?? null;
        if (!$state) return;

        $machineId = $state['machineId'];
        if ($machineId && isset($this->agents[$machineId]) && $this->agents[$machineId]['connId'] === $connId) {
            unset($this->agents[$machineId]);

            $machine = Machine::find($machineId);
            if ($machine) {
                $machine->markAsOffline();
                $this->warn("Agent disconnected: {$machine->name} ({$machineId})");
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
        $machineId = $this->connState[$connId]['machineId'] ?? null;
        if (!$machineId) return;

        try {
            $message = json_decode($payload, true);
            if (!$message || !isset($message['type'])) return;

            $type = $message['type'];
            $data = $message['payload'] ?? [];

            match ($type) {
                'machine:info' => $this->onMachineInfo($machineId, $data),
                'session:output' => $this->onSessionOutput($machineId, $data),
                'session:status' => $this->onSessionStatus($machineId, $data),
                'session:exited' => $this->onSessionExited($machineId, $data),
                'ping' => $this->sendToAgent($machineId, 'pong', ['timestamp' => now()->getTimestampMs()]),
                default => null,
            };
        } catch (\Throwable $e) {
            Log::error("Error handling agent message", [
                'machineId' => $machineId,
                'error' => $e->getMessage(),
            ]);
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
        broadcast(new \App\Events\SessionOutput($session, $output))->toOthers();
    }

    private function onSessionStatus(string $machineId, array $data): void
    {
        $sessionId = $data['sessionId'] ?? $data['session_id'] ?? null;
        $status = $data['status'] ?? null;
        if (!$sessionId || !$status) return;

        $session = Session::find($sessionId);
        if (!$session) return;

        // Update PID if provided
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

        broadcast(new \App\Events\SessionTerminated($session))->toOthers();
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
                $frame = $this->encodeFrame(json_encode($message));
                $this->agents[$machineId]['conn']->write($frame);
            }
        }
    }

    // ==================== WebSocket Frame Codec (RFC 6455) ====================

    /**
     * Decode a WebSocket frame. Returns null if data is incomplete.
     */
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

    /**
     * Encode a WebSocket frame (server→client, unmasked).
     */
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
