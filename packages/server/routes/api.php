<?php

use App\Http\Controllers\Api;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| All routes require authentication via Sanctum except public routes below
*/

// ==================== PUBLIC AUTH ROUTES ====================
Route::prefix('auth')->group(function () {
    Route::post('/login', [Api\AuthController::class, 'login']);
    Route::post('/register', [Api\AuthController::class, 'register']);
    Route::post('/forgot-password', [Api\AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [Api\AuthController::class, 'resetPassword']);
    Route::post('/magic-link', [Api\AuthController::class, 'magicLink']);
    Route::post('/magic-link/verify', [Api\AuthController::class, 'magicLinkVerify']);
});

// Public OAuth routes
Route::get('/auth/{provider}/redirect', [Api\AuthController::class, 'redirect'])
    ->where('provider', 'google|github');
Route::get('/auth/{provider}/callback', [Api\AuthController::class, 'callback'])
    ->where('provider', 'google|github');

// ==================== PAIRING (PUBLIC) ====================
// Agent initiates pairing by registering its code, then polls for completion.
// Rate-limited to prevent abuse on unauthenticated endpoints.
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/pairing/initiate', [Api\PairingController::class, 'initiate']);
    Route::get('/pairing/{code}', [Api\PairingController::class, 'poll']);
});

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {

    // ==================== DASHBOARD ====================
    Route::get('dashboard/stats', [Api\DashboardController::class, 'stats']);

    // ==================== AUTH ====================
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [Api\AuthController::class, 'logout']);
        Route::get('/me', [Api\AuthController::class, 'me']);
        Route::post('/refresh', [Api\AuthController::class, 'refresh']);
        Route::get('/tokens', [Api\AuthController::class, 'listTokens']);
        Route::post('/tokens', [Api\AuthController::class, 'createToken']);
        Route::delete('/tokens/{id}', [Api\AuthController::class, 'revokeToken']);
    });

    // ==================== PAIRING (AUTHENTICATED) ====================
    Route::post('/pairing/{code}/complete', [Api\PairingController::class, 'complete']);

    // ==================== CREDENTIALS ====================
    Route::prefix('credentials')->group(function () {
        Route::get('/', [Api\CredentialController::class, 'index']);
        Route::post('/', [Api\CredentialController::class, 'store']);
        Route::get('/{id}', [Api\CredentialController::class, 'show']);
        Route::patch('/{id}', [Api\CredentialController::class, 'update']);
        Route::delete('/{id}', [Api\CredentialController::class, 'destroy']);
        Route::post('/{id}/test', [Api\CredentialController::class, 'test']);
        Route::post('/{id}/refresh', [Api\CredentialController::class, 'refresh']);
        Route::post('/{id}/capture', [Api\CredentialController::class, 'capture']);
        Route::patch('/{id}/default', [Api\CredentialController::class, 'setDefault']);
    });

    // ==================== MACHINES ====================
    Route::apiResource('machines', Api\MachineController::class);
    Route::post('machines/{machine}/regenerate-token', [Api\MachineController::class, 'regenerateToken']);
    Route::get('machines/{machine}/environment', [Api\MachineController::class, 'environment']);
    Route::post('machines/{machine}/wake', [Api\MachineController::class, 'wake']);

    // ==================== FILE BROWSER ====================
    Route::get('machines/{machine}/browse', [Api\FileBrowserController::class, 'browse'])
        ->middleware('throttle:30,1');

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

    // ==================== SKILLS ====================
    Route::get('machines/{machine}/skills', [Api\SkillsController::class, 'index']);
    Route::get('machines/{machine}/skills/{path}', [Api\SkillsController::class, 'show']);
    Route::post('machines/{machine}/skills', [Api\SkillsController::class, 'store']);
    Route::patch('machines/{machine}/skills/{path}', [Api\SkillsController::class, 'update']);
    Route::post('machines/{machine}/skills/{path}/toggle', [Api\SkillsController::class, 'toggle']);
    Route::delete('machines/{machine}/skills/{path}', [Api\SkillsController::class, 'destroy']);
    Route::post('machines/{machine}/skills/bulk', [Api\SkillsController::class, 'bulkUpdate']);

    // ==================== MCP SERVERS ====================
    Route::get('machines/{machine}/mcp', [Api\MCPController::class, 'index']);
    Route::get('machines/{machine}/mcp/all-tools', [Api\MCPController::class, 'allTools']);
    Route::get('machines/{machine}/mcp/{name}', [Api\MCPController::class, 'show']);
    Route::post('machines/{machine}/mcp', [Api\MCPController::class, 'store']);
    Route::patch('machines/{machine}/mcp/{name}', [Api\MCPController::class, 'update']);
    Route::post('machines/{machine}/mcp/{name}/start', [Api\MCPController::class, 'start']);
    Route::post('machines/{machine}/mcp/{name}/stop', [Api\MCPController::class, 'stop']);
    Route::get('machines/{machine}/mcp/{name}/tools', [Api\MCPController::class, 'tools']);
    Route::post('machines/{machine}/mcp/{name}/execute', [Api\MCPController::class, 'executeTool']);
    Route::delete('machines/{machine}/mcp/{name}', [Api\MCPController::class, 'destroy']);

    // ==================== DISCOVERED COMMANDS ====================
    Route::get('machines/{machine}/commands', [Api\CommandsController::class, 'index']);
    Route::get('machines/{machine}/commands/search', [Api\CommandsController::class, 'search']);
    Route::get('machines/{machine}/commands/{id}', [Api\CommandsController::class, 'show']);
    Route::post('machines/{machine}/commands', [Api\CommandsController::class, 'store']);
    Route::post('machines/{machine}/commands/bulk', [Api\CommandsController::class, 'bulkStore']);
    Route::post('machines/{machine}/commands/{id}/execute', [Api\CommandsController::class, 'execute']);
    Route::delete('machines/{machine}/commands/{id}', [Api\CommandsController::class, 'destroy']);
    Route::delete('machines/{machine}/commands', [Api\CommandsController::class, 'clear']);

});

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
