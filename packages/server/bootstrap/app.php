<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        $middleware->alias([
            'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,
            'machine.owner' => \App\Http\Middleware\EnsureMachineOwner::class,
            'rate.limit' => \App\Http\Middleware\RateLimitApi::class,
        ]);

        $middleware->redirectGuestsTo(fn ($request) => $request->is('api/*') ? null : '/login');

        $middleware->validateCsrfTokens(except: [
            'webhook/*',
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'VAL_001',
                        'message' => 'Validation failed',
                        'details' => $e->errors(),
                    ],
                    'meta' => [
                        'timestamp' => now()->toIso8601String(),
                        'request_id' => $request->header('X-Request-ID', uniqid()),
                    ],
                ], 422);
            }
        });

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'AUTH_001',
                        'message' => 'Unauthenticated',
                    ],
                    'meta' => [
                        'timestamp' => now()->toIso8601String(),
                        'request_id' => $request->header('X-Request-ID', uniqid()),
                    ],
                ], 401);
            }
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'NOT_FOUND',
                        'message' => 'Resource not found',
                    ],
                    'meta' => [
                        'timestamp' => now()->toIso8601String(),
                        'request_id' => $request->header('X-Request-ID', uniqid()),
                    ],
                ], 404);
            }
        });
    })->create();
