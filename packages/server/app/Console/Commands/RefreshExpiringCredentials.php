<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\ClaudeCredential;
use App\Services\AgentGateway;
use App\Services\CredentialService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Proactively refreshes OAuth credentials that are within $hours of expiring
 * (default 24h) and reconnects the Claude sessions that depend on them.
 *
 * Runs hourly from the scheduler. Without it, tokens only refresh lazily on the
 * next request (CredentialController::index/show via ensureFresh), so a session
 * left running overnight would hit an expired token mid-task.
 */
class RefreshExpiringCredentials extends Command
{
    protected $signature = 'claudenest:refresh-credentials
                            {--hours=24 : Refresh credentials expiring within this many hours}
                            {--dry-run : List affected credentials without refreshing}';

    protected $description = 'Refresh OAuth credentials nearing expiration and reconnect their Claude sessions';

    public function handle(CredentialService $credentials): int
    {
        $hours = (int) $this->option('hours');
        $dryRun = (bool) $this->option('dry-run');

        $expiring = ClaudeCredential::query()->expiringWithin($hours)->get();

        if ($expiring->isEmpty()) {
            $this->info("No OAuth credentials expiring within {$hours}h.");

            return self::SUCCESS;
        }

        $this->info("Found {$expiring->count()} credential(s) expiring within {$hours}h.");

        $refreshed = 0;
        $reconnected = 0;
        $failed = 0;

        foreach ($expiring as $credential) {
            if ($dryRun) {
                $this->line("  [dry-run] {$credential->name} (expires {$credential->expires_at})");

                continue;
            }

            try {
                $credentials->refreshOAuthToken($credential);
                $credential->refresh();
                $refreshed++;
                $reconnected += $this->reconnectSessions($credential);
                $this->line("  ✓ {$credential->name} refreshed");
            } catch (Throwable $e) {
                $failed++;
                Log::warning('Scheduled credential refresh failed', [
                    'credential_id' => $credential->id,
                    'error' => $e->getMessage(),
                ]);
                $this->warn("  ✗ {$credential->name}: {$e->getMessage()}");
            }
        }

        if ($dryRun) {
            return self::SUCCESS;
        }

        Log::info('Scheduled credential refresh completed', [
            'refreshed' => $refreshed,
            'reconnected_sessions' => $reconnected,
            'failed' => $failed,
        ]);

        $this->info("Done: {$refreshed} refreshed, {$reconnected} session(s) reconnected, {$failed} failed.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Notify each machine running an active session on this credential so the
     * agent re-reads the fresh token and keeps the session alive.
     */
    private function reconnectSessions(ClaudeCredential $credential): int
    {
        $sessions = $credential->sessions()
            ->whereIn('status', ['running', 'waiting_input', 'starting'])
            ->get(['id', 'machine_id']);

        $count = 0;
        foreach ($sessions as $session) {
            if (! $session->machine_id) {
                continue;
            }

            AgentGateway::send($session->machine_id, 'credential:refreshed', [
                'credentialId' => $credential->id,
                'sessionId' => $session->id,
                'accessToken' => $credential->getAccessToken(),
                'expiresAt' => $credential->expires_at?->toIso8601String(),
            ]);
            $count++;
        }

        return $count;
    }
}
