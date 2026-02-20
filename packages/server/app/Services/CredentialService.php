<?php

namespace App\Services;

use App\Models\ClaudeCredential;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;

class CredentialService
{
    private const OAUTH_TOKEN_URL = 'https://platform.claude.com/v1/oauth/token';
    private const OAUTH_CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';

    /**
     * Get environment variables to inject into a Claude Code session.
     */
    public function getSessionEnv(ClaudeCredential $credential): array
    {
        $env = [];

        if ($credential->auth_type === 'api_key') {
            $key = $credential->getApiKey();
            if (!$key) {
                throw new \RuntimeException("No API key stored for credential '{$credential->name}'");
            }
            $env['ANTHROPIC_API_KEY'] = $key;
        } else {
            $token = $credential->getAccessToken();
            if (!$token) {
                throw new \RuntimeException(
                    "No OAuth token for credential '{$credential->name}'. Capture tokens first."
                );
            }

            if ($credential->is_expired && $credential->has_refresh_token) {
                $this->refreshOAuthToken($credential);
                $credential->refresh();
                $token = $credential->getAccessToken();
            }

            $env['CLAUDE_CODE_OAUTH_TOKEN'] = $token;
        }

        if ($credential->claude_dir_mode === 'isolated') {
            $env['CLAUDE_CONFIG_DIR'] = '$HOME/.claude-' . $credential->name;
        }

        $credential->markUsed();

        return $env;
    }

    /**
     * Refresh an expired OAuth token.
     */
    public function refreshOAuthToken(ClaudeCredential $credential): array
    {
        if ($credential->auth_type !== 'oauth') {
            throw new \InvalidArgumentException("Credential '{$credential->name}' is not OAuth");
        }

        $refreshToken = $credential->getRefreshToken();
        if (!$refreshToken) {
            throw new \RuntimeException(
                "No refresh token stored for '{$credential->name}'. Use 'Capture' to import your OAuth tokens first."
            );
        }

        $response = Http::timeout(15)->post(self::OAUTH_TOKEN_URL, [
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
            'client_id' => self::OAUTH_CLIENT_ID,
        ]);

        if (!$response->successful()) {
            \Log::warning('OAuth refresh failed', [
                'credential_id' => $credential->id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException(
                "OAuth refresh failed (HTTP {$response->status()}). Check server logs for details."
            );
        }

        $data = $response->json();
        $newAccess = $data['access_token'] ?? '';
        $newRefresh = $data['refresh_token'] ?? '';
        $expiresIn = $data['expires_in'] ?? 0;

        if (!$newAccess) {
            throw new \RuntimeException('OAuth refresh response missing access_token');
        }

        $hint = 'oat01-...' . substr($newAccess, -6);
        $credential->update([
            'access_token_enc' => Crypt::encryptString($newAccess),
            'refresh_token_enc' => $newRefresh ? Crypt::encryptString($newRefresh) : $credential->refresh_token_enc,
            'expires_at' => $expiresIn ? now()->addSeconds($expiresIn) : null,
            'key_hint' => $hint,
        ]);

        return [
            'refreshed' => true,
            'token_preview' => $hint,
            'expires_in_min' => $expiresIn ? intdiv($expiresIn, 60) : null,
        ];
    }

    /**
     * Capture OAuth tokens from direct input or credentials JSON.
     *
     * Accepts tokens directly (for remote/production use) or parses
     * the raw JSON content of ~/.claude/.credentials.json.
     */
    public function captureOAuthTokens(ClaudeCredential $credential, array $params = []): array
    {
        if ($credential->auth_type !== 'oauth') {
            throw new \InvalidArgumentException("Credential '{$credential->name}' is not OAuth type.");
        }

        $accessToken = '';
        $refreshToken = '';
        $expiresAt = 0;

        // Option 1: Direct token parameters
        if (!empty($params['access_token'])) {
            $accessToken = $params['access_token'];
            $refreshToken = $params['refresh_token'] ?? '';
            $expiresAt = $params['expires_at'] ?? 0;
        }
        // Option 2: Raw JSON from credentials file content
        elseif (!empty($params['credentials_json'])) {
            $data = json_decode($params['credentials_json'], true);
            if (!$data) {
                throw new \RuntimeException('Invalid JSON provided.');
            }
            $oauth = $data['claudeAiOauth'] ?? [];
            $accessToken = $oauth['accessToken'] ?? '';
            $refreshToken = $oauth['refreshToken'] ?? '';
            $expiresAt = $oauth['expiresAt'] ?? 0;
        }
        // Option 3: Fallback to reading local file (dev/self-hosted only)
        else {
            $home = getenv('HOME') ?: (function_exists('posix_getpwuid') ? (posix_getpwuid(posix_getuid())['dir'] ?? '/root') : '/root');
            $credPath = $home . '/.claude/.credentials.json';

            if (!file_exists($credPath)) {
                throw new \RuntimeException(
                    'No tokens provided. Paste your tokens directly or provide the JSON content from ~/.claude/.credentials.json'
                );
            }

            $data = json_decode(file_get_contents($credPath), true);
            $oauth = $data['claudeAiOauth'] ?? [];
            $accessToken = $oauth['accessToken'] ?? '';
            $refreshToken = $oauth['refreshToken'] ?? '';
            $expiresAt = $oauth['expiresAt'] ?? 0;
        }

        if (!$accessToken) {
            throw new \RuntimeException('No access token found. Provide access_token or valid credentials JSON.');
        }

        $hint = 'oat01-...' . substr($accessToken, -6);
        $credential->update([
            'access_token_enc' => Crypt::encryptString($accessToken),
            'refresh_token_enc' => $refreshToken ? Crypt::encryptString($refreshToken) : null,
            'expires_at' => $expiresAt > 0 ? \Carbon\Carbon::createFromTimestampMs($expiresAt) : null,
            'key_hint' => $hint,
        ]);

        $remainingMin = null;
        if ($expiresAt > 0) {
            $remainingMin = intdiv($expiresAt - (int)(microtime(true) * 1000), 60000);
        }

        return [
            'captured' => true,
            'token_preview' => $hint,
            'has_refresh' => (bool) $refreshToken,
            'expires_in_min' => $remainingMin,
        ];
    }

    /**
     * Test if a credential is valid.
     */
    public function testCredential(ClaudeCredential $credential): array
    {
        if ($credential->auth_type === 'api_key') {
            $key = $credential->getApiKey();
            if (!$key) {
                return ['valid' => false, 'reason' => 'No API key stored'];
            }
            $response = Http::timeout(10)
                ->withHeaders(['x-api-key' => $key, 'anthropic-version' => '2023-06-01'])
                ->post('https://api.anthropic.com/v1/messages', [
                    'model' => 'claude-haiku-4-5-20251001',
                    'max_tokens' => 1,
                    'messages' => [['role' => 'user', 'content' => 'hi']],
                ]);
            return [
                'valid' => $response->successful(),
                'status' => $response->status(),
            ];
        }

        return [
            'valid' => !$credential->is_expired,
            'token_status' => $credential->token_status,
            'expires_at' => $credential->expires_at?->toIso8601String(),
        ];
    }
}
