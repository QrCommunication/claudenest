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

        $middleware->api(append: [
            \App\Http\Middleware\LogApiRequests::class,
        ]);

        $middleware->alias([
            'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,
            'machine.owner' => \App\Http\Middleware\EnsureMachineOwner::class,
            'rate.limit' => \App\Http\Middleware\RateLimitApi::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'webhook/*',
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Validation errors
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

        // Authentication errors
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

        // Authorization errors
        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'AUTH_002',
                        'message' => 'Forbidden', // User authenticated but lacks permission
                    ],
                    'meta' => [
                        'timestamp' => now()->toIso8601String(),
                        'request_id' => $request->header('X-Request-ID', uniqid()),
                    ],
                ], 403);
            }
        });

        // Not found errors
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

        // Method not allowed errors
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'METHOD_NOT_ALLOWED',
                        'message' => 'Method not allowed',
                    ],
                    'meta' => [
                        'timestamp' => now()->toIso8601String(),
                        'request_id' => $request->header('X-Request-ID', uniqid()),
                    ],
                ], 405);
            }
        });

        // Database query errors
        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'MODEL_NOT_FOUND',
                        'message' => 'Resource not found',
                    ],
                    'meta' => [
                        'timestamp' => now()->toIso8601String(),
                        'request_id' => $request->header('X-Request-ID', uniqid()),
                    ],
                ], 404);
            }
        });

        // Generic exceptions for API routes
        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->is('api/*') && !config('app.debug')) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INTERNAL_ERROR',
                        'message' => 'An error occurred while processing your request',
                    ],
                    'meta' => [
                        'timestamp' => now()->toIso8601String(),
                        'request_id' => $request->header('X-Request-ID', uniqid()),
                    ],
                ], 500);
            }
        });
    })->create();
