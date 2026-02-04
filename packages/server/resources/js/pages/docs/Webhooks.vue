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
        :code="`// Connect to WebSocket server
const ws = new WebSocket('wss://claudenest.yourdomain.com:8080');\n\nws.onopen = () => {\n  console.log('Connected to ClaudeNest');\n};\n\nws.onclose = () => {\n  console.log('Disconnected from ClaudeNest');\n};\n\nws.onerror = (error) => {\n  console.error('WebSocket error:', error);\n};`" 
        language="javascript"
      />

      <h3>Authentication</h3>
      <p>After connecting, authenticate with your attachment token:</p>
      <CodeBlock 
        :code="`ws.onopen = () => {\n  // Authenticate\n  ws.send(JSON.stringify({\n    type: 'auth',\n    token: 'ws_token_from_attach_endpoint'\n  }));\n};\n\nws.onmessage = (event) => {\n  const message = JSON.parse(event.data);\n  \n  if (message.type === 'auth_success') {\n    console.log('Authenticated successfully');\n  }\n};`" 
        language="javascript"
      />

      <h3>Message Types</h3>
      <div class="message-types">
        <div class="message-type">
          <h4>Input</h4>
          <p>Send user input to the session</p>
          <CodeBlock 
            :code="`{\n  \"type\": \"input\",\n  \"data\": \"Your message here\\n\"\n}`" 
            language="json"
          />
        </div>

        <div class="message-type">
          <h4>Output</h4>
          <p>Receive terminal output from Claude</p>
          <CodeBlock 
            :code="`{\n  \"type\": \"output\",\n  \"data\": \"I'll help you with that...\",\n  \"timestamp\": \"2026-02-02T17:00:00Z\"\n}`" 
            language="json"
          />
        </div>

        <div class="message-type">
          <h4>Resize</h4>
          <p>Resize the terminal</p>
          <CodeBlock 
            :code="`{\n  \"type\": \"resize\",\n  \"cols\": 150,\n  \"rows\": 50\n}`" 
            language="json"
          />
        </div>

        <div class="message-type">
          <h4>Status</h4>
          <p>Session status updates</p>
          <CodeBlock 
            :code="`{\n  \"type\": \"status\",\n  \"status\": \"running\",\n  \"message\": \"Session started\"\n}`" 
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
        :code="`// Example webhook configuration
{\n  \"url\": \"https://your-app.com/webhooks/claudenest\",\n  \"events\": [\n    \"session.created\",\n    \"session.terminated\",\n    \"task.completed\"\n  ],\n  \"secret\": \"webhook-signing-secret\",\n  \"active\": true\n}`" 
        language="json"
      />

      <h3>Webhook Payload</h3>
      <p>All webhooks follow a consistent format:</p>
      <CodeBlock 
        :code="`{\n  \"id\": \"evt_1234567890\",\n  \"type\": \"session.created\",\n  \"created_at\": \"2026-02-02T17:00:00Z\",\n  \"data\": {\n    \"id\": \"550e8400-e29b-41d4-a716-446655440002\",\n    \"machine_id\": \"550e8400-e29b-41d4-a716-446655440001\",\n    \"mode\": \"interactive\",\n    \"status\": \"created\"\n  }\n}`" 
        language="json"
      />

      <h3>Webhook Verification</h3>
      <p>Verify webhook signatures to ensure authenticity:</p>
      <CodeBlock 
        :code="`const crypto = require('crypto');\n\nfunction verifyWebhook(payload, signature, secret) {\n  const expected = crypto\n    .createHmac('sha256', secret)\n    .update(payload)\n    .digest('hex');\n  \n  return crypto.timingSafeEqual(\n    Buffer.from(signature),\n    Buffer.from(expected)\n  );\n}\n\n// Express example\napp.post('/webhooks/claudenest', (req, res) => {\n  const signature = req.headers['x-claudenest-signature'];\n  const payload = JSON.stringify(req.body);\n  \n  if (!verifyWebhook(payload, signature, WEBHOOK_SECRET)) {\n    return res.status(401).send('Invalid signature');\n  }\n  \n  // Process the webhook\n  handleEvent(req.body);\n  \n  res.status(200).send('OK');\n});`" 
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
        :code="`import { ClaudeNestClient } from '@claudenest/sdk';\n\nconst client = new ClaudeNestClient({\n  baseUrl: 'https://claudenest.yourdomain.com',\n  token: 'your-api-token'\n});\n\n// Subscribe to events\nclient.events.on('session.created', (session) => {\n  console.log('New session:', session);\n});\n\nclient.events.on('task.completed', (task) => {\n  console.log('Task completed:', task);\n});\n\n// Connect to WebSocket\nawait client.events.connect();\n\n// Subscribe to specific session\nconst session = await client.sessions.get('session-id');\nsession.onOutput((data) => {\n  console.log('Output:', data);\n});\n\nsession.onStatusChange((status) => {\n  console.log('Status:', status);\n});`" 
        language="javascript"
      />
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
