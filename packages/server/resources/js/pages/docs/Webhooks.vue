<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>Webhooks & Events</h1>
      <p class="lead">
        Subscribe to real-time events via WebSockets or HTTP webhooks to build 
        reactive applications and integrations.
      </p>
    </header>

    <section id="websocket-events">
      <h2>WebSocket Events</h2>
      <p>
        ClaudeNest uses Laravel Reverb for real-time event streaming. WebSockets provide 
        the lowest latency for session interactions.
      </p>

      <h3>Connection</h3>
      <CodeBlock 
        :code="wsConnectionCode" 
        language="javascript"
      />

      <h3>Authentication</h3>
      <p>After connecting, authenticate with your attachment token:</p>
      <CodeBlock 
        :code="wsAuthCode" 
        language="javascript"
      />

      <h3>Message Types</h3>
      <div class="message-types">
        <div class="message-type">
          <h4>Input</h4>
          <p>Send user input to the session</p>
          <CodeBlock 
            :code="msgInputCode" 
            language="json"
          />
        </div>

        <div class="message-type">
          <h4>Output</h4>
          <p>Receive terminal output from Claude</p>
          <CodeBlock 
            :code="msgOutputCode" 
            language="json"
          />
        </div>

        <div class="message-type">
          <h4>Resize</h4>
          <p>Resize the terminal</p>
          <CodeBlock 
            :code="msgResizeCode" 
            language="json"
          />
        </div>

        <div class="message-type">
          <h4>Status</h4>
          <p>Session status updates</p>
          <CodeBlock 
            :code="msgStatusCode" 
            language="json"
          />
        </div>
      </div>
    </section>

    <section id="broadcast-events">
      <h2>Broadcast Events</h2>
      <p>Events are broadcast to connected clients for real-time updates:</p>

      <h3>Session Events</h3>
      <table class="events-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Description</th>
            <th>Payload</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>SessionCreated</code></td>
            <td>New session created</td>
            <td>Session object</td>
          </tr>
          <tr>
            <td><code>SessionStarted</code></td>
            <td>Session started running</td>
            <td>{ session_id, pid }</td>
          </tr>
          <tr>
            <td><code>SessionTerminated</code></td>
            <td>Session ended</td>
            <td>{ session_id, exit_code }</td>
          </tr>
          <tr>
            <td><code>SessionInput</code></td>
            <td>Input sent to session</td>
            <td>{ session_id, data }</td>
          </tr>
          <tr>
            <td><code>SessionOutput</code></td>
            <td>Output from session</td>
            <td>{ session_id, data }</td>
          </tr>
          <tr>
            <td><code>SessionResize</code></td>
            <td>Terminal resized</td>
            <td>{ session_id, cols, rows }</td>
          </tr>
        </tbody>
      </table>

      <h3>Project Events</h3>
      <table class="events-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Description</th>
            <th>Payload</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>ProjectBroadcast</code></td>
            <td>Message broadcast to project</td>
            <td>{ message, sender }</td>
          </tr>
          <tr>
            <td><code>TaskCreated</code></td>
            <td>New task created</td>
            <td>Task object</td>
          </tr>
          <tr>
            <td><code>TaskClaimed</code></td>
            <td>Task claimed by instance</td>
            <td>{ task_id, instance_id }</td>
          </tr>
          <tr>
            <td><code>TaskReleased</code></td>
            <td>Task released</td>
            <td>{ task_id, reason }</td>
          </tr>
          <tr>
            <td><code>TaskCompleted</code></td>
            <td>Task marked complete</td>
            <td>{ task_id, summary }</td>
          </tr>
          <tr>
            <td><code>FileLocked</code></td>
            <td>File locked</td>
            <td>{ path, locked_by }</td>
          </tr>
          <tr>
            <td><code>FileUnlocked</code></td>
            <td>File unlocked</td>
            <td>{ path, forced }</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section id="http-webhooks">
      <h2>HTTP Webhooks</h2>
      <p>Configure HTTP webhooks to receive events at your endpoints.</p>

      <h3>Webhook Configuration</h3>
      <p>Set up webhooks in your server configuration or via the API:</p>
      <CodeBlock 
        :code="webhookConfigCode" 
        language="json"
      />

      <h3>Webhook Payload</h3>
      <p>All webhooks follow a consistent format:</p>
      <CodeBlock 
        :code="webhookPayloadCode" 
        language="json"
      />

      <h3>Webhook Verification</h3>
      <p>Verify webhook signatures to ensure authenticity:</p>
      <CodeBlock 
        :code="webhookVerifyCode" 
        language="javascript"
      />

      <h3>Retry Policy</h3>
      <p>Webhooks are retried with exponential backoff if your endpoint returns an error:</p>
      <ul>
        <li>Initial attempt: Immediate</li>
        <li>Retry 1: 5 seconds</li>
        <li>Retry 2: 25 seconds</li>
        <li>Retry 3: 2 minutes</li>
        <li>Retry 4: 10 minutes</li>
        <li>Max retries: 5 attempts over ~12 hours</li>
      </ul>
    </section>

    <section id="sdk-integration">
      <h2>SDK Integration</h2>
      <p>Use the official SDKs for easier event handling:</p>

      <h3>JavaScript SDK</h3>
      <CodeBlock 
        :code="sdkIntegrationCode" 
        language="javascript"
      />
    </section>
  </article>
</template>

<script setup lang="ts">
import CodeBlock from '@/components/docs/CodeBlock.vue';

const wsConnectionCode = `// Connect to WebSocket server
const ws = new WebSocket('wss://claudenest.yourdomain.com:8080');

ws.onopen = () => {
  console.log('Connected to ClaudeNest');
};

ws.onclose = () => {
  console.log('Disconnected from ClaudeNest');
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};`;

const wsAuthCode = `ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'ws_token_from_attach_endpoint'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'auth_success') {
    console.log('Authenticated successfully');
  }
};`;

const msgInputCode = `{
  "type": "input",
  "data": "Your message here\\n"
}`;

const msgOutputCode = `{
  "type": "output",
  "data": "I'll help you with that...",
  "timestamp": "2026-02-02T17:00:00Z"
}`;

const msgResizeCode = `{
  "type": "resize",
  "cols": 150,
  "rows": 50
}`;

const msgStatusCode = `{
  "type": "status",
  "status": "running",
  "message": "Session started"
}`;

const webhookConfigCode = `// Example webhook configuration
{
  "url": "https://your-app.com/webhooks/claudenest",
  "events": [
    "session.created",
    "session.terminated",
    "task.completed"
  ],
  "secret": "webhook-signing-secret",
  "active": true
}`;

const webhookPayloadCode = `{
  "id": "evt_1234567890",
  "type": "session.created",
  "created_at": "2026-02-02T17:00:00Z",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "machine_id": "550e8400-e29b-41d4-a716-446655440001",
    "mode": "interactive",
    "status": "created"
  }
}`;

const webhookVerifyCode = `const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Express example
app.post('/webhooks/claudenest', (req, res) => {
  const signature = req.headers['x-claudenest-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!verifyWebhook(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process the webhook
  handleEvent(req.body);
  
  res.status(200).send('OK');
});`;

const sdkIntegrationCode = `import { ClaudeNestClient } from '@claudenest/sdk';

const client = new ClaudeNestClient({
  baseUrl: 'https://claudenest.yourdomain.com',
  token: 'your-api-token'
});

// Subscribe to events
client.events.on('session.created', (session) => {
  console.log('New session:', session);
});

client.events.on('task.completed', (task) => {
  console.log('Task completed:', task);
});

// Connect to WebSocket
await client.events.connect();

// Subscribe to specific session
const session = await client.sessions.get('session-id');
session.onOutput((data) => {
  console.log('Output:', data);
});

session.onStatusChange((status) => {
  console.log('Status:', status);
});`;
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

h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
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

/* Message Types */
.message-types {
  display: grid;
  gap: 1.5rem;
  margin-top: 1rem;
}

.message-type {
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.message-type h4 {
  color: #a855f7;
}

.message-type p {
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

/* Events Table */
.events-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.events-table th,
.events-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.events-table th {
  font-weight: 600;
  color: #64748b;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.events-table td {
  color: #a9b1d6;
}

.events-table code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: #22d3ee;
  background: rgba(34, 211, 238, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
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
  
  .events-table {
    font-size: 0.8rem;
  }
  
  .events-table th,
  .events-table td {
    padding: 0.5rem;
  }
}
</style>
