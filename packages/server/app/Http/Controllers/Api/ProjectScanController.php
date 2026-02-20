<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Services\AgentGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectScanController extends Controller
{
    /**
     * Scan a remote project directory via the agent.
     *
     * POST /api/machines/{machine}/projects/scan
     */
    public function scan(Request $request, Machine $machine): JsonResponse
    {
        if ($machine->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Machine does not belong to you', 403);
        }

        if ($machine->status !== 'online') {
            return $this->errorResponse('MACHINE_OFFLINE', 'Machine is not online', 422);
        }

        $validated = $request->validate([
            'path' => 'required|string|max:1024',
        ]);

        $result = AgentGateway::sendAndWait($machine->id, 'project:scan', [
            'path' => $validated['path'],
        ], 30);

        if ($result === null) {
            return $this->errorResponse(
                'AGENT_TIMEOUT',
                'Machine did not respond in time. The scan may take longer for large projects.',
                504
            );
        }

        if (!empty($result['error'])) {
            return $this->errorResponse('SCAN_ERROR', $result['error'], 422);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'project_name' => $result['projectName'] ?? '',
                'tech_stack' => $result['techStack'] ?? [],
                'has_git' => $result['hasGit'] ?? false,
                'readme' => $result['readme'] ?? null,
                'structure' => $result['structure'] ?? [],
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
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
