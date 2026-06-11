<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\MfaCodeMail;
use App\Models\PersonalAccessToken;
use App\Models\User;
use App\Services\MfaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

final class MfaController extends Controller
{
    private const MFA_TOKEN_TTL_MINUTES = 5;
    private const MFA_TOKEN_PREFIX = 'mfa_challenge:';
    private const MFA_FAILURES_PREFIX = 'mfa_failures:';
    private const MAX_FAILURES = 5;

    public function __construct(
        private readonly MfaService $mfa,
    ) {}

    // ──────────────────────────────────────────────────────────────────────
    //  Status
    // ──────────────────────────────────────────────────────────────────────

    /** GET /auth/mfa — current MFA status for the authenticated user */
    public function status(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return $this->successResponse([
            'enabled' => $user->mfa_confirmed_at !== null,
            'method' => $user->mfa_method,
            'confirmed_at' => $user->mfa_confirmed_at?->toIso8601String(),
        ], $request);
    }

    // ──────────────────────────────────────────────────────────────────────
    //  TOTP Setup
    // ──────────────────────────────────────────────────────────────────────

    /** POST /auth/mfa/totp/setup — generate secret + QR + URI (pending confirmation) */
    public function totpSetup(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $secret = $this->mfa->generateTotpSecret();
        $uri = $this->mfa->buildTotpUri($secret, $user->email);
        $qr = $this->mfa->generateQrSvg($uri);

        // Store the pending secret encrypted; only activated on confirm
        $user->update([
            'mfa_method' => 'totp',
            'mfa_secret' => Crypt::encryptString($secret),
        ]);

        return $this->successResponse([
            'secret' => $secret,
            'uri' => $uri,
            'qr_svg' => $qr,
        ], $request);
    }

    /** POST /auth/mfa/totp/confirm — verify code, activate TOTP, return recovery codes ONCE */
    public function totpConfirm(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string|digits:6']);

        /** @var User $user */
        $user = $request->user();

        if (!$user->mfa_secret || $user->mfa_method !== 'totp') {
            return $this->errorResponse('MFA_001', 'TOTP setup not initiated', 400);
        }

        $secret = Crypt::decryptString($user->mfa_secret);

        if (!$this->mfa->verifyTotp($secret, $request->input('code'))) {
            return $this->errorResponse('MFA_002', 'Invalid TOTP code', 422);
        }

        $codes = $this->mfa->generateRecoveryCodes();

        $user->update([
            'mfa_confirmed_at' => now(),
            'mfa_recovery_codes' => Crypt::encryptString(json_encode($codes['hashed'])),
        ]);

        return $this->successResponse([
            'method' => 'totp',
            'recovery_codes' => $codes['plain'],
        ], $request, 'MFA activated. Store your recovery codes safely — they will not be shown again.');
    }

    // ──────────────────────────────────────────────────────────────────────
    //  Email OTP Setup
    // ──────────────────────────────────────────────────────────────────────

    /** POST /auth/mfa/email/setup — send OTP to user's email */
    public function emailSetup(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $code = $this->mfa->generateEmailOtp($user->id);

        // Stage the method before confirmation
        $user->update(['mfa_method' => 'email']);

        Mail::to($user->email)->send(new MfaCodeMail($code));

        return $this->successResponse([
            'message' => 'Verification code sent to your email.',
        ], $request);
    }

    /** POST /auth/mfa/email/confirm — verify OTP, activate email MFA, return recovery codes ONCE */
    public function emailConfirm(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string|digits:6']);

        /** @var User $user */
        $user = $request->user();

        if (!$this->mfa->verifyEmailOtp($user->id, $request->input('code'))) {
            return $this->errorResponse('MFA_002', 'Invalid or expired verification code', 422);
        }

        $codes = $this->mfa->generateRecoveryCodes();

        $user->update([
            'mfa_confirmed_at' => now(),
            'mfa_recovery_codes' => Crypt::encryptString(json_encode($codes['hashed'])),
        ]);

        return $this->successResponse([
            'method' => 'email',
            'recovery_codes' => $codes['plain'],
        ], $request, 'MFA activated. Store your recovery codes safely — they will not be shown again.');
    }

    // ──────────────────────────────────────────────────────────────────────
    //  Disable
    // ──────────────────────────────────────────────────────────────────────

    /** DELETE /auth/mfa — disable MFA (requires current password) */
    public function disable(Request $request): JsonResponse
    {
        $request->validate(['current_password' => 'required|string']);

        /** @var User $user */
        $user = $request->user();

        if (!Hash::check($request->input('current_password'), $user->password)) {
            return $this->errorResponse('AUTH_002', 'Invalid password', 422);
        }

        $user->update([
            'mfa_method' => null,
            'mfa_secret' => null,
            'mfa_recovery_codes' => null,
            'mfa_confirmed_at' => null,
        ]);

        return $this->successResponse(['message' => 'MFA disabled.'], $request);
    }

    // ──────────────────────────────────────────────────────────────────────
    //  Recovery codes regeneration
    // ──────────────────────────────────────────────────────────────────────

    /** POST /auth/mfa/recovery/regenerate — issue new recovery codes (requires password) */
    public function regenerateRecoveryCodes(Request $request): JsonResponse
    {
        $request->validate(['current_password' => 'required|string']);

        /** @var User $user */
        $user = $request->user();

        if (!Hash::check($request->input('current_password'), $user->password)) {
            return $this->errorResponse('AUTH_002', 'Invalid password', 422);
        }

        if (!$user->mfa_confirmed_at) {
            return $this->errorResponse('MFA_003', 'MFA is not activated', 400);
        }

        $codes = $this->mfa->generateRecoveryCodes();

        $user->update([
            'mfa_recovery_codes' => Crypt::encryptString(json_encode($codes['hashed'])),
        ]);

        return $this->successResponse([
            'recovery_codes' => $codes['plain'],
        ], $request, 'Recovery codes regenerated. Store them safely.');
    }

    // ──────────────────────────────────────────────────────────────────────
    //  Challenge / Verify (public — called during login flow)
    // ──────────────────────────────────────────────────────────────────────

    /**
     * POST /auth/mfa/verify (public, throttled)
     * Exchange mfa_token + code (TOTP / email OTP / recovery code) → Sanctum token
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'mfa_token' => 'required|string|size:64',
            'code' => 'required|string',
        ]);

        $tokenHash = hash('sha256', $request->input('mfa_token'));
        $cacheKey = self::MFA_TOKEN_PREFIX . $tokenHash;
        $failKey = self::MFA_FAILURES_PREFIX . $tokenHash;

        // Look up user_id via the challenge token
        $userId = Cache::get($cacheKey);
        if (!$userId) {
            return $this->errorResponse('MFA_004', 'Invalid or expired MFA session. Please log in again.', 401);
        }

        // Fail-safe: too many wrong attempts → invalidate token
        $failures = (int) Cache::get($failKey, 0);
        if ($failures >= self::MAX_FAILURES) {
            Cache::forget($cacheKey);
            Cache::forget($failKey);
            return $this->errorResponse('MFA_005', 'Too many failed attempts. Please log in again.', 429);
        }

        /** @var User|null $user */
        $user = User::find($userId);
        if (!$user || !$user->mfa_confirmed_at) {
            Cache::forget($cacheKey);
            return $this->errorResponse('MFA_004', 'Invalid MFA session.', 401);
        }

        $code = (string) $request->input('code');
        $valid = false;

        switch ($user->mfa_method) {
            case 'totp':
                if ($user->mfa_secret) {
                    $secret = Crypt::decryptString($user->mfa_secret);
                    $valid = $this->mfa->verifyTotp($secret, $code);
                }
                break;

            case 'email':
                $valid = $this->mfa->verifyEmailOtp($user->id, $code);
                break;
        }

        // Check recovery codes as fallback regardless of method
        if (!$valid && $user->mfa_recovery_codes) {
            $hashedCodes = json_decode(Crypt::decryptString($user->mfa_recovery_codes), true) ?? [];
            $matchIndex = $this->mfa->findMatchingRecoveryCode($code, $hashedCodes);
            if ($matchIndex >= 0) {
                // Burn the used recovery code (set to null)
                $hashedCodes[$matchIndex] = null;
                $user->update([
                    'mfa_recovery_codes' => Crypt::encryptString(json_encode($hashedCodes)),
                ]);
                $valid = true;
            }
        }

        if (!$valid) {
            Cache::increment($failKey);
            Cache::put($failKey, Cache::get($failKey, 1), now()->addMinutes(self::MFA_TOKEN_TTL_MINUTES));
            return $this->errorResponse('MFA_002', 'Invalid verification code', 422);
        }

        // Verification successful — clean up challenge token and issue Sanctum token
        Cache::forget($cacheKey);
        Cache::forget($failKey);

        $tokenResult = PersonalAccessToken::createForUser($user->id, 'API Access Token', ['*'], 30);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->formatUser($user),
                'token' => $tokenResult['plainTextToken'],
                'expires_at' => $tokenResult['model']->expires_at,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────
    //  Resend email OTP during challenge phase (public, throttled)
    // ──────────────────────────────────────────────────────────────────────

    /** POST /auth/mfa/resend — resend email OTP using a live mfa_token */
    public function resend(Request $request): JsonResponse
    {
        $request->validate(['mfa_token' => 'required|string|size:64']);

        $tokenHash = hash('sha256', $request->input('mfa_token'));
        $userId = Cache::get(self::MFA_TOKEN_PREFIX . $tokenHash);

        if (!$userId) {
            return $this->errorResponse('MFA_004', 'Invalid or expired MFA session. Please log in again.', 401);
        }

        /** @var User|null $user */
        $user = User::find($userId);
        if (!$user || $user->mfa_method !== 'email') {
            return $this->errorResponse('MFA_006', 'Email MFA is not configured for this account.', 400);
        }

        $code = $this->mfa->generateEmailOtp($user->id);
        Mail::to($user->email)->send(new MfaCodeMail($code));

        return $this->successResponse(['message' => 'Verification code resent.'], $request);
    }

    // ──────────────────────────────────────────────────────────────────────
    //  Internal helpers
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Issue a short-lived MFA challenge token, store user_id in Redis,
     * and (for email method) immediately send the OTP.
     *
     * Called statically by AuthController::login() when MFA is active.
     *
     * @param  string  $userId
     * @param  string|null  $method  'totp' or 'email'
     * @return array{0: string, 1: array{mfa_required: true, mfa_method: string|null, mfa_token: string}}
     */
    public static function issueChallengeToken(string $userId, ?string $method): array
    {
        $token = Str::random(64);
        $hash = hash('sha256', $token);

        Cache::put(
            self::MFA_TOKEN_PREFIX . $hash,
            $userId,
            now()->addMinutes(self::MFA_TOKEN_TTL_MINUTES),
        );

        // For email method, generate and send OTP immediately
        if ($method === 'email') {
            /** @var User|null $user */
            $user = User::find($userId);
            if ($user) {
                /** @var MfaService $mfa */
                $mfa = app(MfaService::class);
                $code = $mfa->generateEmailOtp($userId);
                Mail::to($user->email)->send(new MfaCodeMail($code));
            }
        }

        return [
            $token,
            [
                'mfa_required' => true,
                'mfa_method' => $method,
                'mfa_token' => $token,
            ],
        ];
    }

    private function successResponse(array $data, Request $request, ?string $message = null): JsonResponse
    {
        $payload = [
            'success' => true,
            'data' => $data,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ];

        if ($message !== null) {
            $payload['message'] = $message;
        }

        return response()->json($payload);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'avatar_url' => $user->avatar_url,
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            'created_at' => $user->created_at->toIso8601String(),
        ];
    }
}
