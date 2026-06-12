<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

/**
 * Bridge between Laravel controllers and connected agents.
 *
 * Controllers push messages to a Redis list per machine.
 * The agent:serve WebSocket server drains these lists
 * and forwards messages to the connected agent.
 *
 * Delivery is guaranteed by agent:serve's periodic Redis poll; on top of
 * that, every push PUBLISHes the machineId on WAKE_CHANNEL so agent:serve
 * (subscribed via AgentWakeSubscriber) can drain the queue immediately
 * instead of waiting for the next poll tick. The publish is best-effort:
 * losing it only costs poll-tick latency, never the message.
 *
 * The public API stays static (all call sites use AgentGateway::send),
 * but the statics delegate to a container-resolved instance so tests can
 * mock/spy the gateway via the container ($this->mock(AgentGateway::class)).
 */
class AgentGateway
{
    /**
     * Pub/sub channel used to wake agent:serve after a push.
     *
     * Note: both phpredis (OPT_PREFIX) and predis (PrefixableCommand) apply
     * the Laravel Redis prefix to PUBLISH channel names, so the on-wire
     * channel is "{prefix}claudenest:agent:wake". The subscriber side uses
     * PSUBSCRIBE with a leading wildcard to stay prefix-agnostic.
     */
    public const WAKE_CHANNEL = 'claudenest:agent:wake';

    private const QUEUE_PREFIX = 'agent:messages:';
    private const QUEUE_TTL = 300; // 5 minutes - messages expire if agent is offline

    /**
     * Send a message to an agent on a specific machine.
     */
    public static function send(string $machineId, string $type, array $payload = []): void
    {
        app(self::class)->sendMessage($machineId, $type, $payload);
    }

    /**
     * Send a message and wait for the agent's response (request-response pattern).
     *
     * @return array|null  The response payload, or null on timeout.
     */
    public static function sendAndWait(string $machineId, string $type, array $payload = [], int $timeout = 5): ?array
    {
        return app(self::class)->sendMessageAndWait($machineId, $type, $payload, $timeout);
    }

    /**
     * Instance implementation of send() — mock this in tests.
     */
    public function sendMessage(string $machineId, string $type, array $payload = []): void
    {
        $message = json_encode([
            'type' => $type,
            'payload' => $payload,
            'id' => Str::uuid()->toString(),
            'timestamp' => now()->getTimestampMs(),
        ]);

        $key = self::QUEUE_PREFIX . $machineId;

        Redis::rpush($key, $message);
        Redis::expire($key, self::QUEUE_TTL);

        // Wake agent:serve immediately (it subscribes to this channel) so the
        // message is forwarded without waiting for the next poll tick.
        // Best-effort: the message is already queued above, and the periodic
        // poll in agent:serve delivers it regardless — a wake failure must
        // therefore never break the send path.
        try {
            Redis::publish(self::WAKE_CHANNEL, $machineId);
        } catch (\Throwable $e) {
            Log::debug('AgentGateway: wake publish failed (poll fallback will deliver)', [
                'machineId' => $machineId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Instance implementation of sendAndWait() — mock this in tests.
     *
     * Uses a unique requestId injected into the payload. The agent responds
     * on a Redis key `agent:response:{requestId}` which we blpop on.
     *
     * @return array|null  The response payload, or null on timeout.
     */
    public function sendMessageAndWait(string $machineId, string $type, array $payload = [], int $timeout = 5): ?array
    {
        $requestId = Str::uuid()->toString();
        $payload['requestId'] = $requestId;

        $responseKey = "agent:response:{$requestId}";

        $this->sendMessage($machineId, $type, $payload);

        try {
            $result = Redis::blpop($responseKey, $timeout);

            if (!$result) {
                return null;
            }

            // blpop returns [key, value]
            $raw = is_array($result) ? ($result[1] ?? null) : $result;
            if (!$raw) {
                return null;
            }

            return json_decode($raw, true);
        } finally {
            Redis::del($responseKey);
        }
    }

    /**
     * Consume all pending messages for a machine.
     *
     * @return array<array{type: string, payload: array, id: string, timestamp: int}>
     */
    public static function consume(string $machineId): array
    {
        $key = self::QUEUE_PREFIX . $machineId;
        $messages = [];

        while ($raw = Redis::lpop($key)) {
            $decoded = json_decode($raw, true);
            if ($decoded) {
                $messages[] = $decoded;
            }
        }

        return $messages;
    }

    /**
     * Get the Redis key for a machine's message queue.
     */
    public static function queueKey(string $machineId): string
    {
        return self::QUEUE_PREFIX . $machineId;
    }
}
