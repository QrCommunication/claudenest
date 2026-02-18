<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

/**
 * Bridge between Laravel controllers and connected agents.
 *
 * Controllers push messages to a Redis list per machine.
 * The agent:serve WebSocket server polls these lists
 * and forwards messages to the connected agent.
 */
class AgentGateway
{
    private const QUEUE_PREFIX = 'agent:messages:';
    private const QUEUE_TTL = 300; // 5 minutes - messages expire if agent is offline

    /**
     * Send a message to an agent on a specific machine.
     */
    public static function send(string $machineId, string $type, array $payload = []): void
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
     * Send a message and wait for the agent's response (request-response pattern).
     *
     * Uses a unique requestId injected into the payload. The agent responds
     * on a Redis key `agent:response:{requestId}` which we blpop on.
     *
     * @return array|null  The response payload, or null on timeout.
     */
    public static function sendAndWait(string $machineId, string $type, array $payload = [], int $timeout = 5): ?array
    {
        $requestId = Str::uuid()->toString();
        $payload['requestId'] = $requestId;

        $responseKey = "agent:response:{$requestId}";

        self::send($machineId, $type, $payload);

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
     * Get the Redis key for a machine's message queue.
     */
    public static function queueKey(string $machineId): string
    {
        return self::QUEUE_PREFIX . $machineId;
    }
}
