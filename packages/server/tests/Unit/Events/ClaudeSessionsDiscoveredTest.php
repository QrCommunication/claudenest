<?php

namespace Tests\Unit\Events;

use App\Events\ClaudeSessionsDiscovered;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Anti-regression for the 946 "Pusher error: Payload too large" failed
 * jobs: this broadcast must stay a slim signal (machine_id + count) far
 * below Reverb's ~10KB payload cap, whatever the number of discovered
 * sessions — clients refetch the list via REST.
 */
class ClaudeSessionsDiscoveredTest extends TestCase
{
    #[Test]
    public function broadcast_payload_stays_under_two_kilobytes_regardless_of_session_count(): void
    {
        $machineId = (string) Str::uuid();

        foreach ([0, 50, 5000] as $count) {
            $event = new ClaudeSessionsDiscovered($machineId, $count);
            $payload = $event->broadcastWith();

            $this->assertLessThanOrEqual(2048, strlen(json_encode($payload)));
            $this->assertSame($machineId, $payload['machine_id']);
            $this->assertSame($count, $payload['count']);
            $this->assertArrayHasKey('timestamp', $payload);
            $this->assertArrayNotHasKey('sessions', $payload);
        }
    }

    #[Test]
    public function broadcast_contract_is_unchanged_for_existing_listeners(): void
    {
        $machineId = (string) Str::uuid();
        $event = new ClaudeSessionsDiscovered($machineId, 3);

        $this->assertSame('claude_sessions.discovered', $event->broadcastAs());

        $channels = $event->broadcastOn();
        $this->assertCount(1, $channels);
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
        $this->assertSame('private-machines.' . $machineId, (string) $channels[0]);
    }
}
