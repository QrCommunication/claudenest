<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
*/

// Cleanup expired data daily
Schedule::call(function () {
    // Delete expired file locks
    \App\Models\FileLock::cleanupExpired();

    // Delete expired context chunks
    \App\Models\ContextChunk::cleanupExpired();

    // Delete old activity logs (30 days)
    \App\Models\ActivityLog::cleanup(30);

    // Delete old session logs (90 days)
    \App\Models\SessionLog::where('created_at', '<', now()->subDays(90))->delete();

    // Cleanup expired tokens
    \App\Models\PersonalAccessToken::cleanupExpired();

    info('ClaudeNest cleanup completed');
})->daily();

// Mark offline machines
Schedule::call(function () {
    $timeout = now()->subMinutes(2);

    \App\Models\Machine::where('status', 'online')
        ->where('last_seen_at', '<', $timeout)
        ->update(['status' => 'offline']);
})->everyMinute();

// Artisan command for manual cleanup
Artisan::command('claudenest:cleanup', function () {
    $this->info('Running ClaudeNest cleanup...');

    $locks = \App\Models\FileLock::cleanupExpired();
    $this->info("Deleted {$locks} expired file locks");

    $chunks = \App\Models\ContextChunk::cleanupExpired();
    $this->info("Deleted {$chunks} expired context chunks");

    $logs = \App\Models\ActivityLog::cleanup(30);
    $this->info("Deleted old activity logs");

    $sessionLogs = \App\Models\SessionLog::where('created_at', '<', now()->subDays(90))->delete();
    $this->info("Deleted {$sessionLogs} old session logs");

    $tokens = \App\Models\PersonalAccessToken::cleanupExpired();
    $this->info("Deleted {$tokens} expired tokens");

    $this->info('Cleanup completed!');
})->purpose('Run all ClaudeNest cleanup tasks');
