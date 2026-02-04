<?php

namespace App\Http\Middleware;

use App\Models\Machine;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMachineOwner
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $machineId = $request->route('machine') ?? $request->route('machineId');

        if (!$machineId) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'MCH_001',
                    'message' => 'Machine ID not provided',
                ],
                'meta' => [
                    'timestamp' => now()->toIso8601String(),
                    'request_id' => $request->header('X-Request-ID', uniqid()),
                ],
            ], 400);
        }

        $machine = Machine::forUser($request->user()->id)->find($machineId);

        if (!$machine) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'MCH_001',
                    'message' => 'Machine not found',
                ],
                'meta' => [
                    'timestamp' => now()->toIso8601String(),
                    'request_id' => $request->header('X-Request-ID', uniqid()),
                ],
            ], 404);
        }

        // Attach machine to request for later use
        $request->merge(['_machine' => $machine]);

        return $next($request);
    }
}
