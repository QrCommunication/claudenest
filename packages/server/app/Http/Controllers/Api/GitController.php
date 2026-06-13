<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SharedProject;
use App\Services\AgentGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Git worktree + pull-request tracking for a shared project.
 *
 * The project's working tree lives on the agent machine, so every operation is
 * dispatched to the agent (request/response via AgentGateway::sendAndWait) where
 * git/gh run inside the same bubblewrap sandbox as the workers. No GitHub token
 * is stored server-side — the agent's own `gh` auth is reused.
 */
class GitController extends Controller
{
    /** Worktree status can run a couple of git calls — give the agent some room. */
    private const STATUS_TIMEOUT = 8;

    private const PR_LIST_TIMEOUT = 12;

    private const PR_MERGE_TIMEOUT = 60;

    /**
     * GET /api/projects/{project}/git/status
     */
    public function status(Request $request, SharedProject $project): JsonResponse
    {
        if (($machine = $this->guard($request, $project)) instanceof JsonResponse) {
            return $machine;
        }

        $result = AgentGateway::sendAndWait($machine->id, 'git:status', [
            'projectPath' => $project->project_path,
        ], self::STATUS_TIMEOUT);

        if ($result === null) {
            return $this->errorResponse('AGENT_TIMEOUT', 'Machine did not respond in time', 504);
        }
        if (! empty($result['error'])) {
            return $this->errorResponse('GIT_ERROR', $result['error'], 422);
        }

        return $this->ok($request, [
            'branch' => $result['branch'] ?? null,
            'ahead' => $result['ahead'] ?? 0,
            'behind' => $result['behind'] ?? 0,
            'clean' => $result['clean'] ?? true,
            'files' => $result['files'] ?? [],
            'remote_url' => $result['remoteUrl'] ?? null,
            'last_commit' => $result['lastCommit'] ?? null,
            'sandboxed' => $result['sandboxed'] ?? false,
        ]);
    }

    /**
     * GET /api/projects/{project}/pulls
     */
    public function pulls(Request $request, SharedProject $project): JsonResponse
    {
        if (($machine = $this->guard($request, $project)) instanceof JsonResponse) {
            return $machine;
        }

        $result = AgentGateway::sendAndWait($machine->id, 'pr:list', [
            'projectPath' => $project->project_path,
        ], self::PR_LIST_TIMEOUT);

        if ($result === null) {
            return $this->errorResponse('AGENT_TIMEOUT', 'Machine did not respond in time', 504);
        }
        if (! empty($result['error'])) {
            return $this->errorResponse('PR_LIST_ERROR', $result['error'], 422);
        }

        return $this->ok($request, [
            'pulls' => $result['prs'] ?? [],
            'sandboxed' => $result['sandboxed'] ?? false,
        ]);
    }

    /**
     * POST /api/projects/{project}/pulls/{number}/merge
     */
    public function merge(Request $request, SharedProject $project, int $number): JsonResponse
    {
        if (($machine = $this->guard($request, $project)) instanceof JsonResponse) {
            return $machine;
        }

        $validated = $request->validate([
            'method' => 'sometimes|in:squash,merge,rebase',
            'delete_branch' => 'sometimes|boolean',
        ]);

        $result = AgentGateway::sendAndWait($machine->id, 'pr:merge', [
            'projectPath' => $project->project_path,
            'number' => $number,
            'method' => $validated['method'] ?? 'squash',
            'deleteBranch' => $validated['delete_branch'] ?? true,
        ], self::PR_MERGE_TIMEOUT);

        if ($result === null) {
            return $this->errorResponse('AGENT_TIMEOUT', 'Machine did not respond in time', 504);
        }
        if (empty($result['merged'])) {
            return $this->errorResponse('PR_MERGE_ERROR', $result['error'] ?? 'Merge failed', 422);
        }

        return $this->ok($request, [
            'merged' => true,
            'number' => $number,
            'sandboxed' => $result['sandboxed'] ?? false,
        ]);
    }

    /**
     * Ownership + machine-online guard. Returns the online Machine, or a
     * JsonResponse error to return as-is.
     */
    private function guard(Request $request, SharedProject $project): mixed
    {
        if ($project->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Project does not belong to you', 403);
        }

        $machine = $project->machine;
        if (! $machine || $machine->status !== 'online') {
            return $this->errorResponse('MACHINE_OFFLINE', 'Machine is not online', 422);
        }

        return $machine;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function ok(Request $request, array $data): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }
}
