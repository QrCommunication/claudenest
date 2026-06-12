<?php

declare(strict_types=1);

namespace App\Services\Redis;

use App\Services\AgentGateway;
use Closure;
use React\EventLoop\Loop;
use React\Socket\ConnectionInterface;
use React\Socket\Connector;
use Throwable;

/**
 * Non-blocking Redis pub/sub subscriber for the agent:serve event loop.
 *
 * AgentGateway::send() PUBLISHes the machineId on AgentGateway::WAKE_CHANNEL
 * right after queueing a message; this subscriber wakes agent:serve so the
 * queue is drained immediately instead of on the next poll tick.
 *
 * Why a hand-rolled subscriber: the synchronous Laravel Redis clients
 * (phpredis/predis) would block the ReactPHP loop in SUBSCRIBE mode, and no
 * async Redis client (clue/redis-react) is installed. SUBSCRIBE-mode replies
 * are a tiny, stable subset of RESP2, parsed by RespParser.
 *
 * Design constraints (this is a latency optimizer, NOT a delivery channel):
 *  - never throws out of start() or any event handler;
 *  - any failure (connect, AUTH, protocol desync, buffer overflow) drops the
 *    connection and reconnects with capped exponential backoff;
 *  - agent:serve's periodic poll keeps delivering messages the whole time,
 *    so losing this subscription only costs poll-tick latency.
 *
 * Channel prefix: both phpredis (OPT_PREFIX) and predis (PrefixableCommand)
 * prefix PUBLISH channel names with the Laravel Redis prefix
 * (e.g. "claudenest_database_"). PSUBSCRIBE with a leading wildcard matches
 * the channel whatever the prefix (or its absence), so the subscriber never
 * drifts from the publisher if REDIS_PREFIX or REDIS_CLIENT changes.
 *
 * Database selection: none needed — Redis pub/sub is global to the server,
 * not scoped to a logical database, so no SELECT is sent.
 */
final class AgentWakeSubscriber
{
    /** Cap incoming buffer; wake frames are ~100 bytes, 1 MiB means desync. */
    private const MAX_BUFFER_BYTES = 1_048_576;

    private const CONNECT_TIMEOUT = 5.0;
    private const RECONNECT_MAX_DELAY = 30.0;

    private string $pattern;

    private ?ConnectionInterface $conn = null;

    private string $buffer = '';

    private bool $subscribed = false;

    private bool $stopped = false;

    private bool $reconnectPending = false;

    private int $reconnectAttempts = 0;

    /**
     * @param Closure(string): void $onWake Receives the machineId published on the wake channel.
     * @param Closure(string, string): void|null $onLog Receives (level, message); level is 'info' or 'warn'.
     */
    public function __construct(
        private readonly Closure $onWake,
        private readonly ?Closure $onLog = null,
    ) {
        $this->pattern = '*' . AgentGateway::WAKE_CHANNEL;
    }

    /**
     * Start connecting. Never throws: failures are logged and retried.
     */
    public function start(): void
    {
        try {
            $this->connect();
        } catch (Throwable $e) {
            $this->log('warn', "wake subscriber: start failed: {$e->getMessage()}");
            $this->scheduleReconnect();
        }
    }

    /**
     * Stop permanently (no reconnect). Safe to call multiple times.
     */
    public function stop(): void
    {
        $this->stopped = true;
        $this->subscribed = false;
        $this->conn?->close();
        $this->conn = null;
    }

    public function isSubscribed(): bool
    {
        return $this->subscribed;
    }

    /**
     * Resolve the ReactPHP connector URI and pre-subscribe commands from a
     * Laravel Redis connection config (config('database.redis.default')).
     *
     * Public static for unit testing — pure function of its input.
     *
     * @param array<string, mixed> $config
     * @return array{0: string, 1: list<list<string>>} [connector URI, commands to send before PSUBSCRIBE]
     */
    public static function connectionParams(array $config): array
    {
        if (!empty($config['url'])) {
            $parts = parse_url((string) $config['url']) ?: [];
            $scheme = (string) ($parts['scheme'] ?? 'redis');
            $host = (string) ($parts['host'] ?? '127.0.0.1');
            $port = (int) ($parts['port'] ?? 6379);
            $username = isset($parts['user']) && $parts['user'] !== '' ? rawurldecode((string) $parts['user']) : null;
            $password = isset($parts['pass']) && $parts['pass'] !== '' ? rawurldecode((string) $parts['pass']) : null;
        } else {
            $scheme = (string) ($config['scheme'] ?? 'tcp');
            $host = (string) ($config['host'] ?? '127.0.0.1');
            $port = (int) ($config['port'] ?? 6379);
            $username = isset($config['username']) && $config['username'] !== '' ? (string) $config['username'] : null;
            $password = isset($config['password']) && $config['password'] !== '' ? (string) $config['password'] : null;
        }

        if (str_starts_with($host, '/')) {
            // Unix socket (Laravel convention: host is the socket path).
            $uri = 'unix://' . $host;
        } else {
            $secure = in_array(strtolower($scheme), ['tls', 'rediss', 'ssl'], true);
            $uri = ($secure ? 'tls://' : 'tcp://') . $host . ':' . $port;
        }

        $commands = [];
        if ($password !== null) {
            $commands[] = $username !== null ? ['AUTH', $username, $password] : ['AUTH', $password];
        }

        return [$uri, $commands];
    }

    // ==================== Connection lifecycle ====================

    private function connect(): void
    {
        if ($this->stopped || $this->conn !== null) {
            return;
        }

        /** @var array<string, mixed> $config */
        $config = (array) config('database.redis.default', []);
        [$uri, $preCommands] = self::connectionParams($config);

        $connector = new Connector(['timeout' => self::CONNECT_TIMEOUT]);

        $connector->connect($uri)->then(
            function (ConnectionInterface $conn) use ($preCommands): void {
                $this->onConnected($conn, $preCommands);
            },
            function (Throwable $e): void {
                $this->log('warn', "wake subscriber: connect failed: {$e->getMessage()}");
                $this->scheduleReconnect();
            },
        );
    }

    /**
     * @param list<list<string>> $preCommands
     */
    private function onConnected(ConnectionInterface $conn, array $preCommands): void
    {
        if ($this->stopped) {
            $conn->close();

            return;
        }

        $this->conn = $conn;
        $this->buffer = '';
        $this->subscribed = false;

        $conn->on('data', function (string $chunk): void {
            $this->onData($chunk);
        });

        $conn->on('error', function (Throwable $e): void {
            // 'close' always follows and owns the reconnect logic.
            $this->log('warn', "wake subscriber: socket error: {$e->getMessage()}");
        });

        $conn->on('close', function (): void {
            $this->conn = null;
            $wasSubscribed = $this->subscribed;
            $this->subscribed = false;
            if (!$this->stopped) {
                if ($wasSubscribed) {
                    $this->log('warn', 'wake subscriber: connection lost — reconnecting (poll fallback active)');
                }
                $this->scheduleReconnect();
            }
        });

        foreach ($preCommands as $command) {
            $conn->write(self::encodeCommand($command));
        }
        $conn->write(self::encodeCommand(['PSUBSCRIBE', $this->pattern]));
    }

    private function scheduleReconnect(): void
    {
        if ($this->stopped || $this->reconnectPending) {
            return;
        }
        $this->reconnectPending = true;

        $delay = min(self::RECONNECT_MAX_DELAY, (float) (2 ** min($this->reconnectAttempts, 5)));
        $this->reconnectAttempts++;

        Loop::addTimer($delay, function (): void {
            $this->reconnectPending = false;
            $this->connect();
        });
    }

    // ==================== Protocol handling ====================

    private function onData(string $chunk): void
    {
        $this->buffer .= $chunk;

        if (strlen($this->buffer) > self::MAX_BUFFER_BYTES) {
            $this->log('warn', 'wake subscriber: receive buffer overflow — resetting connection');
            $this->buffer = '';
            $this->conn?->close();

            return;
        }

        try {
            while ($this->conn !== null && ($parsed = RespParser::tryParse($this->buffer)) !== null) {
                [$value, $consumed] = $parsed;
                $this->buffer = substr($this->buffer, $consumed);
                $this->handleReply($value);
            }
        } catch (Throwable $e) {
            // Protocol desync (or anything unexpected) must never crash the
            // shared event loop — drop the connection, backoff reconnects.
            $this->log('warn', "wake subscriber: {$e->getMessage()} — resetting connection");
            $this->buffer = '';
            $this->conn?->close();
        }
    }

    private function handleReply(mixed $value): void
    {
        if ($value instanceof RespError) {
            // AUTH rejected, PSUBSCRIBE refused (ACL), etc. Reconnecting
            // will not loop hot thanks to the exponential backoff.
            $this->log('warn', "wake subscriber: redis error: {$value->message}");
            $this->conn?->close();

            return;
        }

        if (!is_array($value) || $value === []) {
            return; // +OK from AUTH and other scalar acks
        }

        $kind = is_string($value[0]) ? strtolower($value[0]) : '';

        if ($kind === 'psubscribe') {
            $this->subscribed = true;
            $this->reconnectAttempts = 0;
            $this->log('info', "wake subscriber: subscribed ({$this->pattern})");

            return;
        }

        // pmessage frame: [pmessage, pattern, channel, payload]
        if ($kind === 'pmessage' && isset($value[3]) && is_string($value[3]) && $value[3] !== '') {
            try {
                ($this->onWake)($value[3]);
            } catch (Throwable $e) {
                // The wake callback is supplied by agent:serve; a failure
                // there is its problem to log — never kill the subscription.
                $this->log('warn', "wake subscriber: wake handler failed: {$e->getMessage()}");
            }
        }
    }

    // ==================== Helpers ====================

    /**
     * Encode a command as a RESP array of bulk strings.
     *
     * @param list<string> $args
     */
    private static function encodeCommand(array $args): string
    {
        $out = '*' . count($args) . "\r\n";
        foreach ($args as $arg) {
            $out .= '$' . strlen($arg) . "\r\n" . $arg . "\r\n";
        }

        return $out;
    }

    private function log(string $level, string $message): void
    {
        if ($this->onLog !== null) {
            ($this->onLog)($level, $message);
        }
    }
}
