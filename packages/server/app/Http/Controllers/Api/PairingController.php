<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CompletePairingRequest;
use App\Http\Requests\InitiatePairingRequest;
use App\Http\Resources\MachineResource;
use App\Models\PairingCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

/**
 * PairingController handles the 3-step agent-to-dashboard pairing flow:
 *
 * 1. initiate  — Agent CLI generates a code locally and registers it here (public).
 * 2. poll      — Agent polls until the user completes pairing from the dashboard (public).
 * 3. complete  — Dashboard user enters the code, creating a Machine + token (authenticated).
 *
 * Security notes:
 * - initiate & poll are public but rate-limited (throttle:10,1 in routes/api.php).
 * - complete requires auth:sanctum.
 * - The plain-text machine token is stored in `pairing_codes.machine_token` only after
 *   completion and is returned to the agent exactly once via poll. It is hashed in the
 *   `machines.token_hash` column for all subsequent authentication.
 */
class PairingController extends Controller
{
    /**
     * Initiate a pairing request from the agent.
     *
     * The agent CLI generates a pairing code locally (XXX-XXX format),
     * then calls this endpoint to register it with the server. The code
     * expires after 5 minutes. The agent then polls the `poll` endpoint
     * until the user completes pairing from the dashboard.
     *
     * PUBLIC route — agent is not authenticated yet.
     *
     * @OA\Post(
     *     path="/api/pairing/initiate",
     *     operationId="pairingInitiate",
     *     tags={"Pairing"},
     *     summary="Register a pairing code from the agent CLI (public, rate-limited)",
     *     description="The agent generates a 6-character code locally and sends it here along with its system information. The code is valid for 5 minutes.",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"code", "agent_info"},
     *             @OA\Property(property="code", type="string", example="A3K-9FZ", description="6-char pairing code in XXX-XXX format (uppercase alphanum, no ambiguous chars)"),
     *             @OA\Property(property="agent_info", type="object", required={"platform", "hostname"},
     *                 @OA\Property(property="hostname", type="string", example="rony-desktop", description="System hostname"),
     *                 @OA\Property(property="platform", type="string", enum={"darwin", "win32", "linux"}, example="linux", description="Operating system identifier"),
     *                 @OA\Property(property="arch", type="string", example="x64", description="CPU architecture"),
     *                 @OA\Property(property="node_version", type="string", example="v20.11.0", description="Node.js version running the agent"),
     *                 @OA\Property(property="agent_version", type="string", example="1.1.0", description="@claude-remote/agent version"),
     *                 @OA\Property(property="claude_version", type="string", example="1.0.12", description="Claude Code CLI version"),
     *                 @OA\Property(property="claude_path", type="string", example="/usr/local/bin/claude", description="Absolute path to the claude binary")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Pairing code registered successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="code", type="string", example="A3K-9FZ"),
     *                 @OA\Property(property="expires_at", type="string", format="date-time", example="2026-02-17T14:05:00+00:00"),
     *                 @OA\Property(property="expires_in_seconds", type="integer", example=300)
     *             ),
     *             @OA\Property(property="meta", ref="#/components/schemas/Meta")
     *         )
     *     ),
     *     @OA\Response(
     *         response=409,
     *         description="Pairing code already active",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error (invalid code format or missing agent_info)",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=429,
     *         description="Rate limit exceeded (max 10 requests per minute)",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     *
     * @param  InitiatePairingRequest  $request  Validated request with code + agent_info
     * @return JsonResponse  201 on success, 409 if code already active
     */
    public function initiate(InitiatePairingRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // ── Guard: reject if an active (pending + not expired) code already exists ──
        $existing = PairingCode::where('code', $validated['code'])
            ->active()
            ->first();

        if ($existing) {
            return $this->errorResponse(
                'PAIR_002',
                'This pairing code is already registered. Please generate a new one.',
                409
            );
        }

        // ── Housekeeping: mark old pending codes as expired ──
        // Lightweight cleanup; avoids needing a dedicated scheduled command for
        // low-traffic deployments. High-traffic deployments should also schedule
        // `PairingCode::expireOldCodes()` via `app/Console/Kernel.php`.
        PairingCode::expireOldCodes();

        // ── Create the pairing code record ──
        $expiresAt = now()->addMinutes(PairingCode::EXPIRATION_MINUTES);

        $pairingCode = PairingCode::create([
            'code'       => $validated['code'],
            'status'     => 'pending',
            'agent_info' => $validated['agent_info'],
            'expires_at' => $expiresAt,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'code'               => $pairingCode->code,
                'expires_at'         => $pairingCode->expires_at->toIso8601String(),
                'expires_in_seconds' => PairingCode::EXPIRATION_MINUTES * 60,
            ],
            'meta' => [
                'timestamp'  => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Poll for pairing completion.
     *
     * The agent calls this endpoint every 2-3 seconds to check whether
     * the user has completed the pairing from the dashboard. Responses:
     *
     * - **202 Accepted** — still pending, agent keeps polling.
     * - **200 OK** — completed; response includes the machine token and ID.
     * - **410 Gone** — code expired, agent must generate a new one.
     * - **404 Not Found** — code unknown.
     *
     * PUBLIC route — agent is not authenticated yet.
     *
     * @OA\Get(
     *     path="/api/pairing/{code}",
     *     operationId="pairingPoll",
     *     tags={"Pairing"},
     *     summary="Poll pairing status from the agent CLI (public, rate-limited)",
     *     description="Returns the current pairing status. The agent should poll every 2-3 seconds until it receives 'completed' (200) or 'expired' (410).",
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         description="The 6-char pairing code in XXX-XXX format",
     *         @OA\Schema(type="string", example="A3K-9FZ")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Pairing completed — token and machine ID returned",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="status", type="string", example="completed"),
     *                 @OA\Property(property="token", type="string", example="mn_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6", description="Plain-text machine auth token (store securely, shown only once)"),
     *                 @OA\Property(property="machine_id", type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000")
     *             ),
     *             @OA\Property(property="meta", ref="#/components/schemas/Meta")
     *         )
     *     ),
     *     @OA\Response(
     *         response=202,
     *         description="Pairing still pending — agent should keep polling",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="status", type="string", example="pending"),
     *                 @OA\Property(property="expires_at", type="string", format="date-time", example="2026-02-17T14:05:00+00:00"),
     *                 @OA\Property(property="seconds_remaining", type="integer", example=187)
     *             ),
     *             @OA\Property(property="meta", ref="#/components/schemas/Meta")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Pairing code not found",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=410,
     *         description="Pairing code expired",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=429,
     *         description="Rate limit exceeded",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     *
     * @param  string  $code  The XXX-XXX pairing code from the URL segment
     * @return JsonResponse  200 if completed, 202 if pending, 404/410 on error
     */
    public function poll(string $code): JsonResponse
    {
        $pairingCode = PairingCode::where('code', $code)->first();

        // ── 404: unknown code ──
        if (!$pairingCode) {
            return $this->errorResponse(
                'PAIR_001',
                'Pairing code not found.',
                404
            );
        }

        // ── 200: pairing completed — return the machine token ──
        // The token is stored in plain text in pairing_codes.machine_token
        // (hidden by default on the model). The agent stores it in the OS
        // keychain, then uses it for all subsequent WebSocket connections.
        if ($pairingCode->isCompleted()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'status'     => 'completed',
                    'token'      => $pairingCode->machine_token,
                    'machine_id' => $pairingCode->machine_id,
                ],
                'meta' => [
                    'timestamp'  => now()->toIso8601String(),
                    'request_id' => request()->header('X-Request-ID', uniqid()),
                ],
            ]);
        }

        // ── 410: code expired ──
        if ($pairingCode->isExpired()) {
            // Lazily update the status column so future lookups are faster
            if ($pairingCode->status !== 'expired') {
                $pairingCode->update(['status' => 'expired']);
            }

            return $this->errorResponse(
                'PAIR_003',
                'Pairing code has expired. Please generate a new one.',
                410
            );
        }

        // ── 202: still pending — agent should keep polling ──
        return response()->json([
            'success' => true,
            'data' => [
                'status'            => 'pending',
                'expires_at'        => $pairingCode->expires_at->toIso8601String(),
                'seconds_remaining' => (int) now()->diffInSeconds($pairingCode->expires_at, false),
            ],
            'meta' => [
                'timestamp'  => now()->toIso8601String(),
                'request_id' => request()->header('X-Request-ID', uniqid()),
            ],
        ], 202);
    }

    /**
     * Complete the pairing from the dashboard.
     *
     * The authenticated user enters the pairing code displayed by the
     * agent CLI. This endpoint:
     * 1. Validates the code exists and is still pending + not expired.
     * 2. Creates a new Machine record owned by the authenticated user.
     * 3. Generates a plain-text auth token (mn_...) and stores its SHA-256
     *    hash in `machines.token_hash`.
     * 4. Stores the plain-text token in `pairing_codes.machine_token` so
     *    the agent can retrieve it on the next poll.
     * 5. Returns the new Machine resource to the dashboard.
     *
     * AUTHENTICATED route — requires auth:sanctum middleware.
     *
     * @OA\Post(
     *     path="/api/pairing/{code}/complete",
     *     operationId="pairingComplete",
     *     tags={"Pairing"},
     *     summary="Complete pairing from the web dashboard (authenticated)",
     *     description="The authenticated user confirms the pairing code. A Machine record and auth token are created. The agent retrieves the token on its next poll.",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         description="The 6-char pairing code in XXX-XXX format",
     *         @OA\Schema(type="string", example="A3K-9FZ")
     *     ),
     *     @OA\RequestBody(
     *         required=false,
     *         @OA\JsonContent(
     *             @OA\Property(property="name", type="string", example="My Workstation", description="Optional machine display name. Defaults to agent hostname if omitted.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Pairing completed — Machine created",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="machine", ref="#/components/schemas/MachineResource"),
     *                 @OA\Property(property="pairing", type="object",
     *                     @OA\Property(property="code", type="string", example="A3K-9FZ"),
     *                     @OA\Property(property="completed_at", type="string", format="date-time", example="2026-02-17T14:02:30+00:00")
     *                 )
     *             ),
     *             @OA\Property(property="meta", ref="#/components/schemas/Meta")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Pairing code not found or already used",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=410,
     *         description="Pairing code expired",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     *
     * @param  CompletePairingRequest  $request  Validated request (optional name field)
     * @param  string                  $code     The XXX-XXX pairing code from the URL segment
     * @return JsonResponse  201 on success, 404/410 on error
     */
    public function complete(CompletePairingRequest $request, string $code): JsonResponse
    {
        // ── Find the pending pairing code ──
        // We filter by status='pending' to reject already-completed or expired codes.
        $pairingCode = PairingCode::where('code', $code)
            ->where('status', 'pending')
            ->first();

        if (!$pairingCode) {
            return $this->errorResponse(
                'PAIR_001',
                'Pairing code not found or already used.',
                404
            );
        }

        // ── Guard: reject if the code has expired since it was created ──
        if ($pairingCode->isExpired()) {
            $pairingCode->update(['status' => 'expired']);

            return $this->errorResponse(
                'PAIR_003',
                'Pairing code has expired. Ask the agent to generate a new one.',
                410
            );
        }

        $user      = $request->user();
        $agentInfo = $pairingCode->agent_info ?? [];
        $validated = $request->validated();

        // ── Determine machine name ──
        // Priority: user-provided > agent hostname > random fallback
        $machineName = $validated['name']
            ?? $agentInfo['hostname']
            ?? 'Machine-' . Str::random(6);

        // ── Ensure uniqueness for this user ──
        // If "rony-desktop" exists, try "rony-desktop-1", "rony-desktop-2", etc.
        $baseName = $machineName;
        $suffix   = 1;
        while ($user->machines()->where('name', $machineName)->exists()) {
            $machineName = $baseName . '-' . $suffix;
            $suffix++;
        }

        // ── Generate auth token ──
        // The agent will store this token in the OS keychain (via keytar).
        // Only the SHA-256 hash is persisted in `machines.token_hash`.
        $plainToken = 'mn_' . Str::random(32);
        $tokenHash  = hash('sha256', $plainToken);

        // ── Create the Machine record ──
        $machine = $user->machines()->create([
            'name'          => $machineName,
            'token_hash'    => $tokenHash,
            'platform'      => $agentInfo['platform'] ?? 'linux',
            'hostname'      => $agentInfo['hostname'] ?? null,
            'arch'          => $agentInfo['arch'] ?? null,
            'node_version'  => $agentInfo['node_version'] ?? null,
            'agent_version' => $agentInfo['agent_version'] ?? null,
            'claude_version' => $agentInfo['claude_version'] ?? null,
            'claude_path'   => $agentInfo['claude_path'] ?? null,
            'capabilities'  => [],
            'max_sessions'  => 10,
            'status'        => 'offline',
        ]);

        // ── Mark the pairing code as completed ──
        // Store the plain-text token so the agent can retrieve it on the next poll.
        // The `machine_token` column is listed in the model's $hidden array, so it
        // won't leak through accidental serialization.
        $pairingCode->update([
            'status'        => 'completed',
            'user_id'       => $user->id,
            'machine_id'    => $machine->id,
            'machine_token' => $plainToken,
            'completed_at'  => now(),
        ]);

        // ── Eager-load active sessions count for the API resource ──
        $machine->loadCount(['sessions as active_sessions_count' => function ($q) {
            $q->whereIn('status', ['running', 'waiting_input']);
        }]);

        return response()->json([
            'success' => true,
            'data' => [
                'machine' => new MachineResource($machine),
                'pairing' => [
                    'code'         => $pairingCode->code,
                    'completed_at' => $pairingCode->completed_at->toIso8601String(),
                ],
            ],
            'meta' => [
                'timestamp'  => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Build a standard JSON error response.
     *
     * Keeps error formatting consistent across all pairing endpoints.
     * Error codes follow the PAIR_XXX convention:
     * - PAIR_001: Code not found
     * - PAIR_002: Code already active (conflict)
     * - PAIR_003: Code expired
     *
     * @param  string  $code     Machine-readable error code (e.g. PAIR_001)
     * @param  string  $message  Human-readable error message
     * @param  int     $status   HTTP status code
     * @return JsonResponse
     */
    private function errorResponse(string $code, string $message, int $status): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => [
                'code'    => $code,
                'message' => $message,
            ],
            'meta' => [
                'timestamp'  => now()->toIso8601String(),
                'request_id' => request()->header('X-Request-ID', uniqid()),
            ],
        ], $status);
    }
}
