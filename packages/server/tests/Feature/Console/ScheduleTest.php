<?php

namespace Tests\Feature\Console;

use Illuminate\Console\Scheduling\Schedule;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Light guard on the scheduler entries the multi-agent runtime depends on
 * (routes/console.php): expired lock release + runner reconciliation must
 * run every 5 minutes — the daily cleanup alone is far too slow.
 */
class ScheduleTest extends TestCase
{
    #[Test]
    public function multiagent_maintenance_is_scheduled_every_five_minutes(): void
    {
        $events = collect($this->app->make(Schedule::class)->events());

        $this->assertNotEmpty($events, 'No scheduled events registered — routes/console.php not loaded?');

        $maintenance = $events->first(
            fn ($event) => str_contains((string) ($event->description ?? ''), 'multiagent-maintenance'),
        );

        $this->assertNotNull($maintenance, 'multiagent-maintenance schedule entry is missing');
        $this->assertSame('*/5 * * * *', $maintenance->expression);
    }
}
