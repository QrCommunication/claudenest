<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>Remote Sessions</h1>
      <p class="lead">
        Create and manage remote Claude Code sessions on your registered machines.
        Sessions support three modes, real-time WebSocket streaming, and full
        lifecycle management.
      </p>
    </header>

    <section id="create-session">
      <h2>Create a Session</h2>
      <p>
        To start a Claude Code session, send a POST request to the sessions
        endpoint with the target machine ID. You can specify a working directory,
        an initial prompt, and the session mode.
      </p>

      <CodeTabs :tabs="createSessionTabs" />

      <CodeBlock
        :code="createSessionResponse"
        language="json"
        filename="Response"
      />

      <p>
        The session starts in <code>created</code> status, transitions to
        <code>starting</code> while the agent spawns the Claude Code process,
        and then moves to <code>running</code> once the PTY is ready.
      </p>

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        Save the returned session <code>id</code> &mdash; you will need it
        to attach, send input, or terminate the session.
      </p>
    </section>

    <section id="interactive-mode">
      <h2>Interactive Mode</h2>
      <p>
        Interactive sessions provide a full bidirectional terminal experience.
        You send input (keystrokes, commands) and receive real-time output
        via WebSocket. This is the default mode and is ideal for the web
        dashboard and mobile apps.
      </p>

      <h3>Attach via WebSocket</h3>
      <p>
        To interact with an interactive session, first request a WebSocket token,
        then connect to the Reverb WebSocket server:
      </p>

      <CodeTabs :tabs="attachSessionTabs" />

      <CodeBlock
        :code="attachResponse"
        language="json"
        filename="Response"
      />

      <h3>WebSocket Communication</h3>
      <p>
        Once attached, use the WebSocket connection to send input and receive output
        in real time:
      </p>

      <CodeBlock
        :code="websocketCode"
        language="javascript"
        filename="websocket-session.js"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        Terminal resize events should be sent whenever the client viewport changes
        to keep the PTY dimensions in sync with the display.
      </p>
    </section>

    <section id="headless-mode">
      <h2>Headless Mode</h2>
      <p>
        Headless sessions run without user interaction. Claude Code executes the
        initial prompt autonomously and completes when done. This mode is ideal
        for batch processing, CI/CD pipelines, and automated tasks.
      </p>

      <CodeTabs :tabs="headlessSessionTabs" />

      <CodeBlock
        :code="headlessResponse"
        language="json"
        filename="Response"
      />

      <p>
        Headless sessions automatically transition through
        <code>created</code> &#8594; <code>starting</code> &#8594;
        <code>running</code> &#8594; <code>completed</code> without
        requiring any further interaction. You can poll the session status
        or listen to WebSocket events to know when the task finishes.
      </p>
    </section>

    <section id="oneshot-mode">
      <h2>Oneshot Mode</h2>
      <p>
        Oneshot sessions execute a single command or prompt and terminate
        immediately after. They are designed for quick, atomic operations
        such as code generation, analysis, or one-off queries.
      </p>

      <CodeTabs :tabs="oneshotSessionTabs" />

      <CodeBlock
        :code="oneshotResponse"
        language="json"
        filename="Response"
      />

      <p>
        Unlike headless mode, oneshot sessions are expected to complete within
        a short time frame. The response includes any output produced during
        execution.
      </p>

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        Use oneshot mode for quick tasks that do not require ongoing context.
        For longer-running autonomous work, prefer headless mode.
      </p>
    </section>

    <section id="monitoring">
      <h2>Monitoring Sessions</h2>
      <p>
        ClaudeNest provides several ways to monitor session status and review
        output after the fact.
      </p>

      <h3>Session Status</h3>
      <p>
        Query the session endpoint to check its current status, token usage,
        cost, and duration:
      </p>

      <CodeTabs :tabs="getSessionTabs" />

      <CodeBlock
        :code="getSessionResponse"
        language="json"
        filename="Response"
      />

      <h3>Session Logs</h3>
      <p>
        Every session records a complete log of all input and output. Retrieve
        logs for debugging, auditing, or replaying sessions:
      </p>

      <CodeTabs :tabs="getLogsTabs" />

      <CodeBlock
        :code="getLogsResponse"
        language="json"
        filename="Response"
      />

      <h3>Log Entry Types</h3>
      <ul>
        <li><code>input</code> &mdash; User input sent to Claude Code</li>
        <li><code>output</code> &mdash; Terminal output from Claude Code</li>
        <li><code>error</code> &mdash; Error messages from the process</li>
        <li><code>system</code> &mdash; System-level events (start, stop, resize)</li>
        <li><code>tool</code> &mdash; Tool execution results</li>
      </ul>

      <h3>Terminating a Session</h3>
      <p>
        To stop a running session, send a DELETE request. The agent will
        send a SIGTERM to the Claude Code process and clean up resources:
      </p>

      <CodeBlock
        :code="terminateCode"
        language="bash"
        filename="Request"
      />

      <CodeBlock
        :code="terminateResponse"
        language="json"
        filename="Response"
      />
    </section>

    <section id="next-steps">
      <h2>Next Steps</h2>
      <p>Now that you can create and manage sessions, explore these advanced topics:</p>
      <div class="next-steps">
        <router-link to="/docs/websocket" class="next-step">
          <strong>WebSocket Reference</strong>
          <span>Full WebSocket event documentation and connection details &#8594;</span>
        </router-link>
        <router-link to="/docs/api/projects" class="next-step">
          <strong>Multi-Agent Projects</strong>
          <span>Coordinate multiple Claude instances on the same codebase &#8594;</span>
        </router-link>
        <router-link to="/docs/api/tasks" class="next-step">
          <strong>Task Coordination</strong>
          <span>Create, claim, and complete tasks across agents &#8594;</span>
        </router-link>
        <router-link to="/docs/api/sessions" class="next-step">
          <strong>Sessions API Reference</strong>
          <span>Complete API endpoint documentation for sessions &#8594;</span>
        </router-link>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const createSessionTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://claudenest.yourdomain.com/api/machines/MACHINE_ID/sessions \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mode": "interactive",
    "project_path": "/home/user/myproject",
    "initial_prompt": "Help me refactor the authentication module",
    "pty_size": { "cols": 120, "rows": 40 }
  }'`,
    filename: 'Request',
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://claudenest.yourdomain.com/api/machines/MACHINE_ID/sessions',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'interactive',
      project_path: '/home/user/myproject',
      initial_prompt: 'Help me refactor the authentication module',
      pty_size: { cols: 120, rows: 40 },
    }),
  }
);

const session = await response.json();
console.log('Session ID:', session.data.id);
console.log('Status:', session.data.status);`,
    filename: 'create-session.js',
  },
  {
    label: 'Python',
    language: 'python',
    code: `import requests

response = requests.post(
    "https://claudenest.yourdomain.com/api/machines/MACHINE_ID/sessions",
    headers={
        "Authorization": "Bearer YOUR_TOKEN",
        "Content-Type": "application/json",
    },
    json={
        "mode": "interactive",
        "project_path": "/home/user/myproject",
        "initial_prompt": "Help me refactor the authentication module",
        "pty_size": {"cols": 120, "rows": 40},
    },
)

session = response.json()
print("Session ID:", session["data"]["id"])
print("Status:", session["data"]["status"])`,
    filename: 'create_session.py',
  },
]);

const createSessionResponse = `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "machine_id": "550e8400-e29b-41d4-a716-446655440001",
    "mode": "interactive",
    "project_path": "/home/user/myproject",
    "initial_prompt": "Help me refactor the authentication module",
    "status": "created",
    "is_running": false,
    "pty_size": { "cols": 120, "rows": 40 },
    "created_at": "2026-02-17T10:00:00Z"
  },
  "meta": {
    "timestamp": "2026-02-17T10:00:00Z",
    "request_id": "req_sess_001"
  }
}`;

const attachSessionTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://claudenest.yourdomain.com/api/sessions/SESSION_ID/attach \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
    filename: 'Request',
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://claudenest.yourdomain.com/api/sessions/SESSION_ID/attach',
  {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
  }
);

const { data } = await response.json();
console.log('WebSocket URL:', data.ws_url);
console.log('Token:', data.ws_token);`,
    filename: 'attach.js',
  },
  {
    label: 'Python',
    language: 'python',
    code: `import requests

response = requests.post(
    "https://claudenest.yourdomain.com/api/sessions/SESSION_ID/attach",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
)

data = response.json()["data"]
print("WebSocket URL:", data["ws_url"])
print("Token:", data["ws_token"])`,
    filename: 'attach.py',
  },
]);

const attachResponse = `{
  "success": true,
  "data": {
    "ws_token": "ws_a1b2c3d4e5f6...",
    "session_id": "550e8400-e29b-41d4-a716-446655440002",
    "ws_url": "wss://claudenest.yourdomain.com:8080"
  }
}`;

const websocketCode = `// Connect to the session WebSocket
const ws = new WebSocket('wss://claudenest.yourdomain.com:8080');

ws.onopen = () => {
  // Authenticate with the attach token
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'ws_a1b2c3d4e5f6...',
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'SessionOutput':
      // Append to terminal emulator
      terminal.write(message.data);
      break;
    case 'SessionTerminated':
      console.log('Session ended, exit code:', message.exit_code);
      ws.close();
      break;
  }
};

// Send user input
function sendInput(text) {
  ws.send(JSON.stringify({
    type: 'input',
    data: text,
  }));
}

// Resize the remote PTY
function resize(cols, rows) {
  ws.send(JSON.stringify({
    type: 'resize',
    cols,
    rows,
  }));
}`;

const headlessSessionTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://claudenest.yourdomain.com/api/machines/MACHINE_ID/sessions \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mode": "headless",
    "project_path": "/home/user/myproject",
    "initial_prompt": "Run the full test suite and fix any failing tests"
  }'`,
    filename: 'Request',
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://claudenest.yourdomain.com/api/machines/MACHINE_ID/sessions',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'headless',
      project_path: '/home/user/myproject',
      initial_prompt: 'Run the full test suite and fix any failing tests',
    }),
  }
);

const session = await response.json();
console.log('Headless session started:', session.data.id);`,
    filename: 'headless.js',
  },
  {
    label: 'Python',
    language: 'python',
    code: `import requests

response = requests.post(
    "https://claudenest.yourdomain.com/api/machines/MACHINE_ID/sessions",
    headers={
        "Authorization": "Bearer YOUR_TOKEN",
        "Content-Type": "application/json",
    },
    json={
        "mode": "headless",
        "project_path": "/home/user/myproject",
        "initial_prompt": "Run the full test suite and fix any failing tests",
    },
)

session = response.json()
print("Headless session started:", session["data"]["id"])`,
    filename: 'headless.py',
  },
]);

const headlessResponse = `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "machine_id": "550e8400-e29b-41d4-a716-446655440001",
    "mode": "headless",
    "project_path": "/home/user/myproject",
    "status": "created",
    "is_running": false,
    "created_at": "2026-02-17T11:00:00Z"
  },
  "meta": {
    "timestamp": "2026-02-17T11:00:00Z",
    "request_id": "req_headless_001"
  }
}`;

const oneshotSessionTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://claudenest.yourdomain.com/api/machines/MACHINE_ID/sessions \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mode": "oneshot",
    "project_path": "/home/user/myproject",
    "initial_prompt": "Explain the purpose of src/auth/middleware.ts"
  }'`,
    filename: 'Request',
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://claudenest.yourdomain.com/api/machines/MACHINE_ID/sessions',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'oneshot',
      project_path: '/home/user/myproject',
      initial_prompt: 'Explain the purpose of src/auth/middleware.ts',
    }),
  }
);

const session = await response.json();
console.log('Oneshot result:', session.data.id);`,
    filename: 'oneshot.js',
  },
  {
    label: 'Python',
    language: 'python',
    code: `import requests

response = requests.post(
    "https://claudenest.yourdomain.com/api/machines/MACHINE_ID/sessions",
    headers={
        "Authorization": "Bearer YOUR_TOKEN",
        "Content-Type": "application/json",
    },
    json={
        "mode": "oneshot",
        "project_path": "/home/user/myproject",
        "initial_prompt": "Explain the purpose of src/auth/middleware.ts",
    },
)

session = response.json()
print("Oneshot result:", session["data"]["id"])`,
    filename: 'oneshot.py',
  },
]);

const oneshotResponse = `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "machine_id": "550e8400-e29b-41d4-a716-446655440001",
    "mode": "oneshot",
    "project_path": "/home/user/myproject",
    "status": "created",
    "is_running": false,
    "created_at": "2026-02-17T11:30:00Z"
  },
  "meta": {
    "timestamp": "2026-02-17T11:30:00Z",
    "request_id": "req_oneshot_001"
  }
}`;

const getSessionTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl https://claudenest.yourdomain.com/api/sessions/SESSION_ID \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
    filename: 'Request',
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://claudenest.yourdomain.com/api/sessions/SESSION_ID',
  { headers: { 'Authorization': 'Bearer YOUR_TOKEN' } }
);

const session = await response.json();
console.log('Status:', session.data.status);
console.log('Tokens:', session.data.total_tokens);
console.log('Cost:', session.data.total_cost);`,
    filename: 'status.js',
  },
  {
    label: 'Python',
    language: 'python',
    code: `import requests

response = requests.get(
    "https://claudenest.yourdomain.com/api/sessions/SESSION_ID",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
)

session = response.json()["data"]
print("Status:", session["status"])
print("Tokens:", session["total_tokens"])
print("Cost:", session["total_cost"])`,
    filename: 'status.py',
  },
]);

const getSessionResponse = `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "machine_id": "550e8400-e29b-41d4-a716-446655440001",
    "mode": "interactive",
    "status": "running",
    "is_running": true,
    "is_completed": false,
    "pid": 42567,
    "pty_size": { "cols": 120, "rows": 40 },
    "total_tokens": 8500,
    "total_cost": 0.25,
    "duration": 1800,
    "formatted_duration": "30m 0s",
    "started_at": "2026-02-17T10:00:00Z",
    "completed_at": null,
    "created_at": "2026-02-17T10:00:00Z"
  },
  "meta": {
    "timestamp": "2026-02-17T10:30:00Z",
    "request_id": "req_status_001"
  }
}`;

const getLogsTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl https://claudenest.yourdomain.com/api/sessions/SESSION_ID/logs \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
    filename: 'Request',
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://claudenest.yourdomain.com/api/sessions/SESSION_ID/logs',
  { headers: { 'Authorization': 'Bearer YOUR_TOKEN' } }
);

const logs = await response.json();
logs.data.forEach(entry => {
  console.log(\`[\${entry.type}] \${entry.data}\`);
});`,
    filename: 'logs.js',
  },
  {
    label: 'Python',
    language: 'python',
    code: `import requests

response = requests.get(
    "https://claudenest.yourdomain.com/api/sessions/SESSION_ID/logs",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
)

logs = response.json()["data"]
for entry in logs:
    print(f"[{entry['type']}] {entry['data']}")`,
    filename: 'logs.py',
  },
]);

const getLogsResponse = `{
  "success": true,
  "data": [
    {
      "id": "log-001",
      "type": "system",
      "data": "Session started",
      "metadata": {},
      "created_at": "2026-02-17T10:00:00Z"
    },
    {
      "id": "log-002",
      "type": "input",
      "data": "Help me refactor the authentication module",
      "metadata": {},
      "created_at": "2026-02-17T10:00:01Z"
    },
    {
      "id": "log-003",
      "type": "output",
      "data": "I'll analyze the authentication module and suggest improvements...",
      "metadata": { "tokens_used": 350 },
      "created_at": "2026-02-17T10:00:05Z"
    }
  ],
  "meta": {
    "timestamp": "2026-02-17T10:30:00Z",
    "request_id": "req_logs_001",
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 100,
      "total": 3
    }
  }
}`;

const terminateCode = `curl -X DELETE https://claudenest.yourdomain.com/api/sessions/SESSION_ID \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const terminateResponse = `{
  "success": true,
  "data": null,
  "meta": {
    "timestamp": "2026-02-17T10:35:00Z",
    "request_id": "req_term_001"
  }
}`;
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
