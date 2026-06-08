<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MagicLink;
use App\Models\User;
use App\Models\PersonalAccessToken;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    /** Redirect to OAuth provider. */
    #[OA\Get(
        path: '/api/auth/{provider}/redirect',
        summary: 'Redirect to OAuth provider',
        tags: ['Auth'],
        parameters: [
            new OA\Parameter(
                name: 'provider',
                in: 'path',
                required: true,
                description: 'OAuth provider',
                schema: new OA\Schema(type: 'string', enum: ['google', 'github']),
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Redirect URL',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'redirect_url', type: 'string', example: 'https://accounts.google.com/o/oauth2/auth?...'),
                            ],
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 422, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
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

    /** Handle OAuth callback. */
    #[OA\Get(
        path: '/api/auth/{provider}/callback',
        summary: 'Handle OAuth callback',
        tags: ['Auth'],
        parameters: [
            new OA\Parameter(
                name: 'provider',
                in: 'path',
                required: true,
                description: 'OAuth provider',
                schema: new OA\Schema(type: 'string', enum: ['google', 'github']),
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Authentication successful',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'user', ref: '#/components/schemas/User'),
                                new OA\Property(property: 'token', type: 'string'),
                                new OA\Property(property: 'expires_at', type: 'string', format: 'date-time'),
                            ],
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 401, description: 'Authentication failed', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
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

    /** Get current user info. */
    #[OA\Get(
        path: '/api/auth/me',
        summary: 'Get current user',
        security: [['bearerAuth' => []]],
        tags: ['Auth'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Current user data',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'user', ref: '#/components/schemas/User'),
                            ],
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 401, description: 'Unauthorized', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
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

    /** Logout user. */
    #[OA\Post(
        path: '/api/auth/logout',
        summary: 'Logout current user',
        security: [['bearerAuth' => []]],
        tags: ['Auth'],
        responses: [
            new OA\Response(response: 200, description: 'Successfully logged out', content: new OA\JsonContent(ref: '#/components/schemas/DeletedResponse')),
            new OA\Response(response: 401, description: 'Unauthorized', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function logout(Request $request): JsonResponse
    {
        // Revoke current token. currentAccessToken() returns a TransientToken
        // (no delete()) for session-cookie / actingAs auth, so only delete a
        // real persisted PersonalAccessToken to avoid a 500.
        $currentToken = $request->user()->currentAccessToken();
        if ($currentToken instanceof \Laravel\Sanctum\PersonalAccessToken) {
            $currentToken->delete();
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

    /** Create a new personal access token. */
    #[OA\Post(
        path: '/api/auth/tokens',
        summary: 'Create personal access token',
        security: [['bearerAuth' => []]],
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'My Token'),
                    new OA\Property(property: 'abilities', type: 'array', items: new OA\Items(type: 'string'), example: ['*']),
                    new OA\Property(property: 'expires_in_days', type: 'integer', example: 30),
                ],
            ),
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Token created',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'token', type: 'string'),
                                new OA\Property(property: 'name', type: 'string'),
                                new OA\Property(property: 'abilities', type: 'array', items: new OA\Items(type: 'string')),
                                new OA\Property(property: 'expires_at', type: 'string', format: 'date-time'),
                            ],
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 401, description: 'Unauthorized', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 422, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
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

    /** Revoke a personal access token. */
    #[OA\Delete(
        path: '/api/auth/tokens/{id}',
        summary: 'Revoke a personal access token',
        security: [['bearerAuth' => []]],
        tags: ['Auth'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'Token ID',
                schema: new OA\Schema(type: 'string'),
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Token revoked', content: new OA\JsonContent(ref: '#/components/schemas/DeletedResponse')),
            new OA\Response(response: 401, description: 'Unauthorized', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 404, description: 'Token not found', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
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

    /** List user's tokens. */
    #[OA\Get(
        path: '/api/auth/tokens',
        summary: 'List personal access tokens',
        security: [['bearerAuth' => []]],
        tags: ['Auth'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of tokens',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(
                                type: 'object',
                                properties: [
                                    new OA\Property(property: 'id', type: 'string'),
                                    new OA\Property(property: 'name', type: 'string'),
                                    new OA\Property(property: 'abilities', type: 'array', items: new OA\Items(type: 'string')),
                                    new OA\Property(property: 'last_used_at', type: 'string', format: 'date-time', nullable: true),
                                    new OA\Property(property: 'expires_at', type: 'string', format: 'date-time', nullable: true),
                                    new OA\Property(property: 'is_active', type: 'boolean'),
                                    new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
                                ],
                            ),
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 401, description: 'Unauthorized', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
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
     * Update current user profile (name, email).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $request->user()->id,
        ]);

        $request->user()->update($validated);

        return response()->json([
            'success' => true,
            'data' => ['user' => $this->formatUser($request->user()->fresh())],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Upload and update user avatar.
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|max:2048',
        ]);

        $user = $request->user();

        // Delete old local avatar
        if ($user->avatar_url && str_contains($user->avatar_url, '/storage/avatars/')) {
            $oldPath = 'avatars/' . basename($user->avatar_url);
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $url = config('app.url') . '/storage/' . $path;

        $user->update(['avatar_url' => $url]);

        return response()->json([
            'success' => true,
            'data' => ['user' => $this->formatUser($user->fresh())],
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

    /** Login user with email and password. */
    #[OA\Post(
        path: '/api/auth/login',
        summary: 'Login with email and password',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/LoginRequest'),
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Login successful',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'user', ref: '#/components/schemas/User'),
                                new OA\Property(property: 'token', type: 'string'),
                                new OA\Property(property: 'expires_at', type: 'string', format: 'date-time'),
                            ],
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 401, description: 'Invalid credentials', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 422, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
            'remember' => 'boolean',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !$user->password) {
            return $this->errorResponse('AUTH_002', 'Invalid credentials', 401);
        }

        if (!Hash::check($validated['password'], $user->password)) {
            return $this->errorResponse('AUTH_002', 'Invalid credentials', 401);
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
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Register a new user. */
    #[OA\Post(
        path: '/api/auth/register',
        summary: 'Register new user',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/RegisterRequest'),
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'User registered successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'user', ref: '#/components/schemas/User'),
                                new OA\Property(property: 'token', type: 'string'),
                                new OA\Property(property: 'expires_at', type: 'string', format: 'date-time'),
                            ],
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 422, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        event(new Registered($user));

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
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /** Send password reset link. */
    #[OA\Post(
        path: '/api/auth/forgot-password',
        summary: 'Send password reset link',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'user@example.com'),
                ],
            ),
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Reset link sent',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'message', type: 'string', example: 'Password reset link sent to your email.'),
                            ],
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 422, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
        ]);

        $status = Password::sendResetLink($validated);

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'success' => true,
                'data' => [
                    'message' => 'Password reset link sent to your email.',
                ],
                'meta' => [
                    'timestamp' => now()->toIso8601String(),
                    'request_id' => $request->header('X-Request-ID', uniqid()),
                ],
            ]);
        }

        return $this->errorResponse('AUTH_003', 'Unable to send reset link', 400);
    }

    /** Reset password with token. */
    #[OA\Post(
        path: '/api/auth/reset-password',
        summary: 'Reset password',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['token', 'email', 'password', 'password_confirmation'],
                properties: [
                    new OA\Property(property: 'token', type: 'string'),
                    new OA\Property(property: 'email', type: 'string', format: 'email'),
                    new OA\Property(property: 'password', type: 'string', format: 'password'),
                    new OA\Property(property: 'password_confirmation', type: 'string', format: 'password'),
                ],
            ),
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Password reset successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'message', type: 'string', example: 'Password has been reset successfully.'),
                            ],
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 422, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'email' => 'required|string|email',
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $status = Password::reset(
            $validated,
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'success' => true,
                'data' => [
                    'message' => 'Password has been reset successfully.',
                ],
                'meta' => [
                    'timestamp' => now()->toIso8601String(),
                    'request_id' => $request->header('X-Request-ID', uniqid()),
                ],
            ]);
        }

        return $this->errorResponse('AUTH_004', 'Invalid or expired reset token', 400);
    }

    /** Refresh the current token. */
    #[OA\Post(
        path: '/api/auth/refresh',
        summary: 'Refresh current token',
        security: [['bearerAuth' => []]],
        tags: ['Auth'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Token refreshed',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'token', type: 'string'),
                                new OA\Property(property: 'expires_at', type: 'string', format: 'date-time'),
                            ],
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 401, description: 'Unauthorized', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();

        // Revoke current token. currentAccessToken() returns a TransientToken
        // (no delete()) for session-cookie / actingAs auth, so only delete a
        // real persisted PersonalAccessToken to avoid a 500.
        $currentToken = $request->user()->currentAccessToken();
        if ($currentToken instanceof \Laravel\Sanctum\PersonalAccessToken) {
            $currentToken->delete();
        }

        // Create new token
        $tokenResult = PersonalAccessToken::createForUser(
            $user->id,
            'API Access Token',
            ['*'],
            30 // 30 days
        );

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $tokenResult['plainTextToken'],
                'expires_at' => $tokenResult['model']->expires_at,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Send a magic link to the given email address. */
    #[OA\Post(
        path: '/api/auth/magic-link',
        summary: 'Send magic link',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'user@example.com'),
                ],
            ),
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Magic link sent (or silently ignored if email not found)',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'message', type: 'string'),
                            ],
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 422, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function magicLink(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = $request->input('email');

        // Check if user exists
        $user = User::where('email', $email)->first();
        if (!$user) {
            // Don't reveal if email exists - always return success
            return response()->json([
                'success' => true,
                'data' => ['message' => 'If an account exists with this email, a magic link has been sent.'],
                'meta' => [
                    'timestamp' => now()->toIso8601String(),
                    'request_id' => $request->header('X-Request-ID', uniqid()),
                ],
            ]);
        }

        // Expire existing links for this email
        MagicLink::where('email', $email)->whereNull('used_at')->update(['used_at' => now()]);

        // Create new magic link
        $token = Str::random(64);
        $magicLink = MagicLink::create([
            'email' => $email,
            'token' => $token,
            'expires_at' => now()->addMinutes(MagicLink::EXPIRATION_MINUTES),
        ]);

        // Send email
        $loginUrl = config('app.url') . '/auth/magic-login?token=' . $token;

        try {
            Mail::raw(
                "Click this link to log in to ClaudeNest:\n\n{$loginUrl}\n\nThis link expires in " . MagicLink::EXPIRATION_MINUTES . " minutes.",
                function ($message) use ($email) {
                    $message->to($email)
                        ->subject('ClaudeNest - Magic Login Link');
                }
            );
        } catch (\Exception $e) {
            // Mail not configured - log but don't fail
            Log::warning('Magic link email failed: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => ['message' => 'If an account exists with this email, a magic link has been sent.'],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Verify a magic link token and authenticate the user. */
    #[OA\Post(
        path: '/api/auth/magic-link/verify',
        summary: 'Verify magic link',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['token'],
                properties: [
                    new OA\Property(property: 'token', type: 'string', example: 'abc123...'),
                ],
            ),
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Authentication successful',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'user', ref: '#/components/schemas/User'),
                                new OA\Property(property: 'token', type: 'string'),
                                new OA\Property(property: 'expires_at', type: 'string', format: 'date-time'),
                            ],
                        ),
                    ],
                ),
            ),
            new OA\Response(response: 401, description: 'Invalid or expired magic link', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 422, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ],
    )]
    public function magicLinkVerify(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string|size:64',
        ]);

        $magicLink = MagicLink::where('token', $request->input('token'))
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if (!$magicLink) {
            return $this->errorResponse('AUTH_005', 'Invalid or expired magic link.', 401);
        }

        // Mark as used
        $magicLink->markAsUsed();

        // Find user and create token
        $user = User::where('email', $magicLink->email)->first();

        if (!$user) {
            return $this->errorResponse('AUTH_006', 'User not found.', 404);
        }

        // Mark email as verified since they proved ownership
        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        // Create API token
        $tokenResult = PersonalAccessToken::createForUser(
            $user->id,
            'magic-link-' . now()->timestamp,
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
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

}
