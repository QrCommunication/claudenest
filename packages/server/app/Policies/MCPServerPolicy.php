<?php

namespace App\Policies;

use App\Models\MCPServer;
use App\Models\User;

class MCPServerPolicy
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
    public function view(User $user, MCPServer $mcpServer): bool
    {
        return $mcpServer->machine->user_id === $user->id;
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
    public function update(User $user, MCPServer $mcpServer): bool
    {
        return $mcpServer->machine->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, MCPServer $mcpServer): bool
    {
        return $mcpServer->machine->user_id === $user->id;
    }
}
