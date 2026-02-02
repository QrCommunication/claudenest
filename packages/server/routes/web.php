<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return response()->json([
        'name' => 'ClaudeNest Server',
        'version' => config('claudenest.version', '1.0.0'),
        'status' => 'running',
        'docs' => '/docs',
    ]);
});

// Dashboard SPA fallback
Route::get('/dashboard{any}', function () {
    return view('app');
})->where('any', '.*');
