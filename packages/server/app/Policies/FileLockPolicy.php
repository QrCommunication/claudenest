<?php

namespace App\Policies;

use App\Models\FileLock;
use App\Models\SharedProject;
use App\Models\User;

class FileLockPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, FileLock $fileLock): bool
    {
        return $fileLock->project->user_id === $user->id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, FileLock $fileLock): bool
    {
        return $fileLock->project->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, FileLock $fileLock): bool
    {
        return $fileLock->project->user_id === $user->id;
    }

    /**
     * Determine whether the user can force-release any lock on the project.
     * Only the project owner may force-release stale locks held by other instances.
     */
    public function forceRelease(User $user, SharedProject $project): bool
    {
        return $project->user_id === $user->id;
    }
}
