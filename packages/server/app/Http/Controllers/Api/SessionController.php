<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SessionResource;
use App\Models\Machine;
use App\Models\Session;
use App\Services\AgentGateway;
use App\Services\CredentialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

class SessionController extends Controller
{
    /**
     * List sessions for a machine.
     */
    #[OA\Get(
        path: '/api/machines/{machineId}/sessions',
        summary: 'List sessions for a machine',
        security: [['bearerAuth' => []]],
        tags: ['Sessions'],
        parameters: [
            new OA\Parameter(name: 'machineId', in: 'path', required: true, description: 'Machine UUID', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, description: 'Number of results per page', schema: new OA\Schema(type: 'integer', default: 20)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated list of sessions',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Session')),
                        new OA\Property(property: 'meta', type: 'object'),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Machine not found'),
        ],
    )]
    public function index(Request $request, string $machineId): JsonResponse
    {
        $machine = Machine::findOrFail($machineId);
        $this->authorize('view', $machine);

        $sessions = $machine->sessions()
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->input('status'))
            )
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => SessionResource::collection($sessions),
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
    #[OA\Post(
        path: '/api/machines/{machineId}/sessions',
        summary: 'Create a new session',
        security: [['bearerAuth' => []]],
        tags: ['Sessions'],
        parameters: [
            new OA\Parameter(name: 'machineId', in: 'path', required: true, description: 'Machine UUID', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/CreateSessionRequest')
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Session created',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', ref: '#/components/schemas/Session'),
                    ]
                )
            ),
            new OA\Response(response: 400, description: 'Machine is offline'),
            new OA\Response(response: 404, description: 'Machine not found'),
        ],
    )]
    public function store(Request $request, string $machineId): JsonResponse
    {
        $machine = Machine::findOrFail($machineId);
        $this->authorize('view', $machine);

        if ($machine->status !== 'online') {
            return $this->errorResponse('MCH_002', 'Machine is offline', 400);
        }

        $validated = $request->validate([
            'mode' => 'sometimes|string|in:interactive,headless,oneshot,bash',
            'project_path' => 'nullable|string|max:512',
            'initial_prompt' => 'nullable|string',
            'credential_id' => [
                'nullable',
                'uuid',
                Rule::exists('claude_credentials', 'id')->where('user_id', $request->user()->id),
            ],
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

        // Send to agent via dedicated WebSocket server
        AgentGateway::send($machine->id, 'session:create', [
            'sessionId' => $session->id,
            'mode' => $session->mode,
            'projectPath' => $session->project_path,
            'initialPrompt' => $session->initial_prompt,
            'ptySize' => $session->pty_size,
            'credentialEnv' => $credentialEnv,
        ]);

        // Broadcast to dashboard via Reverb (credentials excluded — agent-only via AgentGateway)
        broadcast(new \App\Events\SessionCreated($session))->toOthers();

        return response()->json([
            'success' => true,
            'data' => new SessionResource($session),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * Get session details.
     */
    #[OA\Get(
        path: '/api/sessions/{id}',
        summary: 'Get session details',
        security: [['bearerAuth' => []]],
        tags: ['Sessions'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Session UUID', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Session details including recent logs',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', ref: '#/components/schemas/Session'),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Session not found'),
        ],
    )]
    public function show(Request $request, string $id): JsonResponse
    {
        $session = Session::findOrFail($id);
        $this->authorize('view', $session);

        return response()->json([
            'success' => true,
            'data' => SessionResource::withLogs($session),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Terminate a session.
     */
    #[OA\Delete(
        path: '/api/sessions/{id}',
        summary: 'Terminate a session',
        security: [['bearerAuth' => []]],
        tags: ['Sessions'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Session UUID', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Session terminated', content: new OA\JsonContent(ref: '#/components/schemas/DeletedResponse')),
            new OA\Response(response: 400, description: 'Session already terminated'),
            new OA\Response(response: 404, description: 'Session not found'),
        ],
    )]
    public function destroy(Request $request, string $id): JsonResponse
    {
        $session = Session::findOrFail($id);
        $this->authorize('delete', $session);

        if ($session->is_completed) {
            return $this->errorResponse('SES_003', 'Session already terminated', 400);
        }

        // Mark as terminated
        $session->markAsTerminated();

        // Send to agent via dedicated WebSocket server
        AgentGateway::send($session->machine_id, 'session:terminate', [
            'sessionId' => $session->id,
        ]);

        // Broadcast to dashboard via Reverb
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
    #[OA\Get(
        path: '/api/sessions/{id}/logs',
        summary: 'Get session logs',
        security: [['bearerAuth' => []]],
        tags: ['Sessions'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Session UUID', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, description: 'Number of log entries per page', schema: new OA\Schema(type: 'integer', default: 100)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated list of session logs',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/SessionLog')),
                        new OA\Property(property: 'meta', type: 'object'),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Session not found'),
        ],
    )]
    public function logs(Request $request, string $id): JsonResponse
    {
        $session = Session::findOrFail($id);
        $this->authorize('view', $session);

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
     * Attach to running session (get WebSocket token).
     */
    #[OA\Post(
        path: '/api/sessions/{id}/attach',
        summary: 'Attach to running session (get WebSocket token)',
        security: [['bearerAuth' => []]],
        tags: ['Sessions'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Session UUID', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'WebSocket attachment token',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'ws_token', type: 'string', example: 'a1b2c3...'),
                                new OA\Property(property: 'session_id', type: 'string', format: 'uuid'),
                                new OA\Property(property: 'ws_url', type: 'string', example: 'ws://localhost:8080'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Session not found or not running'),
        ],
    )]
    public function attach(Request $request, string $id): JsonResponse
    {
        $session = Session::whereIn('status', ['running', 'waiting_input'])
            ->findOrFail($id);
        $this->authorize('view', $session);

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
     * Send input to session.
     */
    #[OA\Post(
        path: '/api/sessions/{id}/input',
        summary: 'Send input to session',
        security: [['bearerAuth' => []]],
        tags: ['Sessions'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Session UUID', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['data'],
                properties: [
                    new OA\Property(property: 'data', type: 'string', description: 'Input data to send to the session'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Input sent successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Session not found or not running'),
        ],
    )]
    public function input(Request $request, string $id): JsonResponse
    {
        $session = Session::whereIn('status', ['running', 'waiting_input'])
            ->findOrFail($id);
        $this->authorize('update', $session);

        // Read raw body to bypass TrimStrings/ConvertEmptyStringsToNull middleware
        // which corrupts terminal control characters (\r, \x03, \x1b, etc.)
        $body = json_decode($request->getContent(), true);
        $data = $body['data'] ?? null;

        if (!is_string($data) || $data === '') {
            return $this->errorResponse('VAL_001', 'The data field is required', 422);
        }

        // Send input to agent via dedicated WebSocket server
        AgentGateway::send($session->machine_id, 'session:input', [
            'sessionId' => $session->id,
            'data' => $data,
        ]);

        // Broadcast to dashboard via Reverb
        broadcast(new \App\Events\SessionInput($session, $data))->toOthers();

        // Log input
        $session->addLog('input', $data);

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
    #[OA\Post(
        path: '/api/sessions/{id}/resize',
        summary: 'Resize session PTY',
        security: [['bearerAuth' => []]],
        tags: ['Sessions'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Session UUID', schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['cols', 'rows'],
                properties: [
                    new OA\Property(property: 'cols', type: 'integer', minimum: 20, maximum: 500, description: 'Terminal columns'),
                    new OA\Property(property: 'rows', type: 'integer', minimum: 10, maximum: 200, description: 'Terminal rows'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'PTY resized successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(
                                    property: 'pty_size',
                                    type: 'object',
                                    properties: [
                                        new OA\Property(property: 'cols', type: 'integer'),
                                        new OA\Property(property: 'rows', type: 'integer'),
                                    ]
                                ),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Session not found or not running'),
        ],
    )]
    public function resize(Request $request, string $id): JsonResponse
    {
        $session = Session::whereIn('status', ['running', 'waiting_input'])
            ->findOrFail($id);
        $this->authorize('update', $session);

        $validated = $request->validate([
            'cols' => 'required|integer|min:20|max:500',
            'rows' => 'required|integer|min:10|max:200',
        ]);

        $session->resizePty($validated['cols'], $validated['rows']);

        // Send resize to agent via dedicated WebSocket server
        AgentGateway::send($session->machine_id, 'session:resize', [
            'sessionId' => $session->id,
            'cols' => $validated['cols'],
            'rows' => $validated['rows'],
        ]);

        // Broadcast to dashboard via Reverb
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

}
