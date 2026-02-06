<template>
  <DocsLayout>
    <div class="docs-page">
      <h1>Sessions API</h1>
      
      <p class="lead">
        Manage Claude Code sessions on your machines. Sessions represent interactive 
        or automated conversations with Claude Code, with full support for real-time 
        I/O via WebSocket.
      </p>

      <div class="section">
        <h2>Session Object</h2>
        <CodeBlock language="json" :code="sessionObject" />
      </div>

      <!-- List Sessions -->
      <EndpointCard
        method="GET"
        path="/machines/{machine}/sessions"
        description="List all sessions for a specific machine."
        :params="listParams"
        :curlExample="listCurl"
        :jsExample="listJs"
        :phpExample="listPhp"
        :responses="listResponses"
      />

      <!-- Create Session -->
      <EndpointCard
        method="POST"
        path="/machines/{machine}/sessions"
        description="Create a new Claude Code session on the specified machine."
        :params="createParams"
        :curlExample="createCurl"
        :jsExample="createJs"
        :phpExample="createPhp"
        :responses="createResponses"
      />

      <!-- Get Session -->
      <EndpointCard
        method="GET"
        path="/sessions/{id}"
        description="Get detailed information about a specific session."
        :params="getParams"
        :curlExample="getCurl"
        :jsExample="getJs"
        :phpExample="getPhp"
        :responses="getResponses"
      />

      <!-- Terminate Session -->
      <EndpointCard
        method="DELETE"
        path="/sessions/{id}"
        description="Terminate a running session."
        :params="deleteParams"
        :curlExample="deleteCurl"
        :jsExample="deleteJs"
        :phpExample="deletePhp"
        :responses="deleteResponses"
      />

      <!-- Get Logs -->
      <EndpointCard
        method="GET"
        path="/sessions/{id}/logs"
        description="Get the complete log history for a session."
        :params="logsParams"
        :curlExample="logsCurl"
        :jsExample="logsJs"
        :phpExample="logsPhp"
        :responses="logsResponses"
      />

      <!-- Attach to Session -->
      <EndpointCard
        method="POST"
        path="/sessions/{id}/attach"
        description="Generate a WebSocket token to attach to a running session for real-time I/O."
        :params="attachParams"
        :curlExample="attachCurl"
        :jsExample="attachJs"
        :phpExample="attachPhp"
        :responses="attachResponses"
      />

      <!-- Send Input -->
      <EndpointCard
        method="POST"
        path="/sessions/{id}/input"
        description="Send input to a running session via HTTP (use WebSocket for real-time)."
        :params="inputParams"
        :curlExample="inputCurl"
        :jsExample="inputJs"
        :phpExample="inputPhp"
        :responses="inputResponses"
      />

      <!-- Resize PTY -->
      <EndpointCard
        method="POST"
        path="/sessions/{id}/resize"
        description="Resize the terminal dimensions for the session."
        :params="resizeParams"
        :curlExample="resizeCurl"
        :jsExample="resizeJs"
        :phpExample="resizePhp"
        :responses="resizeResponses"
      />

      <div class="section">
        <h2>Session Modes</h2>
        <ul>
          <li><code>interactive</code> - Full interactive session with Claude (default)</li>
          <li><code>headless</code> - Automated session without user interaction</li>
          <li><code>oneshot</code> - Single command execution, terminates when complete</li>
        </ul>
      </div>

      <div class="section">
        <h2>Session Statuses</h2>
        <ul>
          <li><code>created</code> - Session created, waiting to start</li>
          <li><code>starting</code> - Session is initializing</li>
          <li><code>running</code> - Session is active and processing</li>
          <li><code>waiting_input</code> - Session waiting for user input</li>
          <li><code>completed</code> - Session finished successfully</li>
          <li><code>error</code> - Session encountered an error</li>
          <li><code>terminated</code> - Session was manually terminated</li>
        </ul>
      </div>

      <div class="section">
        <h2>WebSocket Connection</h2>
        <p>
          For real-time interaction with sessions, use WebSocket connection. First, 
          call the <code>/attach</code> endpoint to get a WebSocket token, then connect 
          to the WebSocket server.
        </p>
        <CodeBlock language="javascript" :code="websocketExample" />
        <p>
          See the <router-link to="/docs/websocket">WebSocket documentation</router-link> 
          for complete details.
        </p>
      </div>

      <div class="section">
        <h2>Session Logs</h2>
        <p>
          Sessions automatically log all input and output. Log entries have the following types:
        </p>
        <ul>
          <li><code>input</code> - User input sent to the session</li>
          <li><code>output</code> - Output from Claude Code</li>
          <li><code>error</code> - Error messages</li>
          <li><code>system</code> - System messages</li>
          <li><code>tool</code> - Tool execution results</li>
        </ul>
      </div>
    </div>
  </DocsLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DocsLayout from '@/layouts/DocsLayout.vue';
import EndpointCard from '@/components/docs/EndpointCard.vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';

const sessionObject = ref(`{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "machine_id": "550e8400-e29b-41d4-a716-446655440000",
  "mode": "interactive",
  "project_path": "/Users/dev/projects/myapp",
  "initial_prompt": "Help me refactor this codebase",
  "status": "running",
  "is_running": true,
  "is_completed": false,
  "pid": 12345,
  "exit_code": null,
  "pty_size": { "cols": 120, "rows": 40 },
  "total_tokens": 15000,
  "total_cost": 0.45,
  "duration": 3600,
  "formatted_duration": "1h 0m",
  "started_at": "2026-02-02T14:00:00Z",
  "completed_at": null,
  "created_at": "2026-02-02T14:00:00Z",
  "updated_at": "2026-02-02T15:00:00Z"
}`);

// List Sessions
const listParams = [
  { name: 'machine', type: 'uuid', required: true, description: 'Machine ID' },
  { name: 'per_page', type: 'integer', required: false, description: 'Items per page', default: 20 },
];

const listCurl = `curl https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/sessions \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const listJs = `const response = await fetch('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/sessions', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const sessions = await response.json();
console.log(sessions.data);`;

const listPhp = `<?php
$sessions = Http::withToken($token)
    ->get('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/sessions')['data'];`;

const listResponses = {
  '200': {
    success: true,
    data: [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        machine_id: '550e8400-e29b-41d4-a716-446655440000',
        mode: 'interactive',
        status: 'running',
        is_running: true,
        total_tokens: 15000,
        duration: 3600,
        created_at: '2026-02-02T14:00:00Z',
      },
    ],
    meta: {
      timestamp: '2026-02-02T15:30:00Z',
      request_id: 'req_abc',
      pagination: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
    },
  },
};

// Create Session
const createParams = [
  { name: 'machine', type: 'uuid', required: true, description: 'Machine ID' },
  { name: 'mode', type: 'enum', required: false, description: 'Session mode', enum: ['interactive', 'headless', 'oneshot'], default: 'interactive' },
  { name: 'project_path', type: 'string', required: false, description: 'Working directory path' },
  { name: 'initial_prompt', type: 'string', required: false, description: 'Initial prompt to send' },
  { name: 'pty_size', type: 'object', required: false, description: 'Terminal size {cols, rows}', default: { cols: 120, rows: 40 } },
];

const createCurl = `curl -X POST https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/sessions \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mode": "interactive",
    "project_path": "/Users/dev/projects/myapp",
    "initial_prompt": "Help me refactor this codebase",
    "pty_size": { "cols": 120, "rows": 40 }
  }'`;

const createJs = `const response = await fetch('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/sessions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mode: 'interactive',
    project_path: '/Users/dev/projects/myapp',
    initial_prompt: 'Help me refactor this codebase',
    pty_size: { cols: 120, rows: 40 },
  }),
});
const session = await response.json();
console.log(session.data);`;

const createPhp = `<?php
$session = Http::withToken($token)
    ->post('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/sessions', [
        'mode' => 'interactive',
        'project_path' => '/Users/dev/projects/myapp',
        'initial_prompt' => 'Help me refactor this codebase',
        'pty_size' => ['cols' => 120, 'rows' => 40],
    ])['data'];`;

const createResponses = {
  '201': {
    success: true,
    data: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      machine_id: '550e8400-e29b-41d4-a716-446655440000',
      mode: 'interactive',
      project_path: '/Users/dev/projects/myapp',
      status: 'created',
      pty_size: { cols: 120, rows: 40 },
      created_at: '2026-02-02T15:30:00Z',
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_xyz' },
  },
  '400': {
    success: false,
    error: { code: 'MCH_002', message: 'Machine is offline' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_err' },
  },
};

// Get Session
const getParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Session ID' },
];

const getCurl = `curl https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001 \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const getJs = `const response = await fetch('https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const session = await response.json();
console.log(session.data);`;

const getPhp = `<?php
$session = Http::withToken($token)
    ->get('https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001')['data'];`;

const getResponses = {
  '200': {
    success: true,
    data: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      machine_id: '550e8400-e29b-41d4-a716-446655440000',
      mode: 'interactive',
      status: 'running',
      is_running: true,
      total_tokens: 15000,
      total_cost: 0.45,
      duration: 3600,
      recent_logs: [
        { type: 'output', data: 'Refactoring complete!', created_at: '2026-02-02T15:25:00Z' },
      ],
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_123' },
  },
  '404': {
    success: false,
    error: { code: 'SES_001', message: 'Session not found' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_456' },
  },
};

// Terminate Session
const deleteParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Session ID' },
];

const deleteCurl = `curl -X DELETE https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001 \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const deleteJs = `await fetch('https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001', {
  method: 'DELETE',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});`;

const deletePhp = `<?php
Http::withToken($token)
    ->delete('https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001');`;

const deleteResponses = {
  '200': {
    success: true,
    data: null,
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_789' },
  },
  '400': {
    success: false,
    error: { code: 'SES_003', message: 'Session already terminated' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_012' },
  },
};

// Get Logs
const logsParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Session ID' },
  { name: 'per_page', type: 'integer', required: false, description: 'Items per page', default: 100 },
];

const logsCurl = `curl https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001/logs \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const logsJs = `const response = await fetch('https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001/logs', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const logs = await response.json();
console.log(logs.data);`;

const logsPhp = `<?php
$logs = Http::withToken($token)
    ->get('https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001/logs')['data'];`;

const logsResponses = {
  '200': {
    success: true,
    data: [
      {
        id: 'log-1',
        type: 'input',
        data: 'Help me refactor this codebase',
        metadata: {},
        created_at: '2026-02-02T14:00:00Z',
      },
      {
        id: 'log-2',
        type: 'output',
        data: "I'll help you refactor the codebase...",
        metadata: { tokens_used: 500 },
        created_at: '2026-02-02T14:00:05Z',
      },
    ],
    meta: {
      timestamp: '2026-02-02T15:30:00Z',
      request_id: 'req_logs',
      pagination: { current_page: 1, last_page: 1, per_page: 100, total: 2 },
    },
  },
};

// Attach to Session
const attachParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Session ID' },
];

const attachCurl = `curl -X POST https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001/attach \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const attachJs = `const response = await fetch('https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001/attach', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const result = await response.json();
console.log(result.data.ws_token); // Use for WebSocket connection`;

const attachPhp = `<?php
$wsInfo = Http::withToken($token)
    ->post('https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001/attach')['data'];`;

const attachResponses = {
  '200': {
    success: true,
    data: {
      ws_token: 'ws_token_abc123xyz...',
      session_id: '550e8400-e29b-41d4-a716-446655440001',
      ws_url: 'wss://api.claudenest.io:8080',
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_attach' },
  },
  '404': {
    success: false,
    error: { code: 'SES_001', message: 'Session not found or not running' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_err' },
  },
};

// Send Input
const inputParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Session ID' },
  { name: 'data', type: 'string', required: true, description: 'Input data to send' },
];

const inputCurl = `curl -X POST https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001/input \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"data": "Please continue refactoring"}'`;

const inputJs = `await fetch('https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001/input', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ data: 'Please continue refactoring' }),
});`;

const inputPhp = `<?php
Http::withToken($token)
    ->post('https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001/input', [
        'data' => 'Please continue refactoring',
    ]);`;

const inputResponses = {
  '200': {
    success: true,
    data: null,
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_input' },
  },
};

// Resize PTY
const resizeParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Session ID' },
  { name: 'cols', type: 'integer', required: true, description: 'Number of columns (20-500)' },
  { name: 'rows', type: 'integer', required: true, description: 'Number of rows (10-200)' },
];

const resizeCurl = `curl -X POST https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001/resize \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"cols": 150, "rows": 50}'`;

const resizeJs = `await fetch('https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001/resize', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ cols: 150, rows: 50 }),
});`;

const resizePhp = `<?php
Http::withToken($token)
    ->post('https://api.claudenest.io/api/sessions/550e8400-e29b-41d4-a716-446655440001/resize', [
        'cols' => 150,
        'rows' => 50,
    ]);`;

const resizeResponses = {
  '200': {
    success: true,
    data: { pty_size: { cols: 150, rows: 50 } },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_resize' },
  },
};

// WebSocket Example
const websocketExample = ref(`// 1. Get WebSocket token
const attachResponse = await fetch('/api/sessions/{id}/attach', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const { ws_token, ws_url } = await attachResponse.json();

// 2. Connect to WebSocket
const ws = new WebSocket(ws_url);

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: ws_token,
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'SessionOutput':
      console.log('Output:', message.data);
      break;
    case 'SessionInput':
      console.log('Input echoed:', message.data);
      break;
    case 'SessionTerminated':
      console.log('Session ended');
      break;
  }
};

// Send input
function sendInput(data) {
  ws.send(JSON.stringify({
    type: 'input',
    data: data,
  }));
}`);
</script>

<style scoped>
.docs-page {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #a855f7, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 1.1rem;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.section {
  margin-bottom: 2.5rem;
}

h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

p {
  color: #94a3b8;
  line-height: 1.7;
  margin-bottom: 1rem;
}

ul {
  color: #94a3b8;
  line-height: 1.8;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

li {
  margin-bottom: 0.5rem;
}

a {
  color: #c084fc;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

:deep(code) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  color: #c084fc;
  background: rgba(168, 85, 247, 0.1);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

@media (max-width: 640px) {
  h1 {
    font-size: 1.75rem;
  }
}
</style>
