<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>Quickstart</h1>
      <p class="lead">
        Get up and running with ClaudeNest in minutes. Create your first machine, 
        start a session, and interact with Claude Code remotely.
      </p>
    </header>

    <section id="prerequisites">
      <h2>Before You Start</h2>
      <p>Make sure you have:</p>
      <ul class="checklist">
        <li><span class="check">✓</span> A running ClaudeNest server</li>
        <li><span class="check">✓</span> An API token (get one from the dashboard or via OAuth)</li>
        <li><span class="check">✓</span> curl or a HTTP client installed</li>
        <li><span class="check">✓</span> The agent installed on at least one machine</li>
      </ul>
    </section>

    <section id="first-api-call">
      <h2>Your First API Call</h2>
      <p>Let's start by checking the health of your server:</p>
      
      <CodeBlock 
        code="curl https://claudenest.yourdomain.com/api/health" 
        language="bash"
        filename="Request"
      />

      <CodeBlock 
        :code="healthResponse" 
        language="json"
        filename="Response"
      />

      <p class="tip">
        <span class="tip-icon">💡</span>
        The health endpoint doesn't require authentication and is useful for monitoring.
      </p>
    </section>

    <section id="list-machines">
      <h2>List Your Machines</h2>
      <p>Now let's see what machines are registered:</p>
      
      <CodeBlock 
        :code="listMachinesCode" 
        language="bash"
        filename="Request"
      />

      <CodeBlock 
        :code="listMachinesResponse" 
        language="json"
        filename="Response"
      />
    </section>

    <section id="create-session">
      <h2>Create a Session</h2>
      <p>Start a Claude Code session on one of your machines:</p>
      
      <CodeBlock 
        :code="createSessionCode" 
        language="bash"
        filename="Request"
      />

      <CodeBlock 
        :code="createSessionResponse" 
        language="json"
        filename="Response"
      />

      <p>Save the session ID - you'll need it for the next steps!</p>
    </section>

    <section id="attach-session">
      <h2>Attach to Session</h2>
      <p>To interact with the session, you need a WebSocket token:</p>
      
      <CodeBlock 
        :code="attachSessionCode" 
        language="bash"
        filename="Request"
      />

      <CodeBlock 
        :code="attachSessionResponse" 
        language="json"
        filename="Response"
      />

      <h3>WebSocket Connection</h3>
      <p>Connect to the WebSocket endpoint to receive terminal output and send input:</p>
      
      <CodeBlock 
        :code="websocketCode" 
        language="javascript"
        filename="websocket.js"
      />
    </section>

    <section id="create-project">
      <h2>Create a Shared Project</h2>
      <p>For multi-agent collaboration, create a shared project:</p>
      
      <CodeBlock 
        :code="createProjectCode" 
        language="bash"
        filename="Request"
      />

      <CodeBlock 
        :code="createProjectResponse" 
        language="json"
        filename="Response"
      />
    </section>

    <section id="create-task">
      <h2>Create a Task</h2>
      <p>Create tasks that can be claimed by different Claude instances:</p>
      
      <CodeBlock 
        :code="createTaskCode" 
        language="bash"
        filename="Request"
      />

      <CodeBlock 
        :code="createTaskResponse" 
        language="json"
        filename="Response"
      />
    </section>

    <section id="query-context">
      <h2>Query Project Context</h2>
      <p>Use RAG to query project context:</p>
      
      <CodeBlock 
        :code="queryContextCode" 
        language="bash"
        filename="Request"
      />

      <CodeBlock 
        :code="queryContextResponse" 
        language="json"
        filename="Response"
      />
    </section>

    <section id="javascript-sdk">
      <h2>Using the JavaScript SDK</h2>
      <p>For easier integration, use the official JavaScript SDK:</p>
      
      <CodeBlock 
        code="npm install @claudenest/sdk" 
        language="bash"
      />

      <CodeBlock 
        :code="sdkCode" 
        language="javascript"
        filename="example.js"
      />
    </section>

    <section id="next-steps">
      <h2>Next Steps</h2>
      <div class="next-steps">
        <router-link to="/docs/api/machines" class="next-step">
          <strong>Machines API</strong>
          <span>Manage your registered machines →</span>
        </router-link>
        <router-link to="/docs/api/sessions" class="next-step">
          <strong>Sessions API</strong>
          <span>Create and manage Claude Code sessions →</span>
        </router-link>
        <router-link to="/docs/api/projects" class="next-step">
          <strong>Projects API</strong>
          <span>Set up multi-agent collaboration →</span>
        </router-link>
        <router-link to="/docs/sdks/javascript" class="next-step">
          <strong>JavaScript SDK</strong>
          <span>Full SDK documentation →</span>
        </router-link>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import CodeBlock from '@/components/docs/CodeBlock.vue';

const healthResponse = `{
  "success": true,
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "timestamp": "2026-02-02T17:00:00Z"
  }
}`;

const listMachinesCode = `curl https://claudenest.yourdomain.com/api/machines \\
  -H 'Authorization: Bearer your-api-token'`;

const listMachinesResponse = `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "MacBook-Pro-Work",
      "platform": "darwin",
      "status": "online",
      "is_online": true,
      "active_sessions_count": 0
    }
  ],
  "meta": {
    "pagination": {
      "current_page": 1,
      "total": 1
    }
  }
}`;

const createSessionCode = `curl -X POST https://claudenest.yourdomain.com/api/machines/550e8400-e29b-41d4-a716-446655440001/sessions \\
  -H 'Authorization: Bearer your-api-token' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "mode": "interactive",
    "project_path": "/home/user/myproject",
    "initial_prompt": "Help me refactor this codebase",
    "pty_size": {
      "cols": 120,
      "rows": 40
    }
  }'`;

const createSessionResponse = `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "machine_id": "550e8400-e29b-41d4-a716-446655440001",
    "mode": "interactive",
    "project_path": "/home/user/myproject",
    "status": "created",
    "is_running": false,
    "created_at": "2026-02-02T17:00:00Z"
  }
}`;

const attachSessionCode = `curl -X POST https://claudenest.yourdomain.com/api/sessions/550e8400-e29b-41d4-a716-446655440002/attach \\
  -H 'Authorization: Bearer your-api-token'`;

const attachSessionResponse = `{
  "success": true,
  "data": {
    "ws_token": "a1b2c3d4e5f6...",
    "session_id": "550e8400-e29b-41d4-a716-446655440002",
    "ws_url": "wss://claudenest.yourdomain.com:8080"
  }
}`;

const websocketCode = `// JavaScript example using WebSocket
const ws = new WebSocket('wss://claudenest.yourdomain.com:8080');

ws.onopen = () => {
  // Authenticate with the token
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'a1b2c3d4e5f6...'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

// Send input to the session
function sendInput(data) {
  ws.send(JSON.stringify({
    type: 'input',
    data: data
  }));
}

// Resize the terminal
function resize(cols, rows) {
  ws.send(JSON.stringify({
    type: 'resize',
    cols: cols,
    rows: rows
  }));
}`;

const createProjectCode = `curl -X POST https://claudenest.yourdomain.com/api/machines/550e8400-e29b-41d4-a716-446655440001/projects \\
  -H 'Authorization: Bearer your-api-token' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "My Awesome Project",
    "project_path": "/home/user/myproject",
    "summary": "A Next.js application with authentication",
    "architecture": "Next.js 14, Prisma, PostgreSQL",
    "conventions": "Use TypeScript, follow ESLint rules"
  }'`;

const createProjectResponse = `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "name": "My Awesome Project",
    "project_path": "/home/user/myproject",
    "summary": "A Next.js application with authentication",
    "token_usage_percent": 0,
    "active_instances_count": 0,
    "pending_tasks_count": 0
  }
}`;

const createTaskCode = `curl -X POST https://claudenest.yourdomain.com/api/projects/550e8400-e29b-41d4-a716-446655440004/tasks \\
  -H 'Authorization: Bearer your-api-token' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "title": "Implement user authentication",
    "description": "Add JWT-based authentication with login and signup endpoints",
    "priority": "high",
    "files": ["auth.ts", "user.ts", "middleware.ts"],
    "estimated_tokens": 5000
  }'`;

const createTaskResponse = `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440006",
    "title": "Implement user authentication",
    "status": "pending",
    "is_claimed": false,
    "priority": "high"
  }
}`;

const queryContextCode = `curl -X POST https://claudenest.yourdomain.com/api/projects/550e8400-e29b-41d4-a716-446655440004/context/query \\
  -H 'Authorization: Bearer your-api-token' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "query": "How is authentication implemented?",
    "limit": 5
  }'`;

const queryContextResponse = `{
  "success": true,
  "data": [
    {
      "id": "...",
      "content": "Task completed: Implement user authentication...",
      "type": "task_completion",
      "similarity": 0.92,
      "created_at": "2026-02-02T17:00:00Z"
    }
  ],
  "meta": {
    "query": "How is authentication implemented?",
    "result_count": 1,
    "used_embeddings": true
  }
}`;

const sdkCode = `import { ClaudeNestClient } from '@claudenest/sdk';

const client = new ClaudeNestClient({
  baseUrl: 'https://claudenest.yourdomain.com',
  token: 'your-api-token'
});

// List machines
const machines = await client.machines.list();
console.log(machines);

// Create a session
const session = await client.sessions.create({
  machineId: '550e8400-e29b-41d4-a716-446655440001',
  mode: 'interactive',
  projectPath: '/home/user/myproject'
});

// Attach to session
const ws = await client.sessions.attach(session.id);

ws.onMessage((message) => {
  console.log('Output:', message.data);
});

// Send input
ws.sendInput('Hello Claude!');`;
</script>

<style scoped>
.doc-content {
  max-width: 768px;
}

.doc-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.doc-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 1rem;
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-cyan, #22d3ee));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 1.25rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

section {
  margin-bottom: 3rem;
}

h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: var(--text-primary);
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem;
  color: var(--text-primary);
}

p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 1rem;
}

ul {
  color: var(--text-secondary);
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

/* Checklist */
.checklist {
  list-style: none;
  padding: 0;
}

.checklist li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.check {
  width: 24px;
  height: 24px;
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
}

/* Tip */
.tip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 10px;
  margin: 1rem 0;
}

.tip-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.tip p {
  margin: 0;
  font-size: 0.95rem;
}

/* Next Steps */
.next-steps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.next-step {
  display: flex;
  flex-direction: column;
  padding: 1rem 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s;
}

.next-step:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
}

.next-step strong {
  color: var(--text-primary);
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.next-step span {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.next-step:hover span {
  color: var(--text-secondary);
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: var(--border-color, var(--border));
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
}

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }
}
</style>
