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
     * Get the Redis key for a machine's message queue.
     */
    public static function queueKey(string $machineId): string
    {
        return self::QUEUE_PREFIX . $machineId;
    }
}
