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

    /**
     * Determine whether the user can start the MCP server.
     */
    public function start(User $user, MCPServer $mcpServer): bool
    {
        return $mcpServer->machine->user_id === $user->id;
    }

    /**
     * Determine whether the user can stop the MCP server.
     */
    public function stop(User $user, MCPServer $mcpServer): bool
    {
        return $mcpServer->machine->user_id === $user->id;
    }

    /**
     * Determine whether the user can execute tools on the MCP server.
     */
    public function execute(User $user, MCPServer $mcpServer): bool
    {
        return $mcpServer->machine->user_id === $user->id;
    }
}
