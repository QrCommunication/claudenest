<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ $t('docDocsWebhooks.title') }}</h1>
      <p class="lead">
        {{ $t('docDocsWebhooks.lead') }}
      </p>
    </header>

    <section id="websocket-events">
      <h2>{{ $t('docDocsWebhooks.websocketEventsHeading') }}</h2>
      <p>
        {{ $t('docDocsWebhooks.websocketEventsIntro') }}
      </p>

      <h3>{{ $t('docDocsWebhooks.connectionHeading') }}</h3>
      <CodeBlock 
        :code="wsConnectionCode" 
        language="javascript"
      />

      <h3>{{ $t('docDocsWebhooks.authenticationHeading') }}</h3>
      <p>{{ $t('docDocsWebhooks.authenticationIntro') }}</p>
      <CodeBlock 
        :code="wsAuthCode" 
        language="javascript"
      />

      <h3>{{ $t('docDocsWebhooks.messageTypesHeading') }}</h3>
      <div class="message-types">
        <div class="message-type">
          <h4>{{ $t('docDocsWebhooks.inputHeading') }}</h4>
          <p>{{ $t('docDocsWebhooks.inputDesc') }}</p>
          <CodeBlock 
            :code="msgInputCode" 
            language="json"
          />
        </div>

        <div class="message-type">
          <h4>{{ $t('docDocsWebhooks.outputHeading') }}</h4>
          <p>{{ $t('docDocsWebhooks.outputDesc') }}</p>
          <CodeBlock 
            :code="msgOutputCode" 
            language="json"
          />
        </div>

        <div class="message-type">
          <h4>{{ $t('docDocsWebhooks.resizeHeading') }}</h4>
          <p>{{ $t('docDocsWebhooks.resizeDesc') }}</p>
          <CodeBlock 
            :code="msgResizeCode" 
            language="json"
          />
        </div>

        <div class="message-type">
          <h4>{{ $t('docDocsWebhooks.statusHeading') }}</h4>
          <p>{{ $t('docDocsWebhooks.statusDesc') }}</p>
          <CodeBlock 
            :code="msgStatusCode" 
            language="json"
          />
        </div>
      </div>
    </section>

    <section id="broadcast-events">
      <h2>{{ $t('docDocsWebhooks.broadcastEventsHeading') }}</h2>
      <p>{{ $t('docDocsWebhooks.broadcastEventsIntro') }}</p>

      <h3>{{ $t('docDocsWebhooks.sessionEventsHeading') }}</h3>
      <table class="events-table">
        <thead>
          <tr>
            <th>{{ $t('docDocsWebhooks.colEvent') }}</th>
            <th>{{ $t('docDocsWebhooks.colDescription') }}</th>
            <th>{{ $t('docDocsWebhooks.colPayload') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>SessionCreated</code></td>
            <td>{{ $t('docDocsWebhooks.evtSessionCreatedDesc') }}</td>
            <td>{{ $t('docDocsWebhooks.payloadSessionObject') }}</td>
          </tr>
          <tr>
            <td><code>SessionStarted</code></td>
            <td>{{ $t('docDocsWebhooks.evtSessionStartedDesc') }}</td>
            <td>{ session_id, pid }</td>
          </tr>
          <tr>
            <td><code>SessionTerminated</code></td>
            <td>{{ $t('docDocsWebhooks.evtSessionTerminatedDesc') }}</td>
            <td>{ session_id, exit_code }</td>
          </tr>
          <tr>
            <td><code>SessionInput</code></td>
            <td>{{ $t('docDocsWebhooks.evtSessionInputDesc') }}</td>
            <td>{ session_id, data }</td>
          </tr>
          <tr>
            <td><code>SessionOutput</code></td>
            <td>{{ $t('docDocsWebhooks.evtSessionOutputDesc') }}</td>
            <td>{ session_id, data }</td>
          </tr>
          <tr>
            <td><code>SessionResize</code></td>
            <td>{{ $t('docDocsWebhooks.evtSessionResizeDesc') }}</td>
            <td>{ session_id, cols, rows }</td>
          </tr>
        </tbody>
      </table>

      <h3>{{ $t('docDocsWebhooks.projectEventsHeading') }}</h3>
      <table class="events-table">
        <thead>
          <tr>
            <th>{{ $t('docDocsWebhooks.colEvent') }}</th>
            <th>{{ $t('docDocsWebhooks.colDescription') }}</th>
            <th>{{ $t('docDocsWebhooks.colPayload') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>ProjectBroadcast</code></td>
            <td>{{ $t('docDocsWebhooks.evtProjectBroadcastDesc') }}</td>
            <td>{ message, sender }</td>
          </tr>
          <tr>
            <td><code>TaskCreated</code></td>
            <td>{{ $t('docDocsWebhooks.evtTaskCreatedDesc') }}</td>
            <td>{{ $t('docDocsWebhooks.payloadTaskObject') }}</td>
          </tr>
          <tr>
            <td><code>TaskClaimed</code></td>
            <td>{{ $t('docDocsWebhooks.evtTaskClaimedDesc') }}</td>
            <td>{ task_id, instance_id }</td>
          </tr>
          <tr>
            <td><code>TaskReleased</code></td>
            <td>{{ $t('docDocsWebhooks.evtTaskReleasedDesc') }}</td>
            <td>{ task_id, reason }</td>
          </tr>
          <tr>
            <td><code>TaskCompleted</code></td>
            <td>{{ $t('docDocsWebhooks.evtTaskCompletedDesc') }}</td>
            <td>{ task_id, summary }</td>
          </tr>
          <tr>
            <td><code>FileLocked</code></td>
            <td>{{ $t('docDocsWebhooks.evtFileLockedDesc') }}</td>
            <td>{ path, locked_by }</td>
          </tr>
          <tr>
            <td><code>FileUnlocked</code></td>
            <td>{{ $t('docDocsWebhooks.evtFileUnlockedDesc') }}</td>
            <td>{ path, forced }</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section id="http-webhooks">
      <h2>{{ $t('docDocsWebhooks.httpWebhooksHeading') }}</h2>
      <p>{{ $t('docDocsWebhooks.httpWebhooksIntro') }}</p>

      <h3>{{ $t('docDocsWebhooks.webhookConfigurationHeading') }}</h3>
      <p>{{ $t('docDocsWebhooks.webhookConfigurationIntro') }}</p>
      <CodeBlock 
        :code="webhookConfigCode" 
        language="json"
      />

      <h3>{{ $t('docDocsWebhooks.webhookPayloadHeading') }}</h3>
      <p>{{ $t('docDocsWebhooks.webhookPayloadIntro') }}</p>
      <CodeBlock 
        :code="webhookPayloadCode" 
        language="json"
      />

      <h3>{{ $t('docDocsWebhooks.webhookVerificationHeading') }}</h3>
      <p>{{ $t('docDocsWebhooks.webhookVerificationIntro') }}</p>
      <CodeBlock 
        :code="webhookVerifyCode" 
        language="javascript"
      />

      <h3>{{ $t('docDocsWebhooks.retryPolicyHeading') }}</h3>
      <p>{{ $t('docDocsWebhooks.retryPolicyIntro') }}</p>
      <ul>
        <li>{{ $t('docDocsWebhooks.retryInitial') }}</li>
        <li>{{ $t('docDocsWebhooks.retry1') }}</li>
        <li>{{ $t('docDocsWebhooks.retry2') }}</li>
        <li>{{ $t('docDocsWebhooks.retry3') }}</li>
        <li>{{ $t('docDocsWebhooks.retry4') }}</li>
        <li>{{ $t('docDocsWebhooks.retryMax') }}</li>
      </ul>
    </section>

    <section id="sdk-integration">
      <h2>{{ $t('docDocsWebhooks.sdkIntegrationHeading') }}</h2>
      <p>{{ $t('docDocsWebhooks.sdkIntegrationIntro') }}</p>

      <h3>{{ $t('docDocsWebhooks.javascriptSdkHeading') }}</h3>
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

h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
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

/* Message Types */
.message-types {
  display: grid;
  gap: 1.5rem;
  margin-top: 1rem;
}

.message-type {
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
}

.message-type h4 {
  color: var(--accent-purple, #a855f7);
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
  border-bottom: 1px solid var(--border-color, var(--border));
}

.events-table th {
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.events-table td {
  color: var(--text-secondary);
}

.events-table code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--accent-cyan, #22d3ee);
  background: rgba(34, 211, 238, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
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
  
  .events-table {
    font-size: 0.8rem;
  }
  
  .events-table th,
  .events-table td {
    padding: 0.5rem;
  }
}
</style>
