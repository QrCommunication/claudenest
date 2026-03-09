<?php

namespace App\Policies;

/**
 * @deprecated Use SharedTaskPolicy instead.
 * @see SharedTaskPolicy
 */
class TaskPolicy extends SharedTaskPolicy
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
    public function view(User $user, SharedTask $task): bool
    {
        return $task->project->user_id === $user->id;
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
    public function update(User $user, SharedTask $task): bool
    {
        return $task->project->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, SharedTask $task): bool
    {
        return $task->project->user_id === $user->id;
    }

    /**
     * Determine whether the user can claim the task.
     */
    public function claim(User $user, SharedTask $task): bool
    {
        return $task->project->user_id === $user->id;
    }

    /**
     * Determine whether the user can release the task.
     */
    public function release(User $user, SharedTask $task): bool
    {
        return $task->project->user_id === $user->id;
    }

    /**
     * Determine whether the user can complete the task.
     */
    public function complete(User $user, SharedTask $task): bool
    {
        return $task->project->user_id === $user->id;
    }
}
