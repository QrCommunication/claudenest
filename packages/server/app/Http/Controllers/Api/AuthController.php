<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PersonalAccessToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Redirect to OAuth provider.
     */
    public function redirect(string $provider): JsonResponse
    {
        if (!in_array($provider, ['google', 'github'])) {
            return $this->errorResponse('AUTH_001', 'Invalid provider', 400);
        }

        $url = Socialite::driver($provider)
            ->stateless()
            ->redirect()
            ->getTargetUrl();

        return response()->json([
            'success' => true,
            'data' => [
                'redirect_url' => $url,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => request()->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Handle OAuth callback.
     */
    public function callback(string $provider): JsonResponse
    {
        if (!in_array($provider, ['google', 'github'])) {
            return $this->errorResponse('AUTH_001', 'Invalid provider', 400);
        }

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Exception $e) {
            return $this->errorResponse('AUTH_001', 'Authentication failed: ' . $e->getMessage(), 401);
        }

        // Find or create user
        $user = User::where("{$provider}_id", $socialUser->getId())
            ->orWhere('email', $socialUser->getEmail())
            ->first();

        if ($user) {
            // Update provider ID if not set
            if (empty($user->{"{$provider}_id"})) {
                $user->update(["{$provider}_id" => $socialUser->getId()]);
            }
            // Update avatar if changed
            if ($user->avatar_url !== $socialUser->getAvatar()) {
                $user->update(['avatar_url' => $socialUser->getAvatar()]);
            }
        } else {
            $user = User::create([
                'email' => $socialUser->getEmail(),
                'name' => $socialUser->getName(),
                'avatar_url' => $socialUser->getAvatar(),
                "{$provider}_id" => $socialUser->getId(),
                'email_verified_at' => now(),
            ]);
        }

        // Create API token
        $tokenResult = PersonalAccessToken::createForUser(
            $user->id,
            'API Access Token',
            ['*'],
            30 // 30 days
        );

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->formatUser($user),
                'token' => $tokenResult['plainTextToken'],
                'expires_at' => $tokenResult['model']->expires_at,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => request()->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Get current user info.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->formatUser($request->user()),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Logout user.
     */
    public function logout(Request $request): JsonResponse
    {
        // Revoke current token
        if ($request->user()->currentAccessToken()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'data' => null,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Create a new personal access token.
     */
    public function createToken(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'abilities' => 'array',
            'expires_in_days' => 'nullable|integer|min:1|max:365',
        ]);

        $tokenResult = PersonalAccessToken::createForUser(
            $request->user()->id,
            $validated['name'],
            $validated['abilities'] ?? ['*'],
            $validated['expires_in_days'] ?? null
        );

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $tokenResult['plainTextToken'],
                'name' => $validated['name'],
                'abilities' => $tokenResult['model']->abilities,
                'expires_at' => $tokenResult['model']->expires_at,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Revoke a personal access token.
     */
    public function revokeToken(Request $request, string $id): JsonResponse
    {
        $token = PersonalAccessToken::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$token) {
            return $this->errorResponse('AUTH_001', 'Token not found', 404);
        }

        $token->revoke();

        return response()->json([
            'success' => true,
            'data' => null,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * List user's tokens.
     */
    public function listTokens(Request $request): JsonResponse
    {
        $tokens = PersonalAccessToken::forUser($request->user()->id)
            ->get()
            ->map(fn ($token) => [
                'id' => $token->id,
                'name' => $token->name,
                'abilities' => $token->abilities,
                'last_used_at' => $token->last_used_at,
                'expires_at' => $token->expires_at,
                'is_active' => $token->is_active,
                'created_at' => $token->created_at,
            ]);

        return response()->json([
            'success' => true,
            'data' => $tokens,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Helper: Format user data.
     */
    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'avatar_url' => $user->avatar_url,
            'email_verified_at' => $user->email_verified_at,
            'created_at' => $user->created_at,
        ];
    }

    /**
     * Helper: Error response.
     */
    private function errorResponse(string $code, string $message, int $status): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => request()->header('X-Request-ID', uniqid()),
            ],
        ], $status);
    }
}
