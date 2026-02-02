<?php

use App\Http\Controllers\Api;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| All routes require authentication via Sanctum
*/

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {

    // ==================== AUTH ====================
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [Api\AuthController::class, 'logout']);
        Route::get('/me', [Api\AuthController::class, 'me']);
        Route::get('/tokens', [Api\AuthController::class, 'listTokens']);
        Route::post('/tokens', [Api\AuthController::class, 'createToken']);
        Route::delete('/tokens/{id}', [Api\AuthController::class, 'revokeToken']);
    });

    // ==================== MACHINES ====================
    Route::apiResource('machines', Api\MachineController::class);
    Route::post('machines/{machine}/regenerate-token', [Api\MachineController::class, 'regenerateToken']);
    Route::get('machines/{machine}/environment', [Api\MachineController::class, 'environment']);

    // ==================== SESSIONS ====================
    Route::get('machines/{machine}/sessions', [Api\SessionController::class, 'index']);
    Route::post('machines/{machine}/sessions', [Api\SessionController::class, 'store']);
    Route::get('sessions/{session}', [Api\SessionController::class, 'show']);
    Route::delete('sessions/{session}', [Api\SessionController::class, 'destroy']);
    Route::get('sessions/{session}/logs', [Api\SessionController::class, 'logs']);
    Route::post('sessions/{session}/attach', [Api\SessionController::class, 'attach']);
    Route::post('sessions/{session}/input', [Api\SessionController::class, 'input']);
    Route::post('sessions/{session}/resize', [Api\SessionController::class, 'resize']);

    // ==================== SHARED PROJECTS (MULTI-AGENT) ====================
    Route::get('machines/{machine}/projects', [Api\ProjectController::class, 'index']);
    Route::post('machines/{machine}/projects', [Api\ProjectController::class, 'store']);
    Route::get('projects/{project}', [Api\ProjectController::class, 'show']);
    Route::patch('projects/{project}', [Api\ProjectController::class, 'update']);
    Route::delete('projects/{project}', [Api\ProjectController::class, 'destroy']);
    Route::get('projects/{project}/stats', [Api\ProjectController::class, 'stats']);

    // ==================== CONTEXT (RAG) ====================
    Route::get('projects/{project}/context', [Api\ContextController::class, 'show']);
    Route::post('projects/{project}/context/query', [Api\ContextController::class, 'query']);
    Route::patch('projects/{project}/context', [Api\ContextController::class, 'update']);
    Route::post('projects/{project}/context/summarize', [Api\ContextController::class, 'summarize']);

    // Context Chunks
    Route::get('projects/{project}/context/chunks', [Api\ContextController::class, 'chunks']);
    Route::post('projects/{project}/context/chunks', [Api\ContextController::class, 'storeChunk']);
    Route::delete('projects/{project}/context/chunks/{chunkId}', [Api\ContextController::class, 'destroyChunk']);

    // ==================== TASKS ====================
    Route::get('projects/{project}/tasks', [Api\TaskController::class, 'index']);
    Route::post('projects/{project}/tasks', [Api\TaskController::class, 'store']);
    Route::get('projects/{project}/tasks/next-available', [Api\TaskController::class, 'nextAvailable']);
    Route::get('tasks/{task}', [Api\TaskController::class, 'show']);
    Route::patch('tasks/{task}', [Api\TaskController::class, 'update']);
    Route::delete('tasks/{task}', [Api\TaskController::class, 'destroy']);
    Route::post('tasks/{task}/claim', [Api\TaskController::class, 'claim']);
    Route::post('tasks/{task}/release', [Api\TaskController::class, 'release']);
    Route::post('tasks/{task}/complete', [Api\TaskController::class, 'complete']);

    // ==================== FILE LOCKS ====================
    Route::get('projects/{project}/locks', [Api\FileLockController::class, 'index']);
    Route::post('projects/{project}/locks', [Api\FileLockController::class, 'store']);
    Route::post('projects/{project}/locks/check', [Api\FileLockController::class, 'check']);
    Route::post('projects/{project}/locks/extend', [Api\FileLockController::class, 'extend']);
    Route::post('projects/{project}/locks/bulk', [Api\FileLockController::class, 'bulkLock']);
    Route::post('projects/{project}/locks/release', [Api\FileLockController::class, 'destroy']);
    Route::post('projects/{project}/locks/force-release', [Api\FileLockController::class, 'forceDestroy']);
    Route::post('projects/{project}/locks/release-by-instance', [Api\FileLockController::class, 'releaseByInstance']);

    // ==================== INSTANCES & ACTIVITY ====================
    Route::get('projects/{project}/instances', [Api\ProjectController::class, 'instances']);
    Route::get('projects/{project}/activity', [Api\ProjectController::class, 'activity']);
    Route::post('projects/{project}/broadcast', [Api\ProjectController::class, 'broadcast']);

});

// Public OAuth routes
Route::get('/auth/{provider}/redirect', [Api\AuthController::class, 'redirect'])
    ->where('provider', 'google|github');
Route::get('/auth/{provider}/callback', [Api\AuthController::class, 'callback'])
    ->where('provider', 'google|github');

// Health check (public)
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'data' => [
            'status' => 'ok',
            'version' => config('claudenest.version', '1.0.0'),
            'timestamp' => now()->toIso8601String(),
        ],
    ]);
});
