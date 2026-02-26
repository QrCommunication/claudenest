<?php

namespace App\Http\Middleware;

use App\Models\Machine;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Pre-authenticate requests using machine tokens (mn_xxx).
 *
 * Runs BEFORE Sanctum. If the bearer token starts with "mn_", it resolves
 * the machine, authenticates the owning user, and lets the request through.
 * If the token is NOT a machine token, it passes through to Sanctum.
 */
class AuthenticateAgentToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        // Only intercept machine tokens (mn_ prefix), let Sanctum handle the rest
        if (!$token || !str_starts_with($token, 'mn_')) {
            return $next($request);
        }

        // Find machine by token hash
        $tokenHash = hash('sha256', $token);
        $machine = Machine::where('token_hash', $tokenHash)->first();

        if (!$machine) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_AGENT',
                    'message' => 'Invalid machine token',
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 401);
        }

        // Authenticate as the machine's owner
        $user = $machine->user;
        if (!$user) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_AGENT',
                    'message' => 'Machine owner not found',
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 401);
        }

        Auth::setUser($user);

        // Attach machine to request for controller use
        $request->attributes->set('authenticated_machine', $machine);

        // Touch last_seen (throttled to avoid excessive DB writes)
        if (!$machine->last_seen_at || $machine->last_seen_at->lt(now()->subMinute())) {
            $machine->update(['last_seen_at' => now()]);
        }

        return $next($request);
    }
}
