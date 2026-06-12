<?php

namespace Tests\Unit\Services;

use App\Services\AgentGateway;
use Illuminate\Support\Facades\Redis;
use PHPUnit\Framework\Attributes\Test;
use RuntimeException;
use Tests\TestCase;

class AgentGatewayTest extends TestCase
{
    #[Test]
    public function send_pushes_the_message_then_publishes_a_wake(): void
    {
        $machineId = 'machine-123';

        // ->ordered() on rpush + publish: the wake must fire AFTER the
        // message is queued, otherwise agent:serve could drain an empty
        // list and leave the message waiting for the next poll tick.
        Redis::shouldReceive('rpush')
            ->once()
            ->ordered()
            ->withArgs(function (string $key, string $raw) use ($machineId): bool {
                $message = json_decode($raw, true);

                return $key === "agent:messages:{$machineId}"
                    && ($message['type'] ?? null) === 'session:create'
                    && ($message['payload'] ?? null) === ['foo' => 'bar']
                    && isset($message['id'], $message['timestamp']);
            });

        Redis::shouldReceive('expire')
            ->once()
            ->with("agent:messages:{$machineId}", 300);

        Redis::shouldReceive('publish')
            ->once()
            ->ordered()
            ->with(AgentGateway::WAKE_CHANNEL, $machineId);

        AgentGateway::send($machineId, 'session:create', ['foo' => 'bar']);
    }

    #[Test]
    public function send_survives_a_failed_wake_publish(): void
    {
        // The wake is a best-effort latency optimizer: the rpush above it is
        // the delivery guarantee (agent:serve polls the list). A pub/sub
        // failure must therefore never bubble out of send().
        Redis::shouldReceive('rpush')->once();
        Redis::shouldReceive('expire')->once();
        Redis::shouldReceive('publish')
            ->once()
            ->andThrow(new RuntimeException('pubsub down'));

        AgentGateway::send('machine-123', 'session:create');

        // Reaching this line without an exception IS the behavior under
        // test; the mock expectations above assert the rest.
        $this->assertTrue(true);
    }

    #[Test]
    public function send_and_wait_also_publishes_a_wake(): void
    {
        // sendAndWait() delegates to sendMessage(), so the wake must fire
        // there too — a regression here would re-add up to a full poll
        // interval of latency to every request/response round-trip.
        Redis::shouldReceive('rpush')->once()->ordered();
        Redis::shouldReceive('expire')->once();
        Redis::shouldReceive('publish')
            ->once()
            ->ordered()
            ->with(AgentGateway::WAKE_CHANNEL, 'machine-123');
        Redis::shouldReceive('blpop')->once()->andReturn(null);
        Redis::shouldReceive('del')->once();

        $this->assertNull(AgentGateway::sendAndWait('machine-123', 'project:scan', [], 1));
    }
}
