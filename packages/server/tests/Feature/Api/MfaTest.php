<?php

namespace Tests\Feature\Api;

use App\Http\Controllers\Api\MfaController;
use App\Models\User;
use App\Services\MfaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class MfaTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────────────────────────
    //  TOTP Enrollment
    // ──────────────────────────────────────────────────────────────────

    #[Test]
    public function user_can_setup_and_confirm_totp_mfa(): void
    {
        $user = User::factory()->create();

        // Step 1: initiate TOTP setup — returns secret + QR
        $setupResponse = $this->actingAs($user)
            ->postJson('/api/auth/mfa/totp/setup');

        $setupResponse->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => ['secret', 'uri', 'qr_svg'],
            ]);

        $secret = $setupResponse->json('data.secret');
        $this->assertNotEmpty($secret);

        // Step 2: confirm with a valid TOTP code
        /** @var MfaService $mfa */
        $mfa = app(MfaService::class);
        $code = app(\PragmaRX\Google2FA\Google2FA::class)->getCurrentOtp($secret);

        $confirmResponse = $this->actingAs($user)
            ->postJson('/api/auth/mfa/totp/confirm', ['code' => $code]);

        $confirmResponse->assertOk()
            ->assertJsonPath('data.method', 'totp')
            ->assertJsonStructure([
                'data' => ['method', 'recovery_codes'],
            ]);

        $recoveryCodes = $confirmResponse->json('data.recovery_codes');
        $this->assertCount(8, $recoveryCodes);

        // Verify DB state
        $user->refresh();
        $this->assertNotNull($user->mfa_confirmed_at);
        $this->assertSame('totp', $user->mfa_method);
    }

    // ──────────────────────────────────────────────────────────────────
    //  Email OTP Login Challenge
    // ──────────────────────────────────────────────────────────────────

    #[Test]
    public function login_triggers_mfa_challenge_for_email_otp_user(): void
    {
        Mail::fake();

        /** @var MfaService $mfa */
        $mfa = app(MfaService::class);

        $user = User::factory()->create([
            'password' => Hash::make('correct-password'),
            'mfa_method' => 'email',
            'mfa_confirmed_at' => now(),
            // No mfa_secret needed for email method
        ]);

        // Login should NOT return a token — it should return mfa_required
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ]);

        $loginResponse->assertOk()
            ->assertJsonPath('data.mfa_required', true)
            ->assertJsonPath('data.mfa_method', 'email')
            ->assertJsonStructure(['data' => ['mfa_required', 'mfa_method', 'mfa_token']]);

        // Ensure no Sanctum token was created
        $this->assertNull($loginResponse->json('data.token'));

        // Verify OTP email was sent
        Mail::assertSent(\App\Mail\MfaCodeMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email);
        });

        // Now verify with the correct OTP
        $mfaToken = $loginResponse->json('data.mfa_token');
        $otp = $mfa->generateEmailOtp($user->id); // Fresh OTP (overrides the one sent at login)

        $verifyResponse = $this->postJson('/api/auth/mfa/verify', [
            'mfa_token' => $mfaToken,
            'code' => $otp,
        ]);

        $verifyResponse->assertOk()
            ->assertJsonStructure(['data' => ['token', 'user', 'expires_at']]);
    }

    // ──────────────────────────────────────────────────────────────────
    //  Recovery Code Usage
    // ──────────────────────────────────────────────────────────────────

    #[Test]
    public function user_can_complete_mfa_challenge_with_recovery_code(): void
    {
        /** @var MfaService $mfa */
        $mfa = app(MfaService::class);

        $codes = $mfa->generateRecoveryCodes();
        $plainRecoveryCodes = $codes['plain'];  // e.g. ['AAAAA-BBBBB', ...]

        $user = User::factory()->create([
            'password' => Hash::make('correct-password'),
            'mfa_method' => 'totp',
            'mfa_secret' => Crypt::encryptString('DUMMYSECRET'),
            'mfa_confirmed_at' => now(),
            'mfa_recovery_codes' => Crypt::encryptString(json_encode($codes['hashed'])),
        ]);

        // Issue a challenge token manually (simulating a completed login step)
        [$mfaToken] = MfaController::issueChallengeToken($user->id, $user->mfa_method);

        // Use the first recovery code
        $verifyResponse = $this->postJson('/api/auth/mfa/verify', [
            'mfa_token' => $mfaToken,
            'code' => $plainRecoveryCodes[0],
        ]);

        $verifyResponse->assertOk()
            ->assertJsonStructure(['data' => ['token', 'user', 'expires_at']]);

        // Verify the recovery code was burned (set to null in DB)
        $user->refresh();
        $storedCodes = json_decode(Crypt::decryptString($user->mfa_recovery_codes), true);
        $this->assertNull($storedCodes[0], 'First recovery code should be burned after use');
        $this->assertNotNull($storedCodes[1], 'Other recovery codes should remain valid');
    }

    // ──────────────────────────────────────────────────────────────────
    //  Disable MFA
    // ──────────────────────────────────────────────────────────────────

    #[Test]
    public function user_can_disable_mfa_with_correct_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('correct-password'),
            'mfa_method' => 'totp',
            'mfa_secret' => Crypt::encryptString('DUMMYSECRET'),
            'mfa_confirmed_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->deleteJson('/api/auth/mfa', [
                'current_password' => 'correct-password',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.message', 'MFA disabled.');

        $user->refresh();
        $this->assertNull($user->mfa_confirmed_at);
        $this->assertNull($user->mfa_method);
        $this->assertNull($user->mfa_secret);
        $this->assertNull($user->mfa_recovery_codes);
    }

    #[Test]
    public function disable_mfa_fails_with_wrong_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('correct-password'),
            'mfa_method' => 'totp',
            'mfa_confirmed_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->deleteJson('/api/auth/mfa', [
                'current_password' => 'wrong-password',
            ]);

        // Same convention as AuthController::updatePassword — wrong password = 422
        $response->assertStatus(422);

        $user->refresh();
        $this->assertNotNull($user->mfa_confirmed_at, 'MFA must stay enabled after a failed disable attempt');
    }

    #[Test]
    public function mfa_challenge_is_invalidated_after_max_failures(): void
    {
        $user = User::factory()->create([
            'mfa_method' => 'totp',
            'mfa_secret' => Crypt::encryptString('DUMMYSECRET'),
            'mfa_confirmed_at' => now(),
        ]);

        [$mfaToken] = MfaController::issueChallengeToken($user->id, $user->mfa_method);

        // 5 wrong attempts
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/mfa/verify', [
                'mfa_token' => $mfaToken,
                'code' => '000000',
            ])->assertStatus(422);
        }

        // 6th attempt returns 429 (token invalidated)
        $this->postJson('/api/auth/mfa/verify', [
            'mfa_token' => $mfaToken,
            'code' => '000000',
        ])->assertStatus(429);
    }
}
