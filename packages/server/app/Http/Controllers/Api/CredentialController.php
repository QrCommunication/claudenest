<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCredentialRequest;
use App\Http\Requests\UpdateCredentialRequest;
use App\Http\Resources\CredentialResource;
use App\Models\ClaudeCredential;
use App\Services\CredentialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class CredentialController extends Controller
{
    public function __construct(
        private CredentialService $credentialService
    ) {}

    /**
     * @OA\Get(
     *     path="/api/credentials",
     *     tags={"Credentials"},
     *     summary="List user credentials",
     *     security={{"bearerAuth": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Paginated list of credentials",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/ClaudeCredential")
     *             )
     *         )
     *     )
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $credentials = $request->user()
            ->credentials()
            ->withCount('sessions')
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => CredentialResource::collection($credentials),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/credentials",
     *     tags={"Credentials"},
     *     summary="Create credential",
     *     security={{"bearerAuth": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/StoreCredentialRequest")
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Credential created",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/ClaudeCredential")
     *         )
     *     ),
     *     @OA\Response(
     *         response=409,
     *         description="Duplicate credential name",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="DUPLICATE_NAME"),
     *                 @OA\Property(property="message", type="string")
     *             )
     *         )
     *     )
     * )
     */
    public function store(StoreCredentialRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        if ($user->credentials()->where('name', $data['name'])->exists()) {
            return $this->errorResponse('DUPLICATE_NAME', "Credential '{$data['name']}' already exists", 409);
        }

        $credential = new ClaudeCredential([
            'id' => (string) Str::orderedUuid(),
            'user_id' => $user->id,
            'name' => $data['name'],
            'auth_type' => $data['auth_type'],
            'claude_dir_mode' => $data['claude_dir_mode'] ?? 'shared',
        ]);

        if (!empty($data['api_key'])) {
            $credential->api_key_enc = Crypt::encryptString($data['api_key']);
        }
        if (!empty($data['access_token'])) {
            $credential->access_token_enc = Crypt::encryptString($data['access_token']);
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

        return response()->json([
            'success' => true,
            'data' => new CredentialResource($credential),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * @OA\Get(
     *     path="/api/credentials/{id}",
     *     tags={"Credentials"},
     *     summary="Get credential details",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Credential UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Credential details",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/ClaudeCredential")
     *         )
     *     ),
     *     @OA\Response(response=404, description="Credential not found")
     * )
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new CredentialResource($credential->loadCount('sessions')),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * @OA\Put(
     *     path="/api/credentials/{id}",
     *     tags={"Credentials"},
     *     summary="Update credential",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Credential UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/UpdateCredentialRequest")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Credential updated",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/ClaudeCredential")
     *         )
     *     ),
     *     @OA\Response(response=404, description="Credential not found")
     * )
     */
    public function update(UpdateCredentialRequest $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);
        $data = $request->validated();

        if (isset($data['name'])) $credential->name = $data['name'];
        if (isset($data['auth_type'])) $credential->auth_type = $data['auth_type'];
        if (isset($data['claude_dir_mode'])) $credential->claude_dir_mode = $data['claude_dir_mode'];

        if (!empty($data['api_key'])) {
            $credential->api_key_enc = Crypt::encryptString($data['api_key']);
        }
        if (!empty($data['access_token'])) {
            $credential->access_token_enc = Crypt::encryptString($data['access_token']);
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

    /**
     * @OA\Delete(
     *     path="/api/credentials/{id}",
     *     tags={"Credentials"},
     *     summary="Delete credential",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Credential UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Credential deleted",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="deleted", type="boolean", example=true)
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, description="Credential not found")
     * )
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);
        $credential->delete();

        return response()->json([
            'success' => true,
            'data' => ['deleted' => true],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/credentials/{id}/test",
     *     tags={"Credentials"},
     *     summary="Validate/test API key",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Credential UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Test result",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="valid", type="boolean"),
     *                 @OA\Property(property="message", type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Test failed",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="TEST_FAILED"),
     *                 @OA\Property(property="message", type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, description="Credential not found")
     * )
     */
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

    /**
     * @OA\Post(
     *     path="/api/credentials/{id}/refresh",
     *     tags={"Credentials"},
     *     summary="Refresh OAuth token",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Credential UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Token refreshed successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Refresh failed",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="REFRESH_FAILED"),
     *                 @OA\Property(property="message", type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, description="Credential not found")
     * )
     */
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
        } catch (\Exception $e) {
            return $this->errorResponse('REFRESH_FAILED', $e->getMessage(), 400);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/credentials/{id}/capture",
     *     tags={"Credentials"},
     *     summary="Capture OAuth flow from credentials file",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Credential UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(
     *                 property="credentials_path",
     *                 type="string",
     *                 description="Path to the Claude credentials file",
     *                 example="/home/user/.claude/.credentials.json"
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Credentials captured successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Capture failed",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(
     *                 property="error",
     *                 type="object",
     *                 @OA\Property(property="code", type="string", example="CAPTURE_FAILED"),
     *                 @OA\Property(property="message", type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, description="Credential not found")
     * )
     */
    public function capture(Request $request, string $id): JsonResponse
    {
        $credential = $request->user()->credentials()->findOrFail($id);
        $path = $request->input('credentials_path');

        try {
            $result = $this->credentialService->captureFromCredentialsFile($credential, $path);
            return response()->json([
                'success' => true,
                'data' => $result,
                'meta' => ['timestamp' => now()->toIso8601String()],
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('CAPTURE_FAILED', $e->getMessage(), 400);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/credentials/{id}/set-default",
     *     tags={"Credentials"},
     *     summary="Set credential as default",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Credential UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Default credential updated",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/ClaudeCredential")
     *         )
     *     ),
     *     @OA\Response(response=404, description="Credential not found")
     * )
     */
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

    private function errorResponse(string $code, string $message, int $status): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => ['code' => $code, 'message' => $message],
            'meta' => ['timestamp' => now()->toIso8601String()],
        ], $status);
    }
}
