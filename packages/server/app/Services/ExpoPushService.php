<?php

namespace App\Services;

use App\Models\PushToken;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Sends push notifications through the Expo Push API (plain HTTP, no SDK).
 *
 * Failure policy: push delivery is best-effort — this service NEVER throws.
 * Errors are logged as warnings so callers (queued listeners, controllers)
 * are never blocked by Expo downtime.
 */
class ExpoPushService
{
    public const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    /** Expo accepts at most 100 messages per request. */
    private const CHUNK_SIZE = 100;

    private const TIMEOUT_SECONDS = 10;

    /**
     * Send a push notification to every registered device of a user.
     */
    public function sendToUser(string $userId, string $title, string $body, array $data = []): void
    {
        $tokens = PushToken::forUser($userId)->pluck('token');

        if ($tokens->isEmpty()) {
            return;
        }

        foreach ($tokens->chunk(self::CHUNK_SIZE) as $chunk) {
            $this->sendChunk($chunk->values(), $title, $body, $data);
        }
    }

    /**
     * @param  Collection<int, string>  $tokens
     */
    private function sendChunk(Collection $tokens, string $title, string $body, array $data): void
    {
        $messages = $tokens->map(fn (string $token) => [
            'to' => $token,
            'title' => $title,
            'body' => $body,
            'data' => $data,
            'sound' => 'default',
            'priority' => 'high',
        ])->all();

        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->acceptJson()
                ->post(self::EXPO_PUSH_URL, $messages);

            if ($response->failed()) {
                Log::warning('Expo push: HTTP error from Expo API', [
                    'status' => $response->status(),
                    'tokens_count' => $tokens->count(),
                ]);

                return;
            }

            $this->pruneDeadTokens($tokens, $response->json('data') ?? []);
        } catch (Throwable $e) {
            Log::warning('Expo push: send failed', [
                'tokens_count' => $tokens->count(),
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Expo returns one ticket per message, in the same order as sent.
     * A DeviceNotRegistered ticket means the token is permanently dead
     * (app uninstalled, token rotated) and must be removed.
     *
     * @param  Collection<int, string>  $tokens
     */
    private function pruneDeadTokens(Collection $tokens, array $tickets): void
    {
        $dead = [];

        foreach (array_values($tickets) as $index => $ticket) {
            if (($ticket['status'] ?? null) === 'error'
                && ($ticket['details']['error'] ?? null) === 'DeviceNotRegistered'
                && $tokens->has($index)) {
                $dead[] = $tokens->get($index);
            }
        }

        if ($dead === []) {
            return;
        }

        PushToken::whereIn('token', $dead)->delete();

        Log::info('Expo push: pruned dead tokens', ['count' => count($dead)]);
    }
}
