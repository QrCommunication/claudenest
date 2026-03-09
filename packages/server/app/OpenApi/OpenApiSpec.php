<?php

namespace App\OpenApi;

/**
 * @OA\Info(
 *     title="ClaudeNest API",
 *     version="1.1.0",
 *     description="ClaudeNest is a remote Claude Code orchestration platform that enables remote control of Claude Code instances from anywhere, multi-agent coordination, context RAG with pgvector, real-time WebSocket communication, file locking for conflict prevention, and task coordination with atomic claiming.",
 *     @OA\Contact(
 *         name="ClaudeNest Support",
 *         email="support@claudenest.io",
 *         url="https://claudenest.io"
 *     ),
 *     @OA\License(
 *         name="Proprietary",
 *         url="https://claudenest.io/terms"
 *     )
 * )
 *
 * @OA\Server(
 *     url="https://claudenest.io/api",
 *     description="Production server"
 * )
 *
 * @OA\Server(
 *     url="http://localhost/api",
 *     description="Development server"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT",
 *     description="Laravel Sanctum token-based authentication. Obtain a token via POST /auth/login and pass it as a Bearer token in the Authorization header."
 * )
 *
 * @OA\Tag(
 *     name="Auth",
 *     description="Authentication & token management. Handles login, registration, logout, token refresh, and OAuth flows (Google, GitHub)."
 * )
 *
 * @OA\Tag(
 *     name="Machines",
 *     description="Machine registration & management. Register remote machines running the ClaudeNest agent, manage their tokens, and monitor their status."
 * )
 *
 * @OA\Tag(
 *     name="Sessions",
 *     description="Claude Code session management. Create, attach to, and terminate interactive or headless Claude Code PTY sessions on registered machines."
 * )
 *
 * @OA\Tag(
 *     name="Projects",
 *     description="Shared project management. Create and manage shared project contexts that enable multi-agent coordination on a single codebase."
 * )
 *
 * @OA\Tag(
 *     name="Context",
 *     description="RAG context management. Add, query, and manage pgvector-powered context chunks for retrieval-augmented generation across Claude instances."
 * )
 *
 * @OA\Tag(
 *     name="Tasks",
 *     description="Task coordination. Create, claim, release, and complete tasks using an atomic claiming system to coordinate work between multiple Claude instances."
 * )
 *
 * @OA\Tag(
 *     name="FileLocks",
 *     description="Distributed file locking. Acquire, check, extend, and release file locks to prevent conflicts when multiple agents work on the same project files."
 * )
 *
 * @OA\Tag(
 *     name="Credentials",
 *     description="Claude API credential management. Store, retrieve, and manage encrypted Claude API keys and OAuth tokens (AES-256-CBC) with support for validation and token refresh."
 * )
 *
 * @OA\Tag(
 *     name="Skills",
 *     description="Skill discovery & management. Register, update, toggle, and manage skills discovered by the agent on remote machines."
 * )
 *
 * @OA\Tag(
 *     name="MCP",
 *     description="Model Context Protocol servers. Register, start, stop, and manage MCP servers, and execute MCP tools available on registered machines."
 * )
 *
 * @OA\Tag(
 *     name="Commands",
 *     description="Discovered commands. Register, search, execute, and manage commands discovered by the agent on remote machines."
 * )
 *
 * @OA\Tag(
 *     name="Pairing",
 *     description="Machine pairing flow. Initiate and complete the pairing handshake between a new agent machine and the ClaudeNest server."
 * )
 *
 * @OA\Tag(
 *     name="System",
 *     description="Health check & system info. Retrieve server health status, version information, and runtime diagnostics."
 * )
 */
class OpenApiSpec
{
    // This class serves solely as a container for OpenAPI top-level annotations.
    // All route-level annotations are defined on their respective controllers.
}
