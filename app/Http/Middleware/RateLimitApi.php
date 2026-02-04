<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class RateLimitApi
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $limit = '60'): Response
    {
        $key = $request->user()?->id ?? $request->ip();
        $maxAttempts = (int) $limit;

        if (RateLimiter::tooManyAttempts('api:' . $key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn('api:' . $key);

            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'RAT_001',
                    'message' => 'Rate limit exceeded. Try again in ' . $seconds . ' seconds.',
                ],
                'meta' => [
                    'retry_after' => $seconds,
                    'timestamp' => now()->toIso8601String(),
                    'request_id' => $request->header('X-Request-ID', uniqid()),
                ],
            ], 429)->withHeaders([
                'Retry-After' => $seconds,
                'X-RateLimit-Limit' => $maxAttempts,
                'X-RateLimit-Remaining' => 0,
            ]);
        }

        RateLimiter::hit('api:' . $key);

        $response = $next($request);

        // Add rate limit headers
        $response->headers->set('X-RateLimit-Limit', $maxAttempts);
        $response->headers->set('X-RateLimit-Remaining', RateLimiter::remaining('api:' . $key, $maxAttempts));

        return $response;
    }
}
