<template>
  <DocsLayout>
    <div class="docs-page">
      <h1>WebSocket Protocol</h1>
      
      <p class="lead">
        Real-time communication for interactive sessions. WebSocket connections enable 
        bidirectional streaming of input/output between clients and Claude Code sessions.
      </p>

      <div class="section">
        <h2>Connection Overview</h2>
        <p>
          ClaudeNest uses WebSocket connections for real-time session interaction:
        </p>
        <ul>
          <li><strong>WebSocket URL:</strong> <code>wss://api.claudenest.io:8080</code></li>
          <li><strong>Protocol:</strong> WSS (WebSocket Secure)</li>
          <li><strong>Authentication:</strong> Token-based via connection message</li>
          <li><strong>Heartbeat:</strong> Ping/pong every 30 seconds</li>
        </ul>
      </div>

      <div class="section">
        <h2>Connecting to a Session</h2>
        <p>
          Before connecting via WebSocket, you must first obtain a WebSocket token:
        </p>
        <CodeBlock language="javascript" :code="connectionFlow" />
      </div>

      <div class="section">
        <h2>WebSocket Events</h2>
        
        <h3>Client to Server</h3>
        <div class="events-grid">
          <div class="event-card client">
            <h4>auth</h4>
            <p>Authenticate with WebSocket token</p>
            <CodeBlock language="json" :code='{"type":"auth","token":"ws_token_abc123"}' />
          </div>
          <div class="event-card client">
            <h4>input</h4>
            <p>Send input to the session</p>
            <CodeBlock language="json" :code='{"type":"input","data":"hello"}' />
          </div>
          <div class="event-card client">
            <h4>resize</h4>
            <p>Resize terminal dimensions</p>
            <CodeBlock language="json" :code='{"type":"resize","cols":150,"rows":50}' />
          </div>
          <div class="event-card client">
            <h4>ping</h4>
            <p>Keep connection alive</p>
            <CodeBlock language="json" :code='{"type":"ping"}' />
          </div>
        </div>

        <h3>Server to Client</h3>
        <div class="events-grid">
          <div class="event-card server">
            <h4>SessionOutput</h4>
            <p>Output from the session</p>
            <CodeBlock language="json" :code="sessionOutputExample" />
          </div>
          <div class="event-card server">
            <h4>SessionInput</h4>
            <p>Input echoed from another client</p>
            <CodeBlock language="json" :code="sessionInputExample" />
          </div>
          <div class="event-card server">
            <h4>SessionTerminated</h4>
            <p>Session has ended</p>
            <CodeBlock language="json" :code="sessionTerminatedExample" />
          </div>
          <div class="event-card server">
            <h4>SessionCreated</h4>
            <p>New session started</p>
            <CodeBlock language="json" :code="sessionCreatedExample" />
          </div>
          <div class="event-card server">
            <h4>SessionResize</h4>
            <p>Terminal was resized</p>
            <CodeBlock language="json" :code="sessionResizeExample" />
          </div>
          <div class="event-card server">
            <h4>pong</h4>
            <p>Heartbeat response</p>
            <CodeBlock language="json" :code='{"type":"pong","timestamp":"2026-02-02T15:30:00Z"}' />
          </div>
          <div class="event-card server error">
            <h4>error</h4>
            <p>Error occurred</p>
            <CodeBlock language="json" :code="errorExample" />
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Complete Example</h2>
        <CodeBlock language="javascript" :code="completeExample" filename="websocket-client.js" />
      </div>

      <div class="section">
        <h2>Channel Subscriptions</h2>
        <p>
          You can subscribe to different channels to receive specific events:
        </p>
        <ul>
          <li><code>session:{id}</code> - Session-specific events (required)</li>
          <li><code>machine:{id}</code> - Machine-level events</li>
          <li><code>project:{id}</code> - Project-level events (tasks, broadcasts)</li>
          <li><code>user:{id}</code> - User-specific notifications</li>
        </ul>
        <CodeBlock language="javascript" :code="subscriptionExample" />
      </div>

      <div class="section">
        <h2>Reconnection Strategy</h2>
        <p>
          Implement exponential backoff for reconnection:
        </p>
        <CodeBlock language="javascript" :code="reconnectionExample" />
      </div>

      <div class="section">
        <h2>Error Handling</h2>
        <p>
          Common WebSocket error codes:
        </p>
        <table class="error-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1000</td>
              <td>Normal closure</td>
            </tr>
            <tr>
              <td>1006</td>
              <td>Abnormal closure (connection lost)</td>
            </tr>
            <tr>
              <td>1008</td>
              <td>Policy violation (invalid token)</td>
            </tr>
            <tr>
              <td>1011</td>
              <td>Server error</td>
            </tr>
            <tr>
              <td>4401</td>
              <td>Unauthorized (invalid/missing token)</td>
            </tr>
            <tr>
              <td>4404</td>
              <td>Session not found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Rate Limits</h2>
        <p>
          WebSocket connections have the following limits:
        </p>
        <ul>
          <li>Maximum 10 concurrent connections per user</li>
          <li>Maximum 100 messages per second per connection</li>
          <li>Messages larger than 1MB will be rejected</li>
          <li>Idle connections are closed after 5 minutes</li>
        </ul>
      </div>
    </div>
  </DocsLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DocsLayout from '@/layouts/DocsLayout.vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';

const connectionFlow = ref(`// 1. Get WebSocket token via HTTP API
const attachResponse = await fetch(
  'https://api.claudenest.io/api/sessions/{id}/attach',
  {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
  }
);
const { ws_token, ws_url } = await attachResponse.json();

// 2. Connect to WebSocket
const ws = new WebSocket(ws_url);

ws.onopen = () => {
  // 3. Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: ws_token,
  }));
};`);

const sessionOutputExample = ref(`{
  "type": "SessionOutput",
  "session_id": "550e8400-e29b-41d4-a716-446655440001",
  "data": "I'll help you refactor the codebase...\\n",
  "timestamp": "2026-02-02T15:30:00Z"
}`);

const sessionInputExample = ref(`{
  "type": "SessionInput",
  "session_id": "550e8400-e29b-41d4-a716-446655440001",
  "data": "hello",
  "timestamp": "2026-02-02T15:30:00Z"
}`);

const sessionTerminatedExample = ref(`{
  "type": "SessionTerminated",
  "session_id": "550e8400-e29b-41d4-a716-446655440001",
  "reason": "completed",
  "exit_code": 0,
  "timestamp": "2026-02-02T15:30:00Z"
}`);

const sessionCreatedExample = ref(`{
  "type": "SessionCreated",
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "machine_id": "550e8400-e29b-41d4-a716-446655440000",
    "mode": "interactive",
    "status": "created"
  },
  "timestamp": "2026-02-02T15:30:00Z"
}`);

const sessionResizeExample = ref(`{
  "type": "SessionResize",
  "session_id": "550e8400-e29b-41d4-a716-446655440001",
  "cols": 150,
  "rows": 50,
  "timestamp": "2026-02-02T15:30:00Z"
}`);

const errorExample = ref(`{
  "type": "error",
  "code": "WS_001",
  "message": "Invalid authentication token",
  "timestamp": "2026-02-02T15:30:00Z"
}`);

const completeExample = ref(`class ClaudeNestWebSocket {
  constructor(wsUrl, token) {
    this.wsUrl = wsUrl;
    this.token = token;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Authenticate
      this.send({ type: 'auth', token: this.token });
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code);
      if (event.code !== 1000) {
        this.reconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleMessage(message) {
    switch (message.type) {
      case 'SessionOutput':
        this.onOutput?.(message.data);
        break;
      case 'SessionInput':
        this.onInput?.(message.data);
        break;
      case 'SessionTerminated':
        this.onTerminated?.(message.reason, message.exit_code);
        break;
      case 'error':
        this.onError?.(message.code, message.message);
        break;
    }
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendInput(data) {
    this.send({ type: 'input', data });
  }

  resize(cols, rows) {
    this.send({ type: 'resize', cols, rows });
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(\`Reconnecting in \${delay}ms...\`);
      setTimeout(() => this.connect(), delay);
    }
  }

  disconnect() {
    this.ws?.close(1000, 'User disconnected');
  }
}

// Usage
const client = new ClaudeNestWebSocket('wss://api.claudenest.io:8080', wsToken);
client.onOutput = (data) => console.log('Output:', data);
client.onTerminated = (reason, code) => console.log('Session ended:', reason);
client.connect();`);

const subscriptionExample = ref(`// Subscribe to project events
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: [
    'session:550e8400-e29b-41d4-a716-446655440001',
    'project:550e8400-e29b-41d4-a716-446655440002'
  ]
}));

// You'll now receive events like:
// - TaskCreated
// - TaskClaimed
// - TaskCompleted
// - FileLocked
// - FileUnlocked
// - ProjectBroadcast`);

const reconnectionExample = ref(`let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const baseDelay = 1000; // 1 second

function connect() {
  const ws = new WebSocket(wsUrl);
  
  ws.onclose = (event) => {
    if (event.code === 1000) return; // Normal closure
    
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, reconnectAttempts) + Math.random() * 1000,
        30000 // Max 30 seconds
      );
      
      console.log(\`Reconnecting in \${Math.round(delay)}ms (attempt \${reconnectAttempts})\`);
      setTimeout(connect, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  };
  
  ws.onopen = () => {
    reconnectAttempts = 0; // Reset on successful connection
  };
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
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-cyan, #22d3ee));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.section {
  margin-bottom: 2.5rem;
}

h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color, var(--border));
}

h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 1.5rem 0 0.75rem 0;
}

h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1rem;
}

ul {
  color: var(--text-secondary);
  line-height: 1.8;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

li {
  margin-bottom: 0.5rem;
}

:deep(code) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  color: var(--accent-purple-light, #c084fc);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.event-card {
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, var(--border));
}

.event-card.client {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.event-card.server {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.event-card.server.error {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.event-card h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.event-card.client h4::before {
  content: '→';
  color: #60a5fa;
}

.event-card.server h4::before {
  content: '←';
  color: #4ade80;
}

.event-card p {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
}

.error-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.error-table th {
  text-align: left;
  padding: 0.75rem;
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.error-table td {
  padding: 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  color: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
}

.error-table tr:hover td {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
}

@media (max-width: 640px) {
  h1 {
    font-size: 1.75rem;
  }

  .events-grid {
    grid-template-columns: 1fr;
  }
}
</style>
