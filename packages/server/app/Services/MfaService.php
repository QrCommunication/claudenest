<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class MfaService
{
    private const OTP_TTL_MINUTES = 10;
    private const OTP_CACHE_PREFIX = 'mfa_email_otp:';
    private const OTP_FAILURES_PREFIX = 'mfa_email_otp_failures:';
    private const RECOVERY_CODES_COUNT = 8;

    private Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    // ──────────────────────────────────────────────────────────────────────
    //  TOTP
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Generate a new TOTP secret (Base32 encoded, 32 chars).
     */
    public function generateTotpSecret(): string
    {
        return $this->google2fa->generateSecretKey(32);
    }

    /**
     * Build the otpauth:// URI used by authenticator apps.
     */
    public function buildTotpUri(string $secret, string $email, string $issuer = 'ClaudeNest'): string
    {
        return $this->google2fa->getQRCodeUrl($issuer, $email, $secret);
    }

    /**
     * Generate an SVG QR code for the given otpauth URI.
     * Returns inline SVG markup — no base64, no external requests.
     */
    public function generateQrSvg(string $uri): string
    {
        $renderer = new \BaconQrCode\Renderer\Image\SvgImageBackEnd();
        $writer = new \BaconQrCode\Writer(
            new \BaconQrCode\Renderer\ImageRenderer(
                new \BaconQrCode\Renderer\RendererStyle\RendererStyle(200),
                $renderer,
            ),
        );

        return $writer->writeString($uri);
    }

    /**
     * Verify a TOTP code. Window=1 allows for ±30-second drift.
     */
    public function verifyTotp(string $secret, string $code, int $window = 1): bool
    {
        try {
            return (bool) $this->google2fa->verifyKey($secret, $code, $window);
        } catch (\Throwable) {
            return false;
        }
    }

    // ──────────────────────────────────────────────────────────────────────
    //  Email OTP
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Generate a 6-digit OTP, store its bcrypt hash in Redis for 10 min.
     * Returns the plaintext code (to be sent by mail — never stored again).
     */
    public function generateEmailOtp(string|int $userId): string
    {
        $code = (string) random_int(100000, 999999);

        Cache::put(
            self::OTP_CACHE_PREFIX . $userId,
            Hash::make($code),
            now()->addMinutes(self::OTP_TTL_MINUTES),
        );

        // Reset failure counter when issuing a new code
        Cache::forget(self::OTP_FAILURES_PREFIX . $userId);

        return $code;
    }

    /**
     * Verify an email OTP. Returns true on success, false otherwise.
     * Deletes the stored hash after a successful verification.
     */
    public function verifyEmailOtp(string|int $userId, string $code): bool
    {
        $key = self::OTP_CACHE_PREFIX . $userId;
        $stored = Cache::get($key);

        if (!$stored) {
            return false;
        }

        if (!Hash::check($code, $stored)) {
            return false;
        }

        Cache::forget($key);
        Cache::forget(self::OTP_FAILURES_PREFIX . $userId);

        return true;
    }

    // ──────────────────────────────────────────────────────────────────────
    //  Recovery Codes
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Generate 8 recovery codes (plain) and their bcrypt hashes.
     * Returns ['plain' => [...], 'hashed' => [...]]
     */
    public function generateRecoveryCodes(): array
    {
        $plain = [];
        $hashed = [];

        for ($i = 0; $i < self::RECOVERY_CODES_COUNT; $i++) {
            $code = Str::upper(Str::random(5)) . '-' . Str::upper(Str::random(5));
            $plain[] = $code;
            $hashed[] = Hash::make($code);
        }

        return ['plain' => $plain, 'hashed' => $hashed];
    }

    /**
     * Check if a given code matches any stored recovery code hash.
     * Returns the index of the matching code, or -1 if none match.
     */
    public function findMatchingRecoveryCode(string $code, array $hashedCodes): int
    {
        foreach ($hashedCodes as $index => $hash) {
            if ($hash !== null && Hash::check($code, $hash)) {
                return (int) $index;
            }
        }

        return -1;
    }
}
