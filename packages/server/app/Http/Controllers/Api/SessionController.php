<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Models\Session;
use App\Services\CredentialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    /**
     * List sessions for a machine.
     */
    public function index(Request $request, string $machineId): JsonResponse
    {
        $machine = $request->user()->machines()->find($machineId);

        if (!$machine) {
            return $this->errorResponse('MCH_001', 'Machine not found', 404);
        }

        $sessions = $machine->sessions()
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $sessions->map(fn ($session) => $this->formatSession($session)),
            'meta' => [
                'pagination' => [
                    'current_page' => $sessions->currentPage(),
                    'per_page' => $sessions->perPage(),
                    'total' => $sessions->total(),
                    'last_page' => $sessions->lastPage(),
                ],
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Create a new session.
     */
    public function store(Request $request, string $machineId): JsonResponse
    {
        $machine = $request->user()->machines()->find($machineId);

        if (!$machine) {
            return $this->errorResponse('MCH_001', 'Machine not found', 404);
        }

        if ($machine->status !== 'online') {
            return $this->errorResponse('MCH_002', 'Machine is offline', 400);
        }

        $validated = $request->validate([
            'mode' => 'string|in:interactive,headless,oneshot|default:interactive',
            'project_path' => 'nullable|string|max:512',
            'initial_prompt' => 'nullable|string',
            'credential_id' => 'nullable|uuid|exists:claude_credentials,id',
            'pty_size' => 'array',
            'pty_size.cols' => 'integer|min:20|max:500',
            'pty_size.rows' => 'integer|min:10|max:200',
        ]);

        $session = $machine->sessions()->create([
            'user_id' => $request->user()->id,
            'mode' => $validated['mode'] ?? 'interactive',
            'project_path' => $validated['project_path'] ?? null,
            'initial_prompt' => $validated['initial_prompt'] ?? null,
            'credential_id' => $validated['credential_id'] ?? null,
            'status' => 'created',
            'pty_size' => $validated['pty_size'] ?? ['cols' => 120, 'rows' => 40],
        ]);

        // Resolve credential env vars if a credential is attached
        $credentialEnv = [];
        if ($session->credential_id) {
            $credential = $request->user()->credentials()->find($session->credential_id);
            if ($credential) {
                $credentialService = app(CredentialService::class);
                $credentialEnv = $credentialService->getSessionEnv($credential);
            }
        }

        // Broadcast session creation to agent (include credential env)
        broadcast(new \App\Events\SessionCreated($session, $credentialEnv))->toOthers();

        return response()->json([
            'success' => true,
            'data' => $this->formatSession($session),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Show session details.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $session = Session::forUser($request->user()->id)->find($id);

        if (!$session) {
            return $this->errorResponse('SES_001', 'Session not found', 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatSession($session, true),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Terminate a session.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $session = Session::forUser($request->user()->id)->find($id);

        if (!$session) {
            return $this->errorResponse('SES_001', 'Session not found', 404);
        }

        if ($session->is_completed) {
            return $this->errorResponse('SES_003', 'Session already terminated', 400);
        }

        // Mark as terminated
        $session->markAsTerminated();

        // Broadcast termination to agent
        broadcast(new \App\Events\SessionTerminated($session))->toOthers();

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
     * Get session logs.
     */
    public function logs(Request $request, string $id): JsonResponse
    {
        $session = Session::forUser($request->user()->id)->find($id);

        if (!$session) {
            return $this->errorResponse('SES_001', 'Session not found', 404);
        }

        $logs = $session->logs()
            ->orderBy('created_at', 'asc')
            ->paginate($request->input('per_page', 100));

        return response()->json([
            'success' => true,
            'data' => $logs->map(fn ($log) => [
                'id' => $log->id,
                'type' => $log->type,
                'data' => $log->data,
                'metadata' => $log->metadata,
                'created_at' => $log->created_at,
            ]),
            'meta' => [
                'pagination' => [
                    'current_page' => $logs->currentPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                    'last_page' => $logs->lastPage(),
                ],
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Attach to a running session (WebSocket token).
     */
    public function attach(Request $request, string $id): JsonResponse
    {
        $session = Session::forUser($request->user()->id)
            ->whereIn('status', ['running', 'waiting_input'])
            ->find($id);

        if (!$session) {
            return $this->errorResponse('SES_001', 'Session not found or not running', 404);
        }

        // Generate WebSocket attachment token
        $wsToken = bin2hex(random_bytes(32));

        // Store token in cache with session ID
        cache()->put("ws_attach:{$wsToken}", $session->id, 60);

        return response()->json([
            'success' => true,
            'data' => [
                'ws_token' => $wsToken,
                'session_id' => $session->id,
                'ws_url' => config('reverb.apps.apps.0.options.scheme') . '://' . 
                    config('reverb.apps.apps.0.options.host') . ':' . 
                    config('reverb.apps.apps.0.options.port'),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Send input to a session.
     */
    public function input(Request $request, string $id): JsonResponse
    {
        $session = Session::forUser($request->user()->id)
            ->whereIn('status', ['running', 'waiting_input'])
            ->find($id);

        if (!$session) {
            return $this->errorResponse('SES_001', 'Session not found or not running', 404);
        }

        $validated = $request->validate([
            'data' => 'required|string',
        ]);

        // Broadcast input to agent
        broadcast(new \App\Events\SessionInput($session, $validated['data']))->toOthers();

        // Log input
        $session->addLog('input', $validated['data']);

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
     * Resize session PTY.
     */
    public function resize(Request $request, string $id): JsonResponse
    {
        $session = Session::forUser($request->user()->id)
            ->whereIn('status', ['running', 'waiting_input'])
            ->find($id);

        if (!$session) {
            return $this->errorResponse('SES_001', 'Session not found or not running', 404);
        }

        $validated = $request->validate([
            'cols' => 'required|integer|min:20|max:500',
            'rows' => 'required|integer|min:10|max:200',
        ]);

        $session->resizePty($validated['cols'], $validated['rows']);

        // Broadcast resize to agent
        broadcast(new \App\Events\SessionResize($session, $validated['cols'], $validated['rows']))->toOthers();

        return response()->json([
            'success' => true,
            'data' => [
                'pty_size' => $session->pty_size,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Helper: Format session data.
     */
    private function formatSession(Session $session, bool $includeLogs = false): array
    {
        $data = [
            'id' => $session->id,
            'machine_id' => $session->machine_id,
            'mode' => $session->mode,
            'project_path' => $session->project_path,
            'initial_prompt' => $session->initial_prompt,
            'status' => $session->status,
            'is_running' => $session->is_running,
            'is_completed' => $session->is_completed,
            'pid' => $session->pid,
            'exit_code' => $session->exit_code,
            'pty_size' => $session->pty_size,
            'total_tokens' => $session->total_tokens,
            'total_cost' => $session->total_cost,
            'duration' => $session->duration,
            'formatted_duration' => $session->formatted_duration,
            'started_at' => $session->started_at,
            'completed_at' => $session->completed_at,
            'created_at' => $session->created_at,
            'updated_at' => $session->updated_at,
        ];

        if ($includeLogs) {
            $data['recent_logs'] = $session->logs()
                ->orderBy('created_at', 'desc')
                ->limit(100)
                ->get()
                ->map(fn ($log) => [
                    'type' => $log->type,
                    'data' => $log->data,
                    'created_at' => $log->created_at,
                ])
                ->reverse()
                ->values();
        }

        return $data;
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
