<?php

use App\Http\Controllers\Web\DocumentationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| These routes serve the Vue.js SPA for all non-API routes.
*/

// Landing page (public) - serves Vue SPA
Route::get('/', function () {
    return view('app');
});

// API info endpoint (for health checks)
Route::get('/api-info', function () {
    return response()->json([
        'name' => 'ClaudeNest Server',
        'version' => config('claudenest.version', '1.0.0'),
        'status' => 'running',
        'docs' => '/docs',
    ]);
});

// OpenAPI specification
Route::get('/openapi.yaml', [DocumentationController::class, 'openapi']);

// OAuth callback handling (redirects to SPA with token)
Route::get('/auth/callback', function () {
    return view('app');
});

// Documentation routes
Route::prefix('docs')->group(function () {
    Route::get('/', [DocumentationController::class, 'index']);
    Route::get('/authentication', [DocumentationController::class, 'authentication']);
    Route::get('/machines', [DocumentationController::class, 'machines']);
    Route::get('/sessions', [DocumentationController::class, 'sessions']);
    Route::get('/projects', [DocumentationController::class, 'projects']);
    Route::get('/tasks', [DocumentationController::class, 'tasks']);
    Route::get('/skills', [DocumentationController::class, 'skills']);
    Route::get('/mcp', [DocumentationController::class, 'mcp']);
    Route::get('/websocket', [DocumentationController::class, 'websocket']);
    Route::get('/errors', [DocumentationController::class, 'errors']);
    Route::get('/sdks', [DocumentationController::class, 'sdks']);
    Route::get('/changelog', [DocumentationController::class, 'changelog']);
    Route::get('/terms', [DocumentationController::class, 'index']);
    Route::get('/privacy', [DocumentationController::class, 'index']);
});

// Serve Vue SPA for all other routes (dashboard, login, etc.)
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
