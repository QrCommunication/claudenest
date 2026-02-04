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
        :code="`{\n  \"success\": true,\n  \"data\": {\n    \"status\": \"ok\",\n    \"version\": \"1.0.0\",\n    \"timestamp\": \"2026-02-02T17:00:00Z\"\n  }\n}`" 
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
        code="curl https://claudenest.yourdomain.com/api/machines \\
  -H \"Authorization: Bearer your-api-token\"" 
        language="bash"
        filename="Request"
      />

      <CodeBlock 
        :code="`{\n  \"success\": true,\n  \"data\": [\n    {\n      \"id\": \"550e8400-e29b-41d4-a716-446655440001\",\n      \"name\": \"MacBook-Pro-Work\",\n      \"platform\": \"darwin\",\n      \"status\": \"online\",\n      \"is_online\": true,\n      \"active_sessions_count\": 0\n    }\n  ],\n  \"meta\": {\n    \"pagination\": {\n      \"current_page\": 1,\n      \"total\": 1\n    }\n  }\n}`" 
        language="json"
        filename="Response"
      />
    </section>

    <section id="create-session">
      <h2>Create a Session</h2>
      <p>Start a Claude Code session on one of your machines:</p>
      
      <CodeBlock 
        code="curl -X POST https://claudenest.yourdomain.com/api/machines/550e8400-e29b-41d4-a716-446655440001/sessions \\
  -H \"Authorization: Bearer your-api-token\" \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"mode\": \"interactive\",\n    \"project_path\": \"/home/user/myproject\",\n    \"initial_prompt\": \"Help me refactor this codebase\",\n    \"pty_size\": {\n      \"cols\": 120,\n      \"rows\": 40\n    }\n  }'" 
        language="bash"
        filename="Request"
      />

      <CodeBlock 
        :code="`{\n  \"success\": true,\n  \"data\": {\n    \"id\": \"550e8400-e29b-41d4-a716-446655440002\",\n    \"machine_id\": \"550e8400-e29b-41d4-a716-446655440001\",\n    \"mode\": \"interactive\",\n    \"project_path\": \"/home/user/myproject\",\n    \"status\": \"created\",\n    \"is_running\": false,\n    \"created_at\": \"2026-02-02T17:00:00Z\"\n  }\n}`" 
        language="json"
        filename="Response"
      />

      <p>Save the session ID - you'll need it for the next steps!</p>
    </section>

    <section id="attach-session">
      <h2>Attach to Session</h2>
      <p>To interact with the session, you need a WebSocket token:</p>
      
      <CodeBlock 
        code="curl -X POST https://claudenest.yourdomain.com/api/sessions/550e8400-e29b-41d4-a716-446655440002/attach \\
  -H \"Authorization: Bearer your-api-token\"" 
        language="bash"
        filename="Request"
      />

      <CodeBlock 
        :code="`{\n  \"success\": true,\n  \"data\": {\n    \"ws_token\": \"a1b2c3d4e5f6...\",\n    \"session_id\": \"550e8400-e29b-41d4-a716-446655440002\",\n    \"ws_url\": \"wss://claudenest.yourdomain.com:8080\"\n  }\n}`" 
        language="json"
        filename="Response"
      />

      <h3>WebSocket Connection</h3>
      <p>Connect to the WebSocket endpoint to receive terminal output and send input:</p>
      
      <CodeBlock 
        :code="`// JavaScript example using WebSocket
const ws = new WebSocket('wss://claudenest.yourdomain.com:8080');

ws.onopen = () => {\n  // Authenticate with the token\n  ws.send(JSON.stringify({\n    type: 'auth',\n    token: 'a1b2c3d4e5f6...'\n  }));\n};\n
ws.onmessage = (event) => {\n  const message = JSON.parse(event.data);\n  console.log('Received:', message);\n};\n
// Send input to the session
function sendInput(data) {\n  ws.send(JSON.stringify({\n    type: 'input',\n    data: data\n  }));\n}\n
// Resize the terminal
function resize(cols, rows) {\n  ws.send(JSON.stringify({\n    type: 'resize',\n    cols: cols,\n    rows: rows\n  }));\n}`" 
        language="javascript"
        filename="websocket.js"
      />
    </section>

    <section id="create-project">
      <h2>Create a Shared Project</h2>
      <p>For multi-agent collaboration, create a shared project:</p>
      
      <CodeBlock 
        code="curl -X POST https://claudenest.yourdomain.com/api/machines/550e8400-e29b-41d4-a716-446655440001/projects \\
  -H \"Authorization: Bearer your-api-token\" \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"name\": \"My Awesome Project\",\n    \"project_path\": \"/home/user/myproject\",\n    \"summary\": \"A Next.js application with authentication\",\n    \"architecture\": \"Next.js 14, Prisma, PostgreSQL\",\n    \"conventions\": \"Use TypeScript, follow ESLint rules\"
  }'" 
        language="bash"
        filename="Request"
      />

      <CodeBlock 
        :code="`{\n  \"success\": true,\n  \"data\": {\n    \"id\": \"550e8400-e29b-41d4-a716-446655440004\",\n    \"name\": \"My Awesome Project\",\n    \"project_path\": \"/home/user/myproject\",\n    \"summary\": \"A Next.js application with authentication\",\n    \"token_usage_percent\": 0,\n    \"active_instances_count\": 0,\n    \"pending_tasks_count\": 0\n  }\n}`" 
        language="json"
        filename="Response"
      />
    </section>

    <section id="create-task">
      <h2>Create a Task</h2>
      <p>Create tasks that can be claimed by different Claude instances:</p>
      
      <CodeBlock 
        code="curl -X POST https://claudenest.yourdomain.com/api/projects/550e8400-e29b-41d4-a716-446655440004/tasks \\
  -H \"Authorization: Bearer your-api-token\" \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"title\": \"Implement user authentication\",\n    \"description\": \"Add JWT-based authentication with login and signup endpoints\",\n    \"priority\": \"high\",\n    \"files\": [\"auth.ts\", \"user.ts\", \"middleware.ts\"],\n    \"estimated_tokens\": 5000\n  }'" 
        language="bash"
        filename="Request"
      />

      <CodeBlock 
        :code="`{\n  \"success\": true,\n  \"data\": {\n    \"id\": \"550e8400-e29b-41d4-a716-446655440006\",\n    \"title\": \"Implement user authentication\",\n    \"status\": \"pending\",\n    \"is_claimed\": false,\n    \"priority\": \"high\"\n  }\n}`" 
        language="json"
        filename="Response"
      />
    </section>

    <section id="query-context">
      <h2>Query Project Context</h2>
      <p>Use RAG to query project context:</p>
      
      <CodeBlock 
        code="curl -X POST https://claudenest.yourdomain.com/api/projects/550e8400-e29b-41d4-a716-446655440004/context/query \\
  -H \"Authorization: Bearer your-api-token\" \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"query\": \"How is authentication implemented?\",\n    \"limit\": 5\n  }'" 
        language="bash"
        filename="Request"
      />

      <CodeBlock 
        :code="`{\n  \"success\": true,\n  \"data\": [\n    {\n      \"id\": \"...\",\n      \"content\": \"Task completed: Implement user authentication...\",\n      \"type\": \"task_completion\",\n      \"similarity\": 0.92,\n      \"created_at\": \"2026-02-02T17:00:00Z\"\n    }\n  ],\n  \"meta\": {\n    \"query\": \"How is authentication implemented?\",\n    \"result_count\": 1,\n    \"used_embeddings\": true\n  }\n}`" 
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
        :code="`import { ClaudeNestClient } from '@claudenest/sdk';\n\nconst client = new ClaudeNestClient({\n  baseUrl: 'https://claudenest.yourdomain.com',\n  token: 'your-api-token'\n});\n\n// List machines\nconst machines = await client.machines.list();\nconsole.log(machines);\n\n// Create a session\nconst session = await client.sessions.create({\n  machineId: '550e8400-e29b-41d4-a716-446655440001',\n  mode: 'interactive',\n  projectPath: '/home/user/myproject'\n});\n\n// Attach to session\nconst ws = await client.sessions.attach(session.id);\n\nws.onMessage((message) => {\n  console.log('Output:', message.data);\n});\n\n// Send input\nws.sendInput('Hello Claude!');`" 
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
</script>

<style scoped>
.doc-content {
  max-width: 768px;
}

.doc-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.doc-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 1rem;
  background: linear-gradient(135deg, #a855f7, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 1.25rem;
  color: #a9b1d6;
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
  color: #ffffff;
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem;
  color: #ffffff;
}

p {
  color: #a9b1d6;
  line-height: 1.7;
  margin: 0 0 1rem;
}

ul {
  color: #a9b1d6;
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
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s;
}

.next-step:hover {
  background: rgba(168, 85, 247, 0.05);
  border-color: rgba(168, 85, 247, 0.3);
}

.next-step strong {
  color: #ffffff;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.next-step span {
  color: #64748b;
  font-size: 0.9rem;
}

.next-step:hover span {
  color: #a9b1d6;
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: #22d3ee;
}

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }
}
</style>
