<?php

namespace App\Listeners;

use App\Events\SessionNotification;
use App\Services\ExpoPushService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

/**
 * Relays every SessionNotification event (worker paused, permission request,
 * coordinator spawned, ...) as an Expo push notification to the devices of
 * the session owner. Queued so the HTTP call to Expo never delays the
 * dispatching request/worker.
 */
class SendSessionNotificationPush implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        private ExpoPushService $expoPushService,
    ) {}

    public function handle(SessionNotification $event): void
    {
        $session = $event->session;

        if (empty($session->user_id)) {
            return;
        }

        $this->expoPushService->sendToUser(
            $session->user_id,
            $event->title ?? 'ClaudeNest',
            $event->message,
            [
                'session_id' => $session->id,
                'project_id' => $session->shared_project_id,
                'type' => $event->notificationType,
            ],
        );
    }
}
