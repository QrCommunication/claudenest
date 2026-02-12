<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CompletePairingRequest;
use App\Http\Requests\InitiatePairingRequest;
use App\Http\Resources\MachineResource;
use App\Models\PairingCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class PairingController extends Controller
{
    /**
     * Initiate a pairing request from the agent.
     *
     * The agent CLI generates a pairing code locally, then calls this
     * endpoint to register it with the server. The code expires after
     * 5 minutes. The agent then polls the `poll` endpoint until the
     * user completes pairing from the dashboard.
     *
     * PUBLIC route - agent is not authenticated yet.
     *
     * POST /api/pairing/initiate
     */
    public function initiate(InitiatePairingRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Check if this code is already registered and active
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

        // Expire any old codes before creating a new one (lightweight cleanup)
        PairingCode::expireOldCodes();

        $expiresAt = now()->addMinutes(PairingCode::EXPIRATION_MINUTES);

        $pairingCode = PairingCode::create([
            'code' => $validated['code'],
            'status' => 'pending',
            'agent_info' => $validated['agent_info'],
            'expires_at' => $expiresAt,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'code' => $pairingCode->code,
                'expires_at' => $pairingCode->expires_at->toIso8601String(),
                'expires_in_seconds' => PairingCode::EXPIRATION_MINUTES * 60,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Poll for pairing completion.
     *
     * The agent calls this endpoint repeatedly to check if the user
     * has completed the pairing from the dashboard. Returns:
     * - 202 Accepted if still pending (agent keeps polling)
     * - 200 OK with token if completed
     * - 410 Gone if expired
     *
     * PUBLIC route - agent is not authenticated yet.
     *
     * GET /api/pairing/{code}
     */
    public function poll(string $code): JsonResponse
    {
        $pairingCode = PairingCode::where('code', $code)->first();

        if (!$pairingCode) {
            return $this->errorResponse(
                'PAIR_001',
                'Pairing code not found.',
                404
            );
        }

        // Check if completed
        if ($pairingCode->isCompleted()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'status' => 'completed',
                    'token' => $pairingCode->machine_token,
                    'machine_id' => $pairingCode->machine_id,
                ],
                'meta' => [
                    'timestamp' => now()->toIso8601String(),
                    'request_id' => request()->header('X-Request-ID', uniqid()),
                ],
            ]);
        }

        // Check if expired
        if ($pairingCode->isExpired()) {
            // Mark as expired in DB if not already
            if ($pairingCode->status !== 'expired') {
                $pairingCode->update(['status' => 'expired']);
            }

            return $this->errorResponse(
                'PAIR_003',
                'Pairing code has expired. Please generate a new one.',
                410
            );
        }

        // Still pending - agent should keep polling
        return response()->json([
            'success' => true,
            'data' => [
                'status' => 'pending',
                'expires_at' => $pairingCode->expires_at->toIso8601String(),
                'seconds_remaining' => (int) now()->diffInSeconds($pairingCode->expires_at, false),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => request()->header('X-Request-ID', uniqid()),
            ],
        ], 202);
    }

    /**
     * Complete the pairing from the dashboard.
     *
     * The authenticated user enters the pairing code displayed by the
     * agent CLI. This endpoint validates the code, creates a new Machine
     * record for the user, generates an auth token, and stores it in
     * the PairingCode so the agent can retrieve it on the next poll.
     *
     * AUTHENTICATED route - requires auth:sanctum.
     *
     * POST /api/pairing/{code}/complete
     */
    public function complete(CompletePairingRequest $request, string $code): JsonResponse
    {
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

        // Check if expired
        if ($pairingCode->isExpired()) {
            $pairingCode->update(['status' => 'expired']);

            return $this->errorResponse(
                'PAIR_003',
                'Pairing code has expired. Ask the agent to generate a new one.',
                410
            );
        }

        $user = $request->user();
        $agentInfo = $pairingCode->agent_info ?? [];
        $validated = $request->validated();

        // Determine machine name: user-provided, or from agent hostname, or generated
        $machineName = $validated['name']
            ?? $agentInfo['hostname']
            ?? 'Machine-' . Str::random(6);

        // Ensure machine name is unique for this user
        $baseName = $machineName;
        $suffix = 1;
        while ($user->machines()->where('name', $machineName)->exists()) {
            $machineName = $baseName . '-' . $suffix;
            $suffix++;
        }

        // Generate a plain-text token for the agent
        $plainToken = 'mn_' . Str::random(32);
        $tokenHash = hash('sha256', $plainToken);

        // Create the machine
        $machine = $user->machines()->create([
            'name' => $machineName,
            'token_hash' => $tokenHash,
            'platform' => $agentInfo['platform'] ?? 'linux',
            'hostname' => $agentInfo['hostname'] ?? null,
            'arch' => $agentInfo['arch'] ?? null,
            'node_version' => $agentInfo['node_version'] ?? null,
            'agent_version' => $agentInfo['agent_version'] ?? null,
            'claude_version' => $agentInfo['claude_version'] ?? null,
            'claude_path' => $agentInfo['claude_path'] ?? null,
            'capabilities' => [],
            'max_sessions' => 10,
            'status' => 'offline',
        ]);

        // Update the pairing code with completion details
        $pairingCode->update([
            'status' => 'completed',
            'user_id' => $user->id,
            'machine_id' => $machine->id,
            'machine_token' => $plainToken,
            'completed_at' => now(),
        ]);

        // Load active sessions count for the resource
        $machine->loadCount(['sessions as active_sessions_count' => function ($q) {
            $q->whereIn('status', ['running', 'waiting_input']);
        }]);

        return response()->json([
            'success' => true,
            'data' => [
                'machine' => new MachineResource($machine),
                'pairing' => [
                    'code' => $pairingCode->code,
                    'completed_at' => $pairingCode->completed_at->toIso8601String(),
                ],
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Helper: Standard error response.
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
