<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCredentialRequest;
use App\Http\Requests\UpdateCredentialRequest;
use App\Http\Resources\CredentialResource;
use App\Models\ClaudeCredential;
use App\Models\Machine;
use App\Services\AgentGateway;
use App\Services\CredentialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

class CredentialController extends Controller
{
    public function __construct(
        private CredentialService $credentialService
    ) {}

    /** List user credentials. */
    #[OA\Get(
        path: '/api/credentials',
        summary: 'List user credentials',
        security: [['bearerAuth' => []]],
        tags: ['Credentials'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated list of credentials',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/ClaudeCredential')),
                    ]
                )
            ),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $credentials = $request->user()
            ->credentials()
            ->withCount('sessions')
            ->orderBy('created_at')
            ->get();

        // Auto-refresh expired OAuth credentials silently
        $refreshed = [];
        foreach ($credentials as $credential) {
            try {
                if ($credential->ensureFresh()) {
                    $refreshed[] = $credential->id;
                }
            } catch (\Throwable) {
                // Refresh failed — credential will show as expired
            }
        }

        return response()->json([
            'success' => true,
            'data' => CredentialResource::collection($credentials),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
                'auto_refreshed' => $refreshed,
            ],
        ]);
    }

    /** Create credential. */
    #[OA\Post(
        path: '/api/credentials',
        summary: 'Create credential',
        security: [['bearerAuth' => []]],
        tags: ['Credentials'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/StoreCredentialRequest')
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Credential created',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', ref: '#/components/schemas/ClaudeCredential'),
                    ]
                )
            ),
            new OA\Response(
                response: 409,
                description: 'Duplicate credential name',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: false),
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'code', type: 'string', example: 'DUPLICATE_NAME'),
                                new OA\Property(property: 'message', type: 'string'),
                            ]
                        ),
                    ]
                )
            ),
        ]
    )]
    public function store(StoreCredentialRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        try {
            $credential = DB::transaction(function () use ($data, $user) {
                if ($user->credentials()->where('name', $data['name'])->lockForUpdate()->exists()) {
                    throw new \RuntimeException('DUPLICATE_NAME');
                }

                $credential = new ClaudeCredential([
                    'user_id' => $user->id,
                    'name' => $data['name'],
                    'auth_type' => $data['auth_type'],
                    'claude_dir_mode' => $data['claude_dir_mode'] ?? 'shared',
                ]);

                if (!empty($data['api_key'])) {
                    $credential->api_key_enc = Crypt::encryptString($data['api_key']);
                    $credential->key_hint = 'sk-ant-...' . substr($data['api_key'], -6);
                }
                if (!empty($data['access_token'])) {
                    $credential->access_token_enc = Crypt::encryptString($data['access_token']);
                    if ($credential->auth_type === 'oauth') {
                        $credential->key_hint = 'oat01-...' . substr($data['access_token'], -6);
                    }
                }
                if (!empty($data['refresh_token'])) {
                    $credential->refresh_token_enc = Crypt::encryptString($data['refresh_token']);
                }
                if (!empty($data['expires_at'])) {
                    $credential->expires_at = \Carbon\Carbon::createFromTimestampMs($data['expires_at']);
                }

                if ($user->credentials()->count() === 0) {
                    $credential->is_default = true;
                }

                $credential->save();
                return $credential;
            });
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'DUPLICATE_NAME') {
                return $this->errorResponse('DUPLICATE_NAME', "Credential '{$data['name']}' already exists", 409);
            }
            throw $e;
        }

        return response()->json([
            'success' => true,
            'data' => new CredentialResource($credential),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /** Get credential details. */
    #[OA\Get(
        path: '/api/credentials/{id}',
        summary: 'Get credential details',
        security: [['bearerAuth' => []]],
        tags: ['Credentials'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Credential UUID', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Credential details',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', ref: '#/components/schemas/ClaudeCredential'),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Credential not found'),
        ]
    )]
    public function show(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);

        // Auto-refresh if expired
        $wasRefreshed = false;
        try {
            $wasRefreshed = $credential->ensureFresh();
        } catch (\Throwable) {
            // Refresh failed — show as expired
        }

        return response()->json([
            'success' => true,
            'data' => new CredentialResource($credential->loadCount('sessions')),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
                'auto_refreshed' => $wasRefreshed,
            ],
        ]);
    }

    /** Update credential. */
    #[OA\Put(
        path: '/api/credentials/{id}',
        summary: 'Update credential',
        security: [['bearerAuth' => []]],
        tags: ['Credentials'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Credential UUID', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/UpdateCredentialRequest')
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Credential updated',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', ref: '#/components/schemas/ClaudeCredential'),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Credential not found'),
        ]
    )]
    public function update(UpdateCredentialRequest $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);
        $data = $request->validated();

        if (isset($data['name'])) $credential->name = $data['name'];
        if (isset($data['auth_type'])) $credential->auth_type = $data['auth_type'];
        if (isset($data['claude_dir_mode'])) $credential->claude_dir_mode = $data['claude_dir_mode'];

        if (!empty($data['api_key'])) {
            $credential->api_key_enc = Crypt::encryptString($data['api_key']);
            $credential->key_hint = 'sk-ant-...' . substr($data['api_key'], -6);
        }
        if (!empty($data['access_token'])) {
            $credential->access_token_enc = Crypt::encryptString($data['access_token']);
            if ($credential->auth_type === 'oauth') {
                $credential->key_hint = 'oat01-...' . substr($data['access_token'], -6);
            }
        }
        if (!empty($data['refresh_token'])) {
            $credential->refresh_token_enc = Crypt::encryptString($data['refresh_token']);
        }
        if (isset($data['expires_at'])) {
            $credential->expires_at = $data['expires_at']
                ? \Carbon\Carbon::createFromTimestampMs($data['expires_at'])
                : null;
        }

        $credential->save();

        return response()->json([
            'success' => true,
            'data' => new CredentialResource($credential),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Delete credential. */
    #[OA\Delete(
        path: '/api/credentials/{id}',
        summary: 'Delete credential',
        security: [['bearerAuth' => []]],
        tags: ['Credentials'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Credential UUID', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Credential deleted',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'deleted', type: 'boolean', example: true),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Credential not found'),
        ]
    )]
    public function destroy(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);
        $wasDefault = $credential->is_default;
        $userId = $credential->user_id;

        $credential->delete();

        if ($wasDefault) {
            $next = ClaudeCredential::where('user_id', $userId)->orderBy('created_at')->first();
            $next?->update(['is_default' => true]);
        }

        return response()->json([
            'success' => true,
            'data' => ['deleted' => true],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /** Validate/test API key. */
    #[OA\Post(
        path: '/api/credentials/{id}/test',
        summary: 'Validate/test API key',
        security: [['bearerAuth' => []]],
        tags: ['Credentials'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Credential UUID', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Test result',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'valid', type: 'boolean'),
                                new OA\Property(property: 'message', type: 'string'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 400,
                description: 'Test failed',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: false),
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'code', type: 'string', example: 'TEST_FAILED'),
                                new OA\Property(property: 'message', type: 'string'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Credential not found'),
        ]
    )]
    public function test(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);

        try {
            $result = $this->credentialService->testCredential($credential);
            return response()->json([
                'success' => true,
                'data' => $result,
                'meta' => ['timestamp' => now()->toIso8601String()],
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('TEST_FAILED', $e->getMessage(), 400);
        }
    }

    /** Refresh OAuth token. */
    #[OA\Post(
        path: '/api/credentials/{id}/refresh',
        summary: 'Refresh OAuth token',
        security: [['bearerAuth' => []]],
        tags: ['Credentials'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Credential UUID', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Token refreshed successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', type: 'object'),
                    ]
                )
            ),
            new OA\Response(
                response: 400,
                description: 'Refresh failed',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: false),
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'code', type: 'string', example: 'REFRESH_FAILED'),
                                new OA\Property(property: 'message', type: 'string'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Credential not found'),
        ]
    )]
    public function refresh(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);

        try {
            $result = $this->credentialService->refreshOAuthToken($credential);
            return response()->json([
                'success' => true,
                'data' => $result,
                'meta' => ['timestamp' => now()->toIso8601String()],
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse('NOT_OAUTH', $e->getMessage(), 422);
        } catch (\Exception $e) {
            $code = str_contains($e->getMessage(), 'expired or revoked') ? 'TOKEN_EXPIRED' : 'REFRESH_FAILED';
            return $this->errorResponse($code, $e->getMessage(), 400);
        }
    }

    /** Capture OAuth flow from credentials file. */
    #[OA\Post(
        path: '/api/credentials/{id}/capture',
        summary: 'Capture OAuth flow from credentials file',
        security: [['bearerAuth' => []]],
        tags: ['Credentials'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Credential UUID', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'credentials_path', type: 'string', description: 'Path to the Claude credentials file', example: '/home/user/.claude/.credentials.json'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Credentials captured successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', type: 'object'),
                    ]
                )
            ),
            new OA\Response(
                response: 400,
                description: 'Capture failed',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: false),
                        new OA\Property(
                            property: 'error',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'code', type: 'string', example: 'CAPTURE_FAILED'),
                                new OA\Property(property: 'message', type: 'string'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Credential not found'),
        ]
    )]
    public function capture(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);

        try {
            $params = $request->only(['access_token', 'refresh_token', 'expires_at', 'credentials_json']);
            $result = $this->credentialService->captureOAuthTokens($credential, $params);
            return response()->json([
                'success' => true,
                'data' => $result,
                'meta' => ['timestamp' => now()->toIso8601String()],
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('CAPTURE_FAILED', $e->getMessage(), 400);
        }
    }

    /** Set credential as default. */
    #[OA\Post(
        path: '/api/credentials/{id}/set-default',
        summary: 'Set credential as default',
        security: [['bearerAuth' => []]],
        tags: ['Credentials'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Credential UUID', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Default credential updated',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', ref: '#/components/schemas/ClaudeCredential'),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Credential not found'),
        ]
    )]
    public function setDefault(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);
        $credential->setAsDefault();

        return response()->json([
            'success' => true,
            'data' => new CredentialResource($credential->fresh()),
            'meta' => ['timestamp' => now()->toIso8601String()],
        ]);
    }

    /**
     * Initiate OAuth flow via Agent Relay.
     *
     * Instead of generating the auth URL server-side (which fails because the
     * CLI client_id only accepts localhost redirects), we delegate to the agent
     * running on the user's machine. The agent starts a temporary HTTP server,
     * generates PKCE, and sends the auth URL back via WebSocket.
     */
    public function initiateOAuth(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);

        if ($credential->auth_type !== 'oauth') {
            return $this->errorResponse('NOT_OAUTH', 'This credential does not use OAuth', 422);
        }

        $request->validate([
            'machine_id' => 'required|uuid',
        ]);

        $machineId = $request->input('machine_id');

        // Verify machine belongs to user and is online
        $machine = Machine::where('id', $machineId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$machine) {
            return $this->errorResponse('MACHINE_NOT_FOUND', 'Machine not found', 404);
        }

        if ($machine->status !== 'online') {
            return $this->errorResponse('MACHINE_OFFLINE', 'The selected machine is not connected. Start the ClaudeNest agent first.', 422);
        }

        // Clear any stale relay state
        Cache::forget("oauth_relay_{$id}");

        // Send oauth:start to the agent via Redis queue
        AgentGateway::send($machineId, 'oauth:start', [
            'credentialId' => $id,
            'clientId' => '9d1c250a-e61b-44d9-88ed-5944d1962f5e',
        ]);

        return response()->json([
            'success' => true,
            'data' => ['request_id' => $id],
            'meta' => ['timestamp' => now()->toIso8601String()],
        ], 202);
    }

    /**
     * Poll OAuth relay status.
     *
     * The frontend calls this repeatedly to check:
     * 1. 'waiting' — agent hasn't responded yet
     * 2. 'auth_url_ready' — agent sent the auth URL, open the popup
     * 3. 'complete' — tokens captured, flow done
     * 4. 'error' — something went wrong
     */
    public function oauthPoll(Request $request, string $id): JsonResponse
    {
        $request->user()->credentials()->findOrFail($id);

        $data = Cache::get("oauth_relay_{$id}");

        if (!$data) {
            return response()->json([
                'success' => true,
                'data' => ['status' => 'waiting'],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => ['timestamp' => now()->toIso8601String()],
        ]);
    }

    /**
     * Legacy OAuth callback — kept for backward compatibility but no longer
     * the primary flow. The Agent-Relay pattern handles OAuth directly.
     */
    public function oauthCallback(Request $request): RedirectResponse
    {
        $state = $request->query('state');
        $code = $request->query('code');
        $error = $request->query('error');

        $completePage = config('app.url') . '/oauth-complete';
        $pkceData = $state ? Cache::pull("oauth_pkce_{$state}") : null;

        if (!$pkceData) {
            return redirect($completePage . '?error=' . urlencode('Invalid or expired state. Please try again.'));
        }

        if ($error) {
            return redirect($completePage . '?error=' . urlencode($error));
        }

        if (!$code) {
            return redirect($completePage . '?error=' . urlencode('No authorization code received.'));
        }

        try {
            $response = Http::asForm()->post('https://platform.claude.com/v1/oauth/token', [
                'grant_type' => 'authorization_code',
                'client_id' => '9d1c250a-e61b-44d9-88ed-5944d1962f5e',
                'code' => $code,
                'redirect_uri' => config('app.url') . '/api/oauth/callback',
                'code_verifier' => $pkceData['code_verifier'],
            ]);

            if (!$response->successful()) {
                $body = $response->json();
                $msg = $body['error_description'] ?? $body['error'] ?? 'Token exchange failed';
                return redirect($completePage . '?error=' . urlencode($msg));
            }

            $tokens = $response->json();

            $credential = ClaudeCredential::find($pkceData['credential_id']);
            if (!$credential) {
                return redirect($completePage . '?error=' . urlencode('Credential not found.'));
            }

            $accessToken = $tokens['access_token'];
            $credential->access_token_enc = Crypt::encryptString($accessToken);
            $credential->key_hint = 'oat01-...' . substr($accessToken, -6);

            if (!empty($tokens['refresh_token'])) {
                $credential->refresh_token_enc = Crypt::encryptString($tokens['refresh_token']);
            }

            if (!empty($tokens['expires_in'])) {
                $credential->expires_at = now()->addSeconds((int) $tokens['expires_in']);
            } elseif (!empty($tokens['expires_at'])) {
                $credential->expires_at = \Carbon\Carbon::createFromTimestampMs($tokens['expires_at']);
            }

            $credential->save();

            return redirect($completePage . '?success=' . urlencode($pkceData['credential_id']));
        } catch (\Exception $e) {
            Log::error('OAuth callback error', ['message' => $e->getMessage()]);
            return redirect($completePage . '?error=' . urlencode('Connection error. Please try again.'));
        }
    }

    /**
     * Capture credentials from a machine's ~/.claude/.credentials.json.
     *
     * Sends a file:read_credentials request to the agent and waits for
     * the response. The agent reads the file and returns its content.
     */
    public function captureFromMachine(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);

        $request->validate([
            'machine_id' => 'required|uuid',
        ]);

        $machineId = $request->input('machine_id');

        $machine = Machine::where('id', $machineId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$machine) {
            return $this->errorResponse('MACHINE_NOT_FOUND', 'Machine not found', 404);
        }

        if ($machine->status !== 'online') {
            return $this->errorResponse('MACHINE_OFFLINE', 'Machine is not connected', 422);
        }

        // Send request to agent and wait for response (up to 10s)
        $response = AgentGateway::sendAndWait(
            $machineId,
            'file:read_credentials',
            [],
            10
        );

        if (!$response) {
            return $this->errorResponse('TIMEOUT', 'Agent did not respond in time', 504);
        }

        if (empty($response['success'])) {
            $error = $response['error'] ?? 'Failed to read credentials file';
            return $this->errorResponse('READ_FAILED', $error, 400);
        }

        $credentialsJson = $response['credentialsJson'] ?? null;
        if (!$credentialsJson) {
            return $this->errorResponse('EMPTY_RESPONSE', 'No credentials data received', 400);
        }

        try {
            $result = $this->credentialService->captureOAuthTokens($credential, [
                'credentials_json' => $credentialsJson,
            ]);

            return response()->json([
                'success' => true,
                'data' => $result,
                'meta' => ['timestamp' => now()->toIso8601String()],
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('CAPTURE_FAILED', $e->getMessage(), 400);
        }
    }

}
