<?php

namespace App\Console\Commands;

use App\Models\ClaudeCredential;
use App\Models\DiscoveredSession;
use App\Models\Machine;
use App\Models\Session;
use App\Models\SharedProject;
use App\Services\AgentGateway;
use App\Services\DecompositionStreamService;
use App\Services\Redis\AgentWakeSubscriber;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
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
 * - /ws/terminal — Browser terminal connections (single-use ws-ticket auth)
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

    /**
     * Decomposition stream router (singleton — holds the in-memory output
     * buffers of ephemeral decompose-* sessions for this process).
     */
    private ?DecompositionStreamService $decompositionStream = null;

    /**
     * Throttle map for presence writes (machineId => last epoch second written).
     * The agent pings every 30s; we persist last_seen/status at most once per
     * 30s window to keep DB writes cheap while staying well under the 2-minute
     * offline threshold.
     *
     * @var array<string, int>
     */
    private array $presenceTouched = [];

    /**
     * Throttle map for human-input cache writes (sessionId => last epoch
     * second written). Terminal input arrives keystroke-by-keystroke; the
     * worker-loop suspension window is 120s, so persisting the timestamp at
     * most once per 5s keeps cache writes cheap with no precision loss.
     *
     * @var array<string, int>
     */
    private array $humanInputTouched = [];

    private int $nextConnId = 0;

    /**
     * Adaptive Redis poll cadence. The timer ticks every POLL_TICK seconds
     * but only drains the queues every POLL_HOT_INTERVAL (messages were
     * consumed within POLL_HOT_WINDOW) or POLL_IDLE_INTERVAL (idle).
     *
     * The pub/sub wake (AgentWakeSubscriber) drains queues immediately on
     * publish, so the idle interval is only the worst-case fallback latency
     * when the subscription is down.
     */
    private const POLL_TICK = 0.05;
    private const POLL_HOT_INTERVAL = 0.05;
    private const POLL_IDLE_INTERVAL = 0.25;
    private const POLL_HOT_WINDOW = 2.0;

    /** Last time at least one queued message was consumed (microtime). */
    private float $lastConsumedAt = 0.0;

    /** Last time the queues were actually drained by the timer (microtime). */
    private float $lastPolledAt = 0.0;

    private ?AgentWakeSubscriber $wakeSubscriber = null;

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

        // Poll Redis for server→agent messages — adaptive cadence: 50ms while
        // messages are flowing, 250ms when idle. The pub/sub wake subscriber
        // (below) drains immediately on publish, so this poll is the delivery
        // guarantee, not the latency path.
        Loop::addPeriodicTimer(self::POLL_TICK, function (): void {
            $now = microtime(true);
            $interval = ($now - $this->lastConsumedAt) <= self::POLL_HOT_WINDOW
                ? self::POLL_HOT_INTERVAL
                : self::POLL_IDLE_INTERVAL;

            // 5ms epsilon absorbs timer jitter so an idle drain runs on the
            // 250ms tick instead of slipping to the 300ms one.
            if (($now - $this->lastPolledAt) < $interval - 0.005) {
                return;
            }

            $this->lastPolledAt = $now;
            $this->pollRedisQueues();
        });

        // Instant wake on AgentGateway::send() — best-effort accelerator on
        // top of the poll above. See AgentWakeSubscriber for the rationale.
        $this->startWakeSubscriber();

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
        $this->info("  /ws/terminal — Browser terminals (single-use ws-ticket)");
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

        // Parse query parameters: /ws/terminal?ticket=xxx&session=yyy
        // The ticket is a short-lived (60s), single-use opaque value issued by
        // POST /api/auth/ws-ticket — the Sanctum bearer token must NEVER
        // transit in the URL (query strings end up in nginx/proxy logs).
        $urlPart = explode(' ', $requestLine)[1] ?? '';
        parse_str(parse_url($urlPart, PHP_URL_QUERY) ?? '', $query);

        $ticket = $query['ticket'] ?? '';
        $sessionId = $query['session'] ?? '';

        if (!$ticket || !$sessionId) {
            $conn->end("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\nMissing ticket or session");
            return;
        }

        // Cache::pull = atomic read+delete → single-use even on replay
        try {
            $userId = Cache::pull('ws_ticket:' . hash('sha256', $ticket));
        } catch (\Throwable $e) {
            $conn->end("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\nInvalid ticket");
            return;
        }

        if (!$userId) {
            $conn->end("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\nInvalid or expired ticket");
            return;
        }

        // Verify session exists, belongs to user, and is active
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
                unset($this->agents[$machineId], $this->presenceTouched[$machineId]);

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
                'file:read_credentials_result' => $this->onRequestResponse($data),
                'project:scan_result' => $this->onRequestResponse($data),
                'orchestrator:state' => $this->onRequestResponse($data),
                'orchestrator:error' => $this->onRequestResponse($data),
                'decompose:progress' => $this->onDecomposeProgress($data),
                'decompose:result' => $this->onDecomposeResult($data),
                'claude_sessions:discovered' => $this->onClaudeSessionsDiscovered($machineId, $data),
                'claude_sessions:transcript' => $this->onClaudeSessionTranscript($data),
                'claude_sessions:discover_result' => $this->onRequestResponse($data),
                'claude_sessions:open_result' => $this->onRequestResponse($data),
                'claude_sessions:adopted' => $this->onRequestResponse($data),
                'oauth:auth-url' => $this->onOAuthAuthUrl($data),
                'oauth:tokens' => $this->onOAuthTokens($data),
                'oauth:error' => $this->onOAuthError($data),
                'ping' => $this->onAgentPing($machineId),
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

                // Human took over the terminal — suspend the worker loop for
                // this session (throttled: at most one cache write per 5s).
                $nowTs = time();
                if (($this->humanInputTouched[$sessionId] ?? 0) <= $nowTs - 5) {
                    $this->humanInputTouched[$sessionId] = $nowTs;
                    \App\Services\WorkerLoopService::markHumanInput($sessionId);
                }

                // Forward directly to agent in-memory (no Redis, no HTTP)
                $this->sendToAgent($machineId, 'session:input', [
                    'sessionId' => $sessionId,
                    'data' => $data,
                ]);
            } elseif ($message['type'] === 'resize') {
                // Resize over the same low-latency channel as input so the PTY
                // width tracks the client without a separate HTTP round-trip.
                $cols = (int) ($message['cols'] ?? 0);
                $rows = (int) ($message['rows'] ?? 0);
                if ($cols >= 20 && $cols <= 500 && $rows >= 5 && $rows <= 200) {
                    $this->sendToAgent($machineId, 'session:resize', [
                        'sessionId' => $sessionId,
                        'cols' => $cols,
                        'rows' => $rows,
                    ]);
                }
            }
        } catch (\Throwable $e) {
            // Silently ignore malformed terminal messages
        }
    }

    // ==================== Agent → Server Handlers ====================

    /**
     * Guard: a non-UUID session id must NEVER reach a uuid-typed query
     * (`sessions.id` is uuid — PostgreSQL throws SQLSTATE[22P02] and the
     * whole agent message is dropped).
     *
     * Ephemeral `decompose-*` sessions are routed to the decomposition flow;
     * any other non-UUID id is skipped with a log.
     *
     * @return bool true when the message was fully consumed (caller returns)
     */
    private function routeNonUuidSession(string $kind, string $sessionId, array $data): bool
    {
        if (Str::isUuid($sessionId)) {
            return false;
        }

        $stream = $this->decompositionStream ??= app(DecompositionStreamService::class);

        if ($stream->isDecomposeSessionId($sessionId)) {
            match ($kind) {
                'output' => $stream->handleOutput($sessionId, (string) ($data['data'] ?? '')),
                'exited' => $stream->handleExited($sessionId),
                // status / error carry no payload the decomposition needs —
                // the exit handler finalizes (success or parse failure) anyway.
                default => null,
            };

            return true;
        }

        Log::debug('Ignoring agent message for non-UUID session id', [
            'kind' => $kind,
            'session_id' => $sessionId,
        ]);

        return true;
    }

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
        if ($this->routeNonUuidSession('output', (string) $sessionId, $data)) return;

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
        if ($this->routeNonUuidSession('status', (string) $sessionId, $data)) return;

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
        if ($this->routeNonUuidSession('exited', (string) $sessionId, $data)) return;

        $session = Session::find($sessionId);
        if (!$session) return;

        $exitCode = $data['exitCode'] ?? $data['exit_code'] ?? null;
        $session->markAsCompleted($exitCode);

        // Multi-agent teardown (idempotent) — must NEVER break normal session
        // termination, hence the catch-all guard.
        if ($session->shared_project_id) {
            try {
                app(\App\Services\MultiAgentSessionService::class)->teardown($session);
            } catch (\Throwable $e) {
                Log::warning('Multi-agent teardown failed on session exit', [
                    'session_id' => $session->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

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
            if ($this->routeNonUuidSession('error', (string) $sessionId, $data)) return;

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

    /**
     * The agent reported the full set of discovered Claude sessions for a machine.
     * Upsert the rows (replacing stale ones) and broadcast to the dashboard.
     */
    private function onClaudeSessionsDiscovered(string $machineId, array $data): void
    {
        $sessions = $data['sessions'] ?? [];
        if (!is_array($sessions)) return;

        $machine = Machine::find($machineId);
        if (!$machine) return;

        // IMPORTANT: agent:serve is a single ReactPHP event loop shared with
        // terminal I/O. A per-row updateOrCreate (one blocking query each) would
        // freeze every terminal for the duration on each 30s push. Build the
        // rows in memory and persist them in ONE bulk upsert + one delete.
        $now = now();
        $seen = [];
        $rows = [];
        foreach ($sessions as $s) {
            $sessionId = $s['sessionId'] ?? null;
            if (!$sessionId) continue;
            $seen[] = $sessionId;
            $rows[] = [
                'id' => (string) Str::uuid(),
                'machine_id' => $machineId,
                'session_id' => $sessionId,
                'project_slug' => $s['projectSlug'] ?? '',
                'cwd' => $s['cwd'] ?? '',
                'project_name' => $s['projectName'] ?? '',
                'transcript_path' => $s['transcriptPath'] ?? '',
                'is_live' => (bool) ($s['isLive'] ?? false),
                'pid' => $s['pid'] ?? null,
                'tty' => $s['tty'] ?? null,
                'started_at' => $s['startedAt'] ?? null,
                'last_activity_at' => $s['lastActivityAt'] ?? null,
                'size_bytes' => $s['sizeBytes'] ?? 0,
                'last_preview' => $s['lastPreview'] ?? null,
                'adopted' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if ($rows) {
            // Single query; conflict on (machine_id, session_id) updates in place.
            // 'adopted'/'agent_session_id' are intentionally NOT in the update set
            // so an adopted session keeps its binding across rescans.
            DiscoveredSession::upsert(
                $rows,
                ['machine_id', 'session_id'],
                [
                    'project_slug', 'cwd', 'project_name', 'transcript_path',
                    'is_live', 'pid', 'tty', 'started_at', 'last_activity_at',
                    'size_bytes', 'last_preview', 'updated_at',
                ],
            );
        }

        // Drop rows that the agent no longer reports (transcripts deleted, etc.).
        DiscoveredSession::forMachine($machineId)
            ->when($seen, fn ($q) => $q->whereNotIn('session_id', $seen))
            ->delete();

        // Broadcast a slim signal only (machine_id + count). Embedding the
        // full session list blew past Reverb's ~10KB payload limit and piled
        // up "Pusher error: Payload too large" failed jobs. Clients refetch
        // the list via GET /api/machines/{machine}/claude-sessions on signal.
        broadcast(new \App\Events\ClaudeSessionsDiscovered(
            $machineId,
            DiscoveredSession::forMachine($machineId)->count(),
        ));
    }

    /**
     * A live batch of redacted transcript events for a mirrored session.
     * Relay straight to the dashboard channel (already redacted by the agent).
     */
    private function onClaudeSessionTranscript(array $data): void
    {
        $sessionId = $data['sessionId'] ?? null;
        if (!$sessionId) return;

        broadcast(new \App\Events\ClaudeSessionTranscript(
            $sessionId,
            $data['events'] ?? [],
            (bool) ($data['replace'] ?? false),
        ));
    }

    private function onDecomposeProgress(array $data): void
    {
        $project = $this->findDecomposeProject($data);
        if (!$project) return;

        // Broadcast progress to frontend via Reverb
        broadcast(new \App\Events\ProjectBroadcast(
            $project,
            [
                'type' => 'decompose:progress',
                'data' => $data['output'] ?? '',
                'percent' => $data['percent'] ?? null,
            ],
        ));
    }

    /**
     * Agent-side completion path. Converges with the server-side
     * session:exited parse in DecompositionStreamService::complete()
     * (idempotent — whichever path lands first wins).
     */
    private function onDecomposeResult(array $data): void
    {
        $project = $this->findDecomposeProject($data);
        if (!$project) return;

        $stream = $this->decompositionStream ??= app(DecompositionStreamService::class);
        $stream->completeFromAgentResult($project, $data);
    }

    /**
     * Resolve the project of a decompose:* message — uuid-guarded so a
     * malformed projectId never reaches the uuid-typed query (22P02).
     */
    private function findDecomposeProject(array $data): ?SharedProject
    {
        $projectId = $data['projectId'] ?? null;
        if (!$projectId || !Str::isUuid((string) $projectId)) {
            return null;
        }

        return SharedProject::find($projectId);
    }

    // ==================== OAuth Relay ====================

    private function onOAuthAuthUrl(array $data): void
    {
        $credentialId = $data['credentialId'] ?? null;
        $authUrl = $data['authUrl'] ?? null;
        if (!$credentialId || !$authUrl) return;

        Cache::put("oauth_relay_{$credentialId}", [
            'status' => 'auth_url_ready',
            'auth_url' => $authUrl,
        ], 600);

        $this->info("[" . date('H:i:s') . "] OAuth auth URL received for credential {$credentialId}");
    }

    private function onOAuthTokens(array $data): void
    {
        $credentialId = $data['credentialId'] ?? null;
        if (!$credentialId) return;

        $credential = ClaudeCredential::find($credentialId);
        if (!$credential) {
            $this->warn("[" . date('H:i:s') . "] OAuth tokens received for unknown credential {$credentialId}");
            return;
        }

        $accessToken = $data['accessToken'] ?? null;
        if ($accessToken) {
            $credential->access_token_enc = Crypt::encryptString($accessToken);
            $credential->key_hint = 'oat01-...' . substr($accessToken, -6);
        }

        $refreshToken = $data['refreshToken'] ?? null;
        if ($refreshToken) {
            $credential->refresh_token_enc = Crypt::encryptString($refreshToken);
        }

        $expiresIn = $data['expiresIn'] ?? null;
        if ($expiresIn) {
            $credential->expires_at = now()->addSeconds((int) $expiresIn);
        }

        $credential->save();

        Cache::put("oauth_relay_{$credentialId}", [
            'status' => 'complete',
        ], 600);

        $this->info("[" . date('H:i:s') . "] OAuth tokens saved for credential {$credentialId}");
    }

    private function onOAuthError(array $data): void
    {
        $credentialId = $data['credentialId'] ?? null;
        $error = $data['error'] ?? 'Unknown error';
        if (!$credentialId) return;

        Cache::put("oauth_relay_{$credentialId}", [
            'status' => 'error',
            'error' => $error,
        ], 600);

        $this->warn("[" . date('H:i:s') . "] OAuth error for credential {$credentialId}: {$error}");
    }

    /**
     * Handle an agent heartbeat: refresh presence, then reply with a pong.
     *
     * The WebSocket ping (every 30s) is the agent's liveness signal, so it MUST
     * drive `last_seen_at`/`status` — otherwise the per-minute offline scheduler
     * (2-minute staleness threshold) flips a healthy, connected machine to
     * `offline` and nothing flips it back until a fresh WS connect.
     */
    private function onAgentPing(string $machineId): void
    {
        $this->touchPresence($machineId);
        $this->sendToAgent($machineId, 'pong', ['timestamp' => now()->getTimestampMs()]);
    }

    /**
     * Persist the machine's presence (last_seen + online), throttled to once
     * per 30s per machine. A lightweight query-builder update avoids loading
     * the model and firing events on every heartbeat.
     */
    private function touchPresence(string $machineId): void
    {
        $now = time();
        $last = $this->presenceTouched[$machineId] ?? 0;
        if ($now - $last < 30) {
            return;
        }
        $this->presenceTouched[$machineId] = $now;

        Machine::query()
            ->where('id', $machineId)
            ->update([
                'last_seen_at' => now(),
                'status' => 'online',
            ]);
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
            $this->drainQueue($machineId);
        }
    }

    /**
     * Forward all queued server→agent messages for one machine.
     * Shared by the adaptive poll timer and the pub/sub wake path.
     */
    private function drainQueue(string $machineId): void
    {
        $agent = $this->agents[$machineId] ?? null;
        if (!$agent) {
            // Not connected to this process — the queued message keeps its
            // TTL and is delivered by the poll after the agent (re)connects.
            return;
        }

        $messages = AgentGateway::consume($machineId);
        if ($messages === []) {
            return;
        }

        $this->lastConsumedAt = microtime(true);

        foreach ($messages as $message) {
            $type = $message['type'] ?? 'unknown';
            $this->line("[" . date('H:i:s') . "] Forwarding to agent: {$type}");
            $agent['conn']->write($this->encodeFrame(json_encode($message)));
        }
    }

    /**
     * Subscribe to the AgentGateway wake channel so a server→agent message
     * is forwarded the moment it is queued instead of on the next poll tick.
     *
     * Best-effort by design: the subscriber never throws, reconnects with
     * capped backoff, and the adaptive poll keeps delivering if Redis
     * pub/sub is unavailable. Kill-switch: AGENT_WAKE_SUBSCRIBE=false.
     */
    private function startWakeSubscriber(): void
    {
        if (!config('claudenest.websocket.wake_subscribe', true)) {
            $this->info('Wake subscriber disabled (AGENT_WAKE_SUBSCRIBE=false) — adaptive polling only.');

            return;
        }

        $this->wakeSubscriber = new AgentWakeSubscriber(
            onWake: function (string $machineId): void {
                try {
                    $this->drainQueue($machineId);
                } catch (\Throwable $e) {
                    // Not fatal: the poll timer picks the message up on its
                    // next tick. Never let an eager drain kill the socket
                    // handler (and with it the whole event loop).
                    Log::warning('agent:serve: wake-triggered drain failed (poll will deliver)', [
                        'machineId' => $machineId,
                        'error' => $e->getMessage(),
                    ]);
                }
            },
            onLog: function (string $level, string $message): void {
                $line = '[' . date('H:i:s') . '] ' . $message;
                $level === 'warn' ? $this->warn($line) : $this->info($line);
            },
        );

        $this->wakeSubscriber->start();
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
