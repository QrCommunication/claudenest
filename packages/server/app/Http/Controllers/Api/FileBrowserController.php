<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Services\AgentGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FileBrowserController extends Controller
{
    /**
     * Browse the remote filesystem of a machine.
     *
     * GET /api/machines/{machine}/browse?path=/home/user/projects
     */
    public function browse(Request $request, Machine $machine): JsonResponse
    {
        // Ensure the machine belongs to the authenticated user
        if ($machine->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Machine does not belong to you', 403);
        }

        if ($machine->status !== 'online') {
            return $this->errorResponse('MACHINE_OFFLINE', 'Machine is not online', 422);
        }

        $path = $request->query('path', '');
        $dirsOnly = $request->boolean('dirs_only', true);
        $showHidden = $request->boolean('show_hidden', false);

        $result = AgentGateway::sendAndWait($machine->id, 'file:browse', [
            'path' => $path,
            'dirsOnly' => $dirsOnly,
            'showHidden' => $showHidden,
        ], 5);

        if ($result === null) {
            return $this->errorResponse(
                'AGENT_TIMEOUT',
                'Machine did not respond in time',
                504
            );
        }

        if (!empty($result['error'])) {
            return $this->errorResponse(
                'BROWSE_ERROR',
                $result['error'],
                422
            );
        }

        return response()->json([
            'success' => true,
            'data' => [
                'path' => $result['path'] ?? '',
                'home_path' => $result['homePath'] ?? '',
                'entries' => $result['entries'] ?? [],
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
