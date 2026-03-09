<?php

namespace Database\Seeders;

use App\Models\ClaudeInstance;
use App\Models\ContextChunk;
use App\Models\DiscoveredCommand;
use App\Models\Machine;
use App\Models\MCPServer;
use App\Models\Session;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * This seeder creates comprehensive demo data for ClaudeNest showcasing
     * all major features: multi-agent coordination, context RAG, task management,
     * MCP servers, skills, and more.
     */
    public function run(): void
    {
        $this->command->info('🌱 Seeding demo data for ClaudeNest...');

        // 1. Create Demo User
        $user = $this->createDemoUser();
        $this->command->info('✓ Created demo user');

        // 2. Create Machines
        [$machineMac, $machineLinux] = $this->createMachines($user);
        $this->command->info('✓ Created 2 machines');

        // 3. Create Shared Project
        $project = $this->createSharedProject($user, $machineMac);
        $this->command->info('✓ Created shared project');

        // 4. Create Context Chunks
        $this->createContextChunks($project);
        $this->command->info('✓ Created 7 context chunks');

        // 5. Create Tasks
        $tasks = $this->createSharedTasks($project);
        $this->command->info('✓ Created 5 shared tasks');

        // 6. Create Claude Instances
        [$instance1, $instance2] = $this->createClaudeInstances($project, $machineMac, $tasks);
        $this->command->info('✓ Created 2 Claude instances');

        // 7. Create Sessions
        $this->createSessions($user, $machineMac, [$instance1, $instance2]);
        $this->command->info('✓ Created 2 sessions');

        // 8. Create Skills
        $this->createSkills($machineMac);
        $this->command->info('✓ Created 3 skills');

        // 9. Create MCP Servers
        $this->createMCPServers($machineMac);
        $this->command->info('✓ Created 2 MCP servers');

        // 10. Create Discovered Commands
        $this->createDiscoveredCommands($machineMac);
        $this->command->info('✓ Created 5 discovered commands');

        $this->command->info('');
        $this->command->info('🎉 Demo data seeded successfully!');
        $this->command->info('');
        $this->command->info('📝 Demo Credentials:');
        $this->command->info('   Email: demo@claudenest.com');
        $this->command->info('   Password: password');
        $this->command->info('');
    }

    /**
     * Create demo user.
     */
    private function createDemoUser(): User
    {
        // Check if demo user already exists
        $user = User::where('email', 'demo@claudenest.com')->first();

        if ($user) {
            $this->command->warn('Demo user already exists, skipping...');
            return $user;
        }

        return User::create([
            'name' => 'Demo User',
            'email' => 'demo@claudenest.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'role' => 'user',
        ]);
    }

    /**
     * Create demo machines.
     */
    private function createMachines(User $user): array
    {
        // Machine 1: MacBook Pro (Online)
        $machineMac = Machine::create([
            'user_id' => $user->id,
            'name' => 'MacBook Pro',
            'token_hash' => hash('sha256', 'demo-token-mac'),
            'platform' => 'darwin',
            'hostname' => 'demo-macbook.local',
            'arch' => 'arm64',
            'node_version' => 'v20.11.0',
            'agent_version' => '1.0.0',
            'claude_version' => '0.8.0',
            'claude_path' => '/usr/local/bin/claude',
            'status' => 'online',
            'last_seen_at' => now(),
            'connected_at' => now()->subHours(2),
            'capabilities' => [
                'pty',
                'context_rag',
                'mcp',
                'skills',
                'file_locks',
                'task_coordination',
            ],
            'max_sessions' => 10,
        ]);

        // Machine 2: Ubuntu Server (Offline)
        $machineLinux = Machine::create([
            'user_id' => $user->id,
            'name' => 'Ubuntu Server',
            'token_hash' => hash('sha256', 'demo-token-linux'),
            'platform' => 'linux',
            'hostname' => 'demo-ubuntu.local',
            'arch' => 'x64',
            'node_version' => 'v20.10.0',
            'agent_version' => '1.0.0',
            'claude_version' => '0.8.0',
            'claude_path' => '/usr/bin/claude',
            'status' => 'offline',
            'last_seen_at' => now()->subHours(24),
            'connected_at' => now()->subDays(2),
            'capabilities' => [
                'pty',
                'context_rag',
                'skills',
            ],
            'max_sessions' => 5,
        ]);

        return [$machineMac, $machineLinux];
    }

    /**
     * Create shared project.
     */
    private function createSharedProject(User $user, Machine $machine): SharedProject
    {
        return SharedProject::create([
            'user_id' => $user->id,
            'machine_id' => $machine->id,
            'name' => 'E-commerce API',
            'project_path' => '/Users/demo/projects/ecommerce-api',
            'summary' => 'A modern RESTful API for e-commerce platform built with Node.js, Express, and PostgreSQL. Handles products, orders, users, payments, and inventory management.',
            'architecture' => 'Microservices architecture with API Gateway pattern. Main services: Authentication (JWT), Product Catalog, Order Management, Payment Processing (Stripe integration), and Inventory tracking. Uses Redis for caching and RabbitMQ for async operations.',
            'conventions' => 'Follow Airbnb JavaScript style guide. Use async/await for asynchronous code. API versioning with /api/v1 prefix. RESTful naming conventions. Comprehensive error handling with custom error classes. Unit tests with Jest, integration tests with Supertest.',
            'current_focus' => 'Implementing real-time inventory updates with WebSocket notifications. Refactoring payment service to support multiple payment providers.',
            'recent_changes' => 'Added Redis caching layer for product catalog (30% performance improvement). Implemented rate limiting middleware. Fixed critical bug in order total calculation.',
            'total_tokens' => 42500,
            'max_tokens' => 100000,
            'settings' => [
                'maxContextTokens' => 8000,
                'summarizeThreshold' => 0.8,
                'contextRetentionDays' => 30,
                'taskTimeoutMinutes' => 60,
                'lockTimeoutMinutes' => 30,
                'broadcastLevel' => 'all',
            ],
        ]);
    }

    /**
     * Create context chunks for the project.
     */
    private function createContextChunks(SharedProject $project): void
    {
        $chunks = [
            // Code context
            [
                'content' => "The authentication middleware validates JWT tokens from the Authorization header. It uses jsonwebtoken library with RS256 algorithm. Public/private key pairs are stored in /config/keys. Token expiration is set to 24 hours with refresh tokens lasting 7 days. The middleware attaches user object to req.user for downstream handlers.",
                'type' => 'code',
                'importance_score' => 0.9,
                'files' => ['src/middleware/auth.js', 'src/utils/jwt.js'],
            ],
            // Documentation context
            [
                'content' => "API documentation is auto-generated using Swagger/OpenAPI 3.0. Endpoint definitions are in /docs/swagger.yaml. Access at /api-docs endpoint. All endpoints require authentication except /auth/login and /auth/register. Use Bearer token authentication.",
                'type' => 'documentation',
                'importance_score' => 0.7,
                'files' => ['docs/swagger.yaml', 'src/routes/index.js'],
            ],
            // Architecture decision
            [
                'content' => "DECISION: Chose PostgreSQL over MongoDB for data consistency and complex joins. Products have many-to-many relationship with categories. Orders have one-to-many with line items. Using Sequelize ORM for migrations and queries. Connection pooling configured with max 20 connections.",
                'type' => 'decision',
                'importance_score' => 0.85,
                'files' => ['src/models/index.js', 'config/database.js'],
            ],
            // Performance context
            [
                'content' => "Product catalog queries were optimized by adding Redis caching. Cache key pattern: product:{id} for individual products, products:list:{page}:{filters} for lists. TTL set to 1 hour. Cache invalidation on product updates/deletes. Reduced average response time from 450ms to 120ms.",
                'type' => 'summary',
                'importance_score' => 0.8,
                'files' => ['src/services/product.service.js', 'src/cache/redis.js'],
            ],
            // Testing context
            [
                'content' => "Test suite includes 247 unit tests and 89 integration tests. Coverage at 82%. Mock external services (Stripe, email) in tests. Use test database for integration tests. Run 'npm test' for unit tests, 'npm run test:integration' for integration tests. CI pipeline runs both on every PR.",
                'type' => 'documentation',
                'importance_score' => 0.75,
                'files' => ['tests/', 'jest.config.js', '.github/workflows/ci.yml'],
            ],
            // Security context
            [
                'content' => "Security measures: bcrypt for password hashing (10 rounds), helmet.js for HTTP headers, express-rate-limit for API rate limiting (100 requests/15min), CORS configured for frontend domain, SQL injection prevented by Sequelize parameterized queries, XSS protection via input sanitization.",
                'type' => 'architecture',
                'importance_score' => 0.95,
                'files' => ['src/middleware/security.js', 'src/utils/validation.js'],
            ],
            // Recent change
            [
                'content' => "Fixed critical bug in order total calculation. Issue: discount codes were applied after tax calculation instead of before, causing incorrect totals. Solution: Refactored OrderService.calculateTotal() to apply discounts first, then calculate tax on discounted amount. Added comprehensive tests for edge cases.",
                'type' => 'task_completion',
                'importance_score' => 0.9,
                'files' => ['src/services/order.service.js', 'tests/services/order.service.test.js'],
            ],
        ];

        foreach ($chunks as $chunkData) {
            ContextChunk::create([
                'project_id' => $project->id,
                'content' => $chunkData['content'],
                'type' => $chunkData['type'],
                'importance_score' => $chunkData['importance_score'],
                'files' => $chunkData['files'],
                'expires_at' => now()->addDays(30),
            ]);
        }
    }

    /**
     * Create shared tasks for the project.
     */
    private function createSharedTasks(SharedProject $project): array
    {
        $tasks = [];

        // Task 1: Completed
        $tasks[] = SharedTask::create([
            'project_id' => $project->id,
            'title' => 'Implement Redis caching for product catalog',
            'description' => 'Add Redis caching layer to product service to improve query performance. Cache individual products and product lists with appropriate TTL and invalidation strategy.',
            'priority' => 'high',
            'status' => 'done',
            'assigned_to' => 'claude-instance-001',
            'claimed_at' => now()->subHours(3),
            'completed_at' => now()->subHours(1),
            'files' => ['src/services/product.service.js', 'src/cache/redis.js'],
            'estimated_tokens' => 8000,
            'completion_summary' => 'Successfully implemented Redis caching with 30% performance improvement. Added cache invalidation on updates. Comprehensive tests added.',
            'files_modified' => ['src/services/product.service.js', 'src/cache/redis.js', 'tests/services/product.cache.test.js'],
            'created_by' => 'claude-instance-001',
        ]);

        // Task 2: In Progress
        $tasks[] = SharedTask::create([
            'project_id' => $project->id,
            'title' => 'Add WebSocket support for real-time inventory updates',
            'description' => 'Implement WebSocket server using Socket.io to push real-time inventory updates to connected clients. Emit events when inventory changes due to orders or restocking.',
            'priority' => 'high',
            'status' => 'in_progress',
            'assigned_to' => 'claude-instance-002',
            'claimed_at' => now()->subMinutes(45),
            'files' => ['src/services/inventory.service.js', 'src/websocket/server.js'],
            'estimated_tokens' => 12000,
            'created_by' => 'claude-instance-002',
        ]);

        // Task 3: Pending with high priority
        $tasks[] = SharedTask::create([
            'project_id' => $project->id,
            'title' => 'Refactor payment service for multi-provider support',
            'description' => 'Abstract payment processing to support multiple payment providers (Stripe, PayPal, Square). Create PaymentProvider interface and implement adapter pattern. Update order service to use new abstraction.',
            'priority' => 'critical',
            'status' => 'pending',
            'dependencies' => [],
            'files' => ['src/services/payment/', 'src/services/order.service.js'],
            'estimated_tokens' => 15000,
            'created_by' => 'system',
        ]);

        // Task 4: Pending with dependency
        $task3Id = $tasks[2]->id;
        $tasks[] = SharedTask::create([
            'project_id' => $project->id,
            'title' => 'Add PayPal integration',
            'description' => 'Implement PayPal payment provider adapter using the new payment abstraction. Handle OAuth flow, payment processing, and webhooks for payment status updates.',
            'priority' => 'medium',
            'status' => 'pending',
            'dependencies' => [$task3Id],
            'files' => ['src/services/payment/providers/paypal.provider.js'],
            'estimated_tokens' => 10000,
            'created_by' => 'system',
        ]);

        // Task 5: Pending low priority
        $tasks[] = SharedTask::create([
            'project_id' => $project->id,
            'title' => 'Improve API documentation with examples',
            'description' => 'Enhance Swagger documentation by adding request/response examples for all endpoints. Include error response examples and authentication flow documentation.',
            'priority' => 'low',
            'status' => 'pending',
            'files' => ['docs/swagger.yaml'],
            'estimated_tokens' => 5000,
            'created_by' => 'system',
        ]);

        return $tasks;
    }

    /**
     * Create Claude instances.
     */
    private function createClaudeInstances(SharedProject $project, Machine $machine, array $tasks): array
    {
        // Instance 1: Active, working on a task
        $instance1 = ClaudeInstance::create([
            'id' => 'claude-instance-001',
            'project_id' => $project->id,
            'machine_id' => $machine->id,
            'status' => 'idle',
            'current_task_id' => null,
            'context_tokens' => 5200,
            'max_context_tokens' => 8000,
            'tasks_completed' => 1,
            'connected_at' => now()->subHours(2),
            'last_activity_at' => now()->subMinutes(5),
        ]);

        // Instance 2: Busy working on current task
        $instance2 = ClaudeInstance::create([
            'id' => 'claude-instance-002',
            'project_id' => $project->id,
            'machine_id' => $machine->id,
            'status' => 'busy',
            'current_task_id' => $tasks[1]->id, // WebSocket task
            'context_tokens' => 6800,
            'max_context_tokens' => 8000,
            'tasks_completed' => 0,
            'connected_at' => now()->subHour(),
            'last_activity_at' => now()->subSeconds(30),
        ]);

        return [$instance1, $instance2];
    }

    /**
     * Create sessions.
     */
    private function createSessions(User $user, Machine $machine, array $instances): void
    {
        // Session 1: Running session for instance 1
        Session::create([
            'machine_id' => $machine->id,
            'user_id' => $user->id,
            'mode' => 'interactive',
            'project_path' => '/Users/demo/projects/ecommerce-api',
            'initial_prompt' => 'Review the codebase and suggest performance improvements',
            'status' => 'running',
            'pid' => 12345,
            'pty_size' => ['cols' => 120, 'rows' => 40],
            'total_tokens' => 5200,
            'total_cost' => 0.52,
            'started_at' => now()->subHours(2),
        ]);

        // Associate with instance 1
        $instances[0]->update(['session_id' => Session::latest()->first()->id]);

        // Session 2: Completed session
        Session::create([
            'machine_id' => $machine->id,
            'user_id' => $user->id,
            'mode' => 'headless',
            'project_path' => '/Users/demo/projects/ecommerce-api',
            'initial_prompt' => 'Implement Redis caching for product catalog',
            'status' => 'completed',
            'pid' => 12340,
            'exit_code' => 0,
            'pty_size' => ['cols' => 120, 'rows' => 40],
            'total_tokens' => 8150,
            'total_cost' => 0.82,
            'started_at' => now()->subHours(3),
            'completed_at' => now()->subHour(),
        ]);
    }

    /**
     * Create skills for machine.
     */
    private function createSkills(Machine $machine): void
    {
        // Skill 1: Code Generation (Enabled)
        Skill::create([
            'machine_id' => $machine->id,
            'name' => 'code-generation',
            'display_name' => 'AI Code Generation',
            'description' => 'Generate code snippets, functions, and entire modules based on natural language descriptions',
            'category' => 'general',
            'path' => '~/.claude/skills/code-generation',
            'version' => '1.2.0',
            'enabled' => true,
            'config' => [
                'languages' => ['javascript', 'typescript', 'python', 'go'],
                'style' => 'functional',
                'includeTests' => true,
            ],
            'tags' => ['code', 'ai', 'generation'],
            'examples' => [
                'Create a REST API endpoint for user authentication',
                'Generate a React component for a product card',
            ],
        ]);

        // Skill 2: Debugging Assistant (Enabled)
        Skill::create([
            'machine_id' => $machine->id,
            'name' => 'debugging-assistant',
            'display_name' => 'Debugging Assistant',
            'description' => 'Analyze error messages, stack traces, and logs to identify and suggest fixes for bugs',
            'category' => 'general',
            'path' => '~/.claude/skills/debugging',
            'version' => '1.0.5',
            'enabled' => true,
            'config' => [
                'analyzeStackTraces' => true,
                'suggestFixes' => true,
                'checkCommonIssues' => true,
            ],
            'tags' => ['debugging', 'errors', 'troubleshooting'],
            'examples' => [
                'Analyze this error: TypeError: Cannot read property \'name\' of undefined',
                'Debug slow database queries',
            ],
        ]);

        // Skill 3: Test Generator (Disabled)
        Skill::create([
            'machine_id' => $machine->id,
            'name' => 'test-generator',
            'display_name' => 'Test Generator',
            'description' => 'Generate unit tests, integration tests, and test suites for existing code',
            'category' => 'general',
            'path' => '~/.claude/skills/test-generator',
            'version' => '0.9.0',
            'enabled' => false,
            'config' => [
                'frameworks' => ['jest', 'mocha', 'pytest'],
                'coverage' => 'comprehensive',
                'mockExternalDeps' => true,
            ],
            'tags' => ['testing', 'quality', 'automation'],
            'examples' => [
                'Generate Jest tests for the user service',
                'Create integration tests for the payment API',
            ],
        ]);
    }

    /**
     * Create MCP servers for machine.
     */
    private function createMCPServers(Machine $machine): void
    {
        // MCP Server 1: GitHub MCP (Running)
        MCPServer::create([
            'machine_id' => $machine->id,
            'name' => 'github-mcp',
            'display_name' => 'GitHub MCP Server',
            'description' => 'Provides tools for interacting with GitHub API: repos, issues, PRs, commits',
            'status' => 'running',
            'transport' => 'stdio',
            'command' => 'npx -y @modelcontextprotocol/server-github',
            'env_vars' => [
                'GITHUB_PERSONAL_ACCESS_TOKEN' => '***',
            ],
            'tools' => [
                [
                    'name' => 'create_or_update_file',
                    'description' => 'Create or update a file in a GitHub repository',
                    'parameters' => ['owner', 'repo', 'path', 'content', 'message'],
                ],
                [
                    'name' => 'search_repositories',
                    'description' => 'Search for GitHub repositories',
                    'parameters' => ['query', 'page', 'perPage'],
                ],
                [
                    'name' => 'create_issue',
                    'description' => 'Create a new issue in a repository',
                    'parameters' => ['owner', 'repo', 'title', 'body'],
                ],
                [
                    'name' => 'list_commits',
                    'description' => 'List commits in a repository',
                    'parameters' => ['owner', 'repo', 'sha', 'page'],
                ],
            ],
            'config' => [
                'timeout' => 30000,
                'retries' => 3,
            ],
            'started_at' => now()->subHours(2),
        ]);

        // MCP Server 2: Filesystem MCP (Stopped)
        MCPServer::create([
            'machine_id' => $machine->id,
            'name' => 'filesystem-mcp',
            'display_name' => 'Filesystem MCP Server',
            'description' => 'Provides tools for file system operations: read, write, list, search',
            'status' => 'stopped',
            'transport' => 'stdio',
            'command' => 'npx -y @modelcontextprotocol/server-filesystem /Users/demo/projects',
            'env_vars' => [],
            'tools' => [
                [
                    'name' => 'read_file',
                    'description' => 'Read contents of a file',
                    'parameters' => ['path'],
                ],
                [
                    'name' => 'write_file',
                    'description' => 'Write content to a file',
                    'parameters' => ['path', 'content'],
                ],
                [
                    'name' => 'list_directory',
                    'description' => 'List contents of a directory',
                    'parameters' => ['path'],
                ],
                [
                    'name' => 'search_files',
                    'description' => 'Search for files matching a pattern',
                    'parameters' => ['pattern', 'path'],
                ],
            ],
            'config' => [
                'allowedPaths' => ['/Users/demo/projects'],
            ],
            'stopped_at' => now()->subHours(1),
        ]);
    }

    /**
     * Create discovered commands for machine.
     */
    private function createDiscoveredCommands(Machine $machine): void
    {
        // Command 1: npm install
        DiscoveredCommand::create([
            'machine_id' => $machine->id,
            'name' => 'npm install',
            'description' => 'Install project dependencies from package.json',
            'category' => 'npm',
            'parameters' => [
                ['name' => 'package', 'required' => false, 'description' => 'Specific package to install'],
                ['name' => '--save-dev', 'required' => false, 'description' => 'Save as dev dependency'],
            ],
            'aliases' => ['npm i'],
            'examples' => [
                'npm install',
                'npm install express',
                'npm install --save-dev jest',
            ],
        ]);

        // Command 2: git commit
        DiscoveredCommand::create([
            'machine_id' => $machine->id,
            'name' => 'git commit',
            'description' => 'Record changes to the repository',
            'category' => 'git',
            'parameters' => [
                ['name' => '-m', 'required' => true, 'description' => 'Commit message'],
                ['name' => '-a', 'required' => false, 'description' => 'Stage all modified files'],
            ],
            'aliases' => [],
            'examples' => [
                'git commit -m "Add new feature"',
                'git commit -am "Fix bug in user service"',
            ],
        ]);

        // Command 3: docker-compose up
        DiscoveredCommand::create([
            'machine_id' => $machine->id,
            'name' => 'docker-compose up',
            'description' => 'Start Docker containers defined in docker-compose.yml',
            'category' => 'docker',
            'parameters' => [
                ['name' => '-d', 'required' => false, 'description' => 'Run in detached mode'],
                ['name' => '--build', 'required' => false, 'description' => 'Build images before starting'],
            ],
            'aliases' => [],
            'examples' => [
                'docker-compose up',
                'docker-compose up -d',
                'docker-compose up --build',
            ],
        ]);

        // Command 4: npm test
        DiscoveredCommand::create([
            'machine_id' => $machine->id,
            'name' => 'npm test',
            'description' => 'Run test suite using Jest',
            'category' => 'test',
            'parameters' => [
                ['name' => 'file', 'required' => false, 'description' => 'Specific test file to run'],
                ['name' => '--coverage', 'required' => false, 'description' => 'Generate coverage report'],
            ],
            'aliases' => ['npm t'],
            'examples' => [
                'npm test',
                'npm test user.service.test.js',
                'npm test -- --coverage',
            ],
        ]);

        // Command 5: git status
        DiscoveredCommand::create([
            'machine_id' => $machine->id,
            'name' => 'git status',
            'description' => 'Show the working tree status',
            'category' => 'git',
            'parameters' => [
                ['name' => '-s', 'required' => false, 'description' => 'Show short format'],
            ],
            'aliases' => [],
            'examples' => [
                'git status',
                'git status -s',
            ],
        ]);
    }
}
