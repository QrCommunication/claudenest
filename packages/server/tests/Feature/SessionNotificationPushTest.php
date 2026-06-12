<?php

namespace Tests\Feature;

use App\Events\SessionNotification;
use App\Models\PushToken;
use App\Models\Session;
use App\Models\User;
use App\Services\ExpoPushService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SessionNotificationPushTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function session_notification_event_sends_expo_push_to_owner_devices(): void
    {
        Http::fake([
            'exp.host/*' => Http::response(['data' => [['status' => 'ok', 'id' => 'ticket-1']]], 200),
        ]);

        $session = Session::factory()->create();
        $pushToken = PushToken::factory()->create(['user_id' => $session->user_id]);

        event(new SessionNotification($session, 'Worker was paused', 'Worker paused', 'warning'));

        Http::assertSent(function (Request $request) use ($pushToken, $session) {
            $messages = $request->data();

            return $request->url() === ExpoPushService::EXPO_PUSH_URL
                && count($messages) === 1
                && $messages[0]['to'] === $pushToken->token
                && $messages[0]['title'] === 'Worker paused'
                && $messages[0]['body'] === 'Worker was paused'
                && $messages[0]['data']['session_id'] === $session->id
                && $messages[0]['data']['project_id'] === $session->shared_project_id
                && $messages[0]['data']['type'] === 'warning'
                && $messages[0]['sound'] === 'default'
                && $messages[0]['priority'] === 'high';
        });
    }

    #[Test]
    public function null_event_title_falls_back_to_app_name(): void
    {
        Http::fake([
            'exp.host/*' => Http::response(['data' => [['status' => 'ok', 'id' => 'ticket-1']]], 200),
        ]);

        $session = Session::factory()->create();
        PushToken::factory()->create(['user_id' => $session->user_id]);

        event(new SessionNotification($session, 'Permission requested'));

        Http::assertSent(fn (Request $request) => $request->data()[0]['title'] === 'ClaudeNest');
    }

    #[Test]
    public function no_http_call_is_made_when_user_has_no_tokens(): void
    {
        Http::fake();

        $session = Session::factory()->create();

        event(new SessionNotification($session, 'No device registered'));

        Http::assertNothingSent();
    }

    #[Test]
    public function push_is_not_sent_to_other_users_tokens(): void
    {
        Http::fake([
            'exp.host/*' => Http::response(['data' => [['status' => 'ok', 'id' => 'ticket-1']]], 200),
        ]);

        $session = Session::factory()->create();
        $ownToken = PushToken::factory()->create(['user_id' => $session->user_id]);
        $otherToken = PushToken::factory()->create(['user_id' => User::factory()->create()->id]);

        event(new SessionNotification($session, 'Owner-only push'));

        Http::assertSent(function (Request $request) use ($ownToken, $otherToken) {
            $recipients = array_column($request->data(), 'to');

            return in_array($ownToken->token, $recipients, true)
                && ! in_array($otherToken->token, $recipients, true);
        });
    }

    #[Test]
    public function device_not_registered_ticket_deletes_the_dead_token(): void
    {
        $session = Session::factory()->create();
        $aliveToken = PushToken::factory()->create(['user_id' => $session->user_id]);
        $deadToken = PushToken::factory()->create(['user_id' => $session->user_id]);

        // Build tickets in the same order as the messages we receive, marking
        // only the dead token as DeviceNotRegistered (order-independent).
        Http::fake(function (Request $request) use ($deadToken) {
            $tickets = array_map(
                fn (array $message) => $message['to'] === $deadToken->token
                    ? [
                        'status' => 'error',
                        'message' => 'device is not registered',
                        'details' => ['error' => 'DeviceNotRegistered'],
                    ]
                    : ['status' => 'ok', 'id' => 'ticket-ok'],
                $request->data(),
            );

            return Http::response(['data' => $tickets], 200);
        });

        event(new SessionNotification($session, 'Prune check'));

        $this->assertDatabaseMissing('push_tokens', ['token' => $deadToken->token]);
        $this->assertDatabaseHas('push_tokens', ['token' => $aliveToken->token]);
    }

    #[Test]
    public function expo_connection_failure_never_propagates(): void
    {
        Http::fake(function () {
            throw new ConnectionException('Connection to exp.host timed out');
        });

        $session = Session::factory()->create();
        $pushToken = PushToken::factory()->create(['user_id' => $session->user_id]);

        // Must not throw — push delivery is best-effort.
        event(new SessionNotification($session, 'Expo is down'));

        $this->assertDatabaseHas('push_tokens', ['token' => $pushToken->token]);
    }

    #[Test]
    public function expo_http_error_status_never_propagates_and_keeps_tokens(): void
    {
        Http::fake([
            'exp.host/*' => Http::response(['errors' => [['code' => 'INTERNAL_SERVER_ERROR']]], 500),
        ]);

        $session = Session::factory()->create();
        $pushToken = PushToken::factory()->create(['user_id' => $session->user_id]);

        event(new SessionNotification($session, 'Expo 500'));

        $this->assertDatabaseHas('push_tokens', ['token' => $pushToken->token]);
    }

    #[Test]
    public function tokens_are_sent_in_chunks_of_one_hundred(): void
    {
        Http::fake(function (Request $request) {
            $tickets = array_fill(0, count($request->data()), ['status' => 'ok', 'id' => 't']);

            return Http::response(['data' => $tickets], 200);
        });

        $session = Session::factory()->create();
        PushToken::factory()->count(101)->create(['user_id' => $session->user_id]);

        event(new SessionNotification($session, 'Chunked push'));

        Http::assertSentCount(2);
        Http::assertSent(fn (Request $request) => count($request->data()) <= 100);
    }
}
