<?php

use App\Models\Session;
use App\Models\SharedProject;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

// User private channel
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (string) $user->id === (string) $id;
});

// Machine channel (for agents)
Broadcast::channel('machines.{machineId}', function ($user, $machineId) {
    return $user->machines()->where('id', $machineId)->exists();
});

// Session channel (for terminal I/O)
Broadcast::channel('sessions.{sessionId}', function ($user, $sessionId) {
    $session = Session::forUser($user->id)->find($sessionId);
    return !is_null($session);
});

// Project channel (for multi-agent coordination)
Broadcast::channel('projects.{projectId}', function ($user, $projectId) {
    $project = SharedProject::forUser($user->id)->find($projectId);
    return !is_null($project);
});

// Project admin channel (for admin-level operations)
Broadcast::channel('projects.{projectId}.admin', function ($user, $projectId) {
    $project = SharedProject::forUser($user->id)->find($projectId);
    return !is_null($project) && $project->user_id === $user->id;
});

// Presence channel for active instances
Broadcast::channel('projects.{projectId}.presence', function ($user, $projectId) {
    $project = SharedProject::forUser($user->id)->find($projectId);
    if ($project) {
        return [
            'id' => $user->id,
            'name' => $user->name,
        ];
    }
    return false;
});
