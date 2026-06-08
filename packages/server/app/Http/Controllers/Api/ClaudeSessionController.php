<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DiscoveredSessionResource;
use App\Http\Resources\SessionResource;
use App\Models\DiscoveredSession;
use App\Models\Machine;
use App\Services\AgentGateway;
use App\Services\CredentialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Discovery and live mirroring of the user's own Claude Code sessions
 * (scanned by the agent, not spawned by ClaudeNest).
 */
class ClaudeSessionController extends Controller
{
    /**
     * List the Claude sessions discovered on a machine.
     *
     * GET /api/machines/{machine}/claude-sessions
     */
    public function index(Request $request, Machine $machine): JsonResponse
    {
        if ($machine->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Machine does not belong to you', 403);
        }

        $query = DiscoveredSession::forMachine($machine->id)
            ->orderByDesc('is_live')
            ->orderByDesc('last_activity_at');

        if ($request->boolean('live_only')) {
            $query->live();
        }

        $sessions = $query->get();

        return $this->ok(
            DiscoveredSessionResource::collection($sessions),
            $request,
        );
    }

    /**
     * Ask the agent to re-scan now and return the fresh list.
     *
     * POST /api/machines/{machine}/claude-sessions/refresh
     */
    public function refresh(Request $request, Machine $machine): JsonResponse
    {
        if ($machine->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Machine does not belong to you', 403);
        }
        if ($machine->status !== 'online') {
            return $this->errorResponse('MACHINE_OFFLINE', 'Machine is not online', 422);
        }

        $result = AgentGateway::sendAndWait($machine->id, 'claude_sessions:discover', [
            'includeHistory' => $request->boolean('include_history', true),
        ], 15);

        if ($result === null) {
            return $this->errorResponse('AGENT_TIMEOUT', 'Machine did not respond in time', 504);
        }
        if (!empty($result['error'])) {
            return $this->errorResponse('DISCOVERY_ERROR', $result['error'], 422);
        }

        return response()->json([
            'success' => true,
            'data' => $result['sessions'] ?? [],
            'meta' => $this->meta($request),
        ]);
    }

    /**
     * Start mirroring a session live. Returns its redacted history; subsequent
     * events stream over the `claude-sessions.{sessionId}` broadcast channel.
     *
     * POST /api/machines/{machine}/claude-sessions/{sessionId}/open
     */
    public function open(Request $request, Machine $machine, string $sessionId): JsonResponse
    {
        $session = $this->resolveSession($request, $machine, $sessionId);
        if ($session instanceof JsonResponse) {
            return $session;
        }

        $result = AgentGateway::sendAndWait($machine->id, 'claude_sessions:open', [
            'sessionId' => $sessionId,
            'transcriptPath' => $session->transcript_path,
            'historyLimit' => (int) $request->input('history_limit', 500),
        ], 20);

        if ($result === null) {
            return $this->errorResponse('AGENT_TIMEOUT', 'Machine did not respond in time', 504);
        }
        if (!empty($result['error'])) {
            return $this->errorResponse('OPEN_ERROR', $result['error'], 422);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'session_id' => $sessionId,
                'history' => $result['history'] ?? [],
            ],
            'meta' => $this->meta($request),
        ]);
    }

    /**
     * Stop mirroring a session.
     *
     * POST /api/machines/{machine}/claude-sessions/{sessionId}/close
     */
    public function close(Request $request, Machine $machine, string $sessionId): JsonResponse
    {
        $session = $this->resolveSession($request, $machine, $sessionId);
        if ($session instanceof JsonResponse) {
            return $session;
        }

        AgentGateway::send($machine->id, 'claude_sessions:close', ['sessionId' => $sessionId]);

        return response()->json([
            'success' => true,
            'data' => ['session_id' => $sessionId, 'closed' => true],
            'meta' => $this->meta($request),
        ]);
    }

    /**
     * Adopt a session: relaunch it under the agent's tmux (`claude --resume`)
     * so it becomes fully interactive online.
     *
     * POST /api/machines/{machine}/claude-sessions/{sessionId}/adopt
     */
    public function adopt(Request $request, Machine $machine, string $sessionId): JsonResponse
    {
        $discovered = $this->resolveSession($request, $machine, $sessionId);
        if ($discovered instanceof JsonResponse) {
            return $discovered;
        }
        if ($machine->status !== 'online') {
            return $this->errorResponse('MACHINE_OFFLINE', 'Machine is not online', 422);
        }

        // Scope the credential to the authenticated user (prevent referencing
        // another user's credential — IDOR defense in depth).
        $validated = $request->validate([
            'credential_id' => [
                'nullable',
                'uuid',
                Rule::exists('claude_credentials', 'id')->where('user_id', $request->user()->id),
            ],
        ]);

        // Create the Session row first so the resumed tmux session's output is
        // bound to a terminal the dashboard can attach to (onSessionOutput
        // resolves Session::find($agentSessionId)).
        $session = $machine->sessions()->create([
            'user_id' => $request->user()->id,
            'mode' => 'interactive',
            'project_path' => $discovered->cwd,
            'credential_id' => $validated['credential_id'] ?? null,
            'status' => 'created',
            'pty_size' => ['cols' => 120, 'rows' => 40],
        ]);

        $credentialEnv = [];
        if ($session->credential_id) {
            $credential = $request->user()->credentials()->find($session->credential_id);
            if ($credential) {
                $credentialEnv = app(CredentialService::class)->getSessionEnv($credential);
            }
        }

        $result = AgentGateway::sendAndWait($machine->id, 'claude_sessions:adopt', [
            'sessionId' => $sessionId,           // Claude session to resume
            'agentSessionId' => $session->id,    // server-owned id for terminal I/O
            'cwd' => $discovered->cwd,
            'credentialEnv' => $credentialEnv,
        ], 20);

        if ($result === null) {
            $session->delete();
            return $this->errorResponse('AGENT_TIMEOUT', 'Machine did not respond in time', 504);
        }
        if (!empty($result['error'])) {
            $session->delete();
            return $this->errorResponse('ADOPT_ERROR', $result['error'], 422);
        }

        $discovered->update([
            'adopted' => true,
            'agent_session_id' => $session->id,
        ]);

        broadcast(new \App\Events\SessionCreated($session))->toOthers();

        return response()->json([
            'success' => true,
            'data' => [
                'session_id' => $sessionId,
                'agent_session_id' => $session->id,
                'session' => new SessionResource($session),
            ],
            'meta' => $this->meta($request),
        ]);
    }

    // ==================== Helpers ====================

    /**
     * @return DiscoveredSession|JsonResponse
     */
    private function resolveSession(Request $request, Machine $machine, string $sessionId)
    {
        if ($machine->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Machine does not belong to you', 403);
        }

        $session = DiscoveredSession::forMachine($machine->id)
            ->where('session_id', $sessionId)
            ->first();

        if (!$session) {
            return $this->errorResponse('NOT_FOUND', 'Discovered session not found', 404);
        }

        return $session;
    }

    private function ok($data, Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => $this->meta($request),
        ]);
    }

    private function meta(Request $request): array
    {
        return [
            'timestamp' => now()->toIso8601String(),
            'request_id' => $request->header('X-Request-ID', uniqid()),
        ];
    }
}
