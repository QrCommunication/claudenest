<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClaudeCredential;
use App\Models\SharedProject;
use App\Services\AgentGateway;
use App\Services\CredentialService;
use App\Services\DecompositionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DecompositionController extends Controller
{
    public function __construct(
        private DecompositionService $decompositionService,
        private CredentialService $credentialService,
    ) {}

    /**
     * Launch PRD decomposition via the agent (async).
     *
     * POST /api/projects/{project}/decompose
     */
    public function decompose(Request $request, SharedProject $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Project does not belong to you', 403);
        }

        $validated = $request->validate([
            'prd' => 'required|string|min:20|max:50000',
            'credential_id' => 'required|uuid|exists:claude_credentials,id',
        ]);

        // Resolve credential
        $credential = ClaudeCredential::where('id', $validated['credential_id'])
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$credential) {
            return $this->errorResponse('CREDENTIAL_NOT_FOUND', 'Credential not found', 404);
        }

        // Get credential env vars
        try {
            $credentialEnv = $this->credentialService->getSessionEnv($credential);
        } catch (\RuntimeException $e) {
            return $this->errorResponse('CREDENTIAL_ERROR', $e->getMessage(), 422);
        }

        $machine = $project->machine;
        if (!$machine || $machine->status !== 'online') {
            return $this->errorResponse('MACHINE_OFFLINE', 'Machine is not online', 422);
        }

        // Store PRD on project
        $project->update(['prd' => $validated['prd']]);

        // Build decomposition prompt
        $scanResult = null;
        if ($project->settings && isset($project->settings['scan_result'])) {
            $scanResult = $project->settings['scan_result'];
        }
        $prompt = $this->decompositionService->buildDecompositionPrompt(
            $validated['prd'],
            $scanResult,
        );

        // Send decompose command to agent (async — result comes via WebSocket)
        AgentGateway::send($machine->id, 'decompose:start', [
            'projectId' => $project->id,
            'projectPath' => $project->project_path,
            'prompt' => $prompt,
            'credentialEnv' => $credentialEnv,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'status' => 'decomposing',
                'message' => 'Decomposition started. Results will be streamed via WebSocket.',
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Get the stored master plan.
     *
     * GET /api/projects/{project}/master-plan
     */
    public function getMasterPlan(Request $request, SharedProject $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Project does not belong to you', 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'prd' => $project->prd,
                'master_plan' => $project->master_plan,
                'has_plan' => !empty($project->master_plan),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Update the master plan (after frontend editing).
     *
     * PUT /api/projects/{project}/master-plan
     */
    public function updateMasterPlan(Request $request, SharedProject $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Project does not belong to you', 403);
        }

        $validated = $request->validate([
            'master_plan' => 'required|array',
            'master_plan.version' => 'required|integer|in:1',
            'master_plan.waves' => 'required|array|min:1',
            'master_plan.waves.*.name' => 'required|string',
            'master_plan.waves.*.tasks' => 'required|array|min:1',
            'master_plan.waves.*.tasks.*.title' => 'required|string',
        ]);

        $validation = $this->decompositionService->validateMasterPlan($validated['master_plan']);
        if (!$validation['valid']) {
            return $this->errorResponse(
                'INVALID_PLAN',
                'Master plan validation failed: ' . implode('; ', $validation['errors']),
                422,
            );
        }

        $project->update(['master_plan' => $validation['plan']]);

        return response()->json([
            'success' => true,
            'data' => [
                'master_plan' => $project->fresh()->master_plan,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Apply the master plan — create SharedTasks from waves.
     *
     * POST /api/projects/{project}/master-plan/apply
     */
    public function applyMasterPlan(Request $request, SharedProject $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Project does not belong to you', 403);
        }

        if (empty($project->master_plan)) {
            return $this->errorResponse('NO_PLAN', 'No master plan to apply', 422);
        }

        // Check for existing tasks
        $existingTasks = $project->tasks()->count();
        if ($existingTasks > 0) {
            $request->validate([
                'force' => 'required|boolean|accepted',
            ]);
            // Delete existing tasks before re-applying
            $project->tasks()->delete();
        }

        try {
            $result = $this->decompositionService->applyMasterPlan($project);
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse('APPLY_ERROR', $e->getMessage(), 422);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'created' => $result['created'],
                'tasks' => $result['tasks']->map(fn ($t) => [
                    'id' => $t->id,
                    'wave' => $t->wave,
                    'title' => $t->title,
                    'priority' => $t->priority,
                    'status' => $t->status,
                ]),
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Re-launch decomposition (regenerate).
     *
     * POST /api/projects/{project}/master-plan/regenerate
     */
    public function regenerate(Request $request, SharedProject $project): JsonResponse
    {
        if (empty($project->prd)) {
            return $this->errorResponse('NO_PRD', 'No PRD stored on this project', 422);
        }

        // Reuse the decompose logic with stored PRD
        $request->merge(['prd' => $project->prd]);

        return $this->decompose($request, $project);
    }

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
