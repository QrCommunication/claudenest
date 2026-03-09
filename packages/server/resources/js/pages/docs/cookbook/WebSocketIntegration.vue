<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>WebSocket Integration</h1>
      <p class="lead">
        Connect to ClaudeNest in real time using Laravel Reverb WebSockets.
        Stream terminal output, send input, and coordinate multi-agent tasks
        through private channels with automatic reconnection.
      </p>
    </header>

    <section id="overview">
      <h2>Overview</h2>
      <p>
        ClaudeNest uses <strong>Laravel Reverb</strong> as its WebSocket server, providing
        real-time bidirectional communication between clients and Claude Code sessions.
        The WebSocket layer handles terminal I/O streaming, session lifecycle events,
        task coordination, and file lock notifications.
      </p>

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>When to use WebSockets</h4>
          <p>
            Use WebSockets for interactive sessions and real-time updates. For one-shot
            commands or polling-based workflows, the REST API may be more appropriate.
          </p>
        </div>
      </div>

      <h3>Architecture</h3>
      <p>
        The WebSocket stack consists of three layers:
      </p>
      <ul>
        <li><strong>Laravel Reverb</strong> - WebSocket server running on port 8080</li>
        <li><strong>Laravel Echo</strong> - Client-side library for channel subscriptions</li>
        <li><strong>Pusher Protocol</strong> - Wire protocol for message framing</li>
      </ul>
    </section>

    <section id="connecting">
      <h2>Connecting</h2>
      <p>
        Install the required client libraries and configure your Echo instance
        to connect to the Reverb server.
      </p>

      <h3>Install Dependencies</h3>
      <CodeBlock :code="installDeps" language="bash" />

      <h3>Initialize Echo</h3>
      <p>
        Create an Echo instance pointing to your Reverb server. The configuration
        uses the Pusher-compatible protocol that Reverb implements.
      </p>
      <CodeTabs :tabs="echoConfigTabs" />

      <h3>Attach to a Session</h3>
      <p>
        Before subscribing to WebSocket channels, obtain a WebSocket token by
        attaching to an existing session via the REST API:
      </p>
      <CodeBlock :code="attachCode" language="typescript" filename="attach-session.ts" />
    </section>

    <section id="channels">
      <h2>Private Channels</h2>
      <p>
        All ClaudeNest channels are private and require authentication. The server
        verifies that the authenticated user owns the resource before granting access.
      </p>

      <h3>Available Channels</h3>
      <table class="channels-table">
        <thead>
          <tr>
            <th>Channel</th>
            <th>Description</th>
            <th>Events</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>sessions.{id}</code></td>
            <td>Terminal I/O and session lifecycle</td>
            <td>output, input, resize, terminated</td>
          </tr>
          <tr>
            <td><code>projects.{id}</code></td>
            <td>Multi-agent coordination</td>
            <td>task.created, task.claimed, broadcast</td>
          </tr>
          <tr>
            <td><code>machines.{id}</code></td>
            <td>Machine status and session creation</td>
            <td>session.created, status.changed</td>
          </tr>
          <tr>
            <td><code>users.{id}</code></td>
            <td>User-level notifications</td>
            <td>notification, alert</td>
          </tr>
        </tbody>
      </table>

      <h3>Subscribing to Channels</h3>
      <CodeBlock :code="channelSubscription" language="typescript" filename="subscribe-channels.ts" />

      <h3>Channel Authorization</h3>
      <p>
        Channel authorization is handled automatically by Laravel Sanctum.
        The broadcasting routes verify ownership through Eloquent relationships:
      </p>
      <CodeBlock :code="channelAuthCode" language="php" filename="channels.php" />
    </section>

    <section id="events">
      <h2>Event Types</h2>
      <p>
        Events are broadcast using Laravel's event system. Each event includes
        a timestamp and the relevant resource identifiers.
      </p>

      <h3>Session Events</h3>
      <div class="events-grid">
        <div class="event-card">
          <h4>session.output</h4>
          <p>Terminal output from a Claude Code session. Streamed in real time as the agent produces output.</p>
          <CodeBlock :code="eventSessionOutput" language="json" />
        </div>
        <div class="event-card">
          <h4>session.input</h4>
          <p>User input sent to the session. Echoed to all connected clients for shared viewing.</p>
          <CodeBlock :code="eventSessionInput" language="json" />
        </div>
        <div class="event-card">
          <h4>session.terminated</h4>
          <p>Session has ended, either normally or due to an error.</p>
          <CodeBlock :code="eventSessionTerminated" language="json" />
        </div>
      </div>

      <h3>Task Events</h3>
      <div class="events-grid">
        <div class="event-card">
          <h4>task.created</h4>
          <p>A new task was added to the project task queue.</p>
          <CodeBlock :code="eventTaskCreated" language="json" />
        </div>
        <div class="event-card">
          <h4>task.claimed</h4>
          <p>A Claude instance has claimed a task for execution.</p>
          <CodeBlock :code="eventTaskClaimed" language="json" />
        </div>
        <div class="event-card">
          <h4>task.completed</h4>
          <p>A task has been completed with a summary and list of modified files.</p>
          <CodeBlock :code="eventTaskCompleted" language="json" />
        </div>
      </div>

      <h3>File Lock Events</h3>
      <div class="events-grid">
        <div class="event-card">
          <h4>file.locked</h4>
          <p>A file has been locked by a Claude instance to prevent conflicts.</p>
          <CodeBlock :code="eventFileLocked" language="json" />
        </div>
        <div class="event-card">
          <h4>file.unlocked</h4>
          <p>A file lock has been released and is available for editing.</p>
          <CodeBlock :code="eventFileUnlocked" language="json" />
        </div>
      </div>

      <h3>Listening to Events</h3>
      <CodeBlock :code="listeningExample" language="typescript" filename="event-listener.ts" />
    </section>

    <section id="reconnection">
      <h2>Reconnection Strategy</h2>
      <p>
        Network interruptions are inevitable. Implement exponential backoff
        with jitter to avoid thundering herd problems when the server recovers.
      </p>

      <div class="tip">
        <span class="tip-icon">!</span>
        <div>
          <h4>Built-in Reconnection</h4>
          <p>
            Laravel Echo handles basic reconnection automatically. The strategy
            below is for custom WebSocket clients or when you need finer control.
          </p>
        </div>
      </div>

      <h3>Exponential Backoff with Jitter</h3>
      <CodeBlock :code="reconnectionCode" language="typescript" filename="reconnect-strategy.ts" />

      <h3>State Recovery</h3>
      <p>
        After reconnecting, you may need to re-subscribe to channels and
        fetch any events that were missed during the disconnection window:
      </p>
      <CodeBlock :code="stateRecoveryCode" language="typescript" filename="state-recovery.ts" />

      <h3>Connection Lifecycle</h3>
      <p>Monitor the connection state and display status to users:</p>
      <CodeBlock :code="connectionLifecycle" language="typescript" filename="connection-status.ts" />
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const installDeps = ref(`npm install laravel-echo pusher-js`);

const echoConfigTabs = ref([
  {
    label: 'Vue.js',
    language: 'typescript',
    filename: 'echo.ts',
    code: `import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally for Echo
window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT,
  wssPort: import.meta.env.VITE_REVERB_PORT,
  forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
  authEndpoint: '/broadcasting/auth',
  auth: {
    headers: {
      Authorization: \`Bearer \${token}\`,
    },
  },
});

export default echo;`,
  },
  {
    label: 'React Native',
    language: 'typescript',
    filename: 'echo.ts',
    code: `import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';

const echo = new Echo({
  broadcaster: 'reverb',
  key: 'your-reverb-app-key',
  wsHost: 'api.claudenest.io',
  wsPort: 8080,
  wssPort: 8080,
  forceTLS: true,
  enabledTransports: ['ws', 'wss'],
  auth: {
    headers: {
      Authorization: \`Bearer \${token}\`,
    },
  },
});

export default echo;`,
  },
  {
    label: 'Vanilla JS',
    language: 'javascript',
    filename: 'echo.js',
    code: `import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: 'reverb',
  key: 'your-reverb-app-key',
  wsHost: 'api.claudenest.io',
  wsPort: 8080,
  forceTLS: true,
  enabledTransports: ['ws', 'wss'],
  authEndpoint: 'https://api.claudenest.io/broadcasting/auth',
  auth: {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  },
});`,
  },
]);

const attachCode = ref(`import api from '@/utils/api';

// Attach to a session to get the WebSocket token
const response = await api.post(\`/sessions/\${sessionId}/attach\`);

const { ws_token, ws_url } = response.data.data;

// Use ws_token to authenticate the WebSocket connection
// The token is short-lived and scoped to the specific session`);

const channelSubscription = ref(`import echo from './echo';

// Subscribe to session events (terminal I/O)
echo.private(\`sessions.\${sessionId}\`)
  .listen('.session.output', (event) => {
    terminal.write(event.data);
  })
  .listen('.session.input', (event) => {
    // Input from another connected client
    console.log('Remote input:', event.data);
  })
  .listen('.session.terminated', (event) => {
    console.log('Session ended:', event.reason);
  });

// Subscribe to project events (multi-agent)
echo.private(\`projects.\${projectId}\`)
  .listen('.task.created', (event) => {
    taskList.push(event.task);
  })
  .listen('.task.claimed', (event) => {
    updateTaskStatus(event.task_id, 'in_progress');
  })
  .listen('.file.locked', (event) => {
    markFileLocked(event.path, event.locked_by);
  });`);

const channelAuthCode = ref(`<?php
// routes/channels.php

use App\\Models\\Session;
use App\\Models\\SharedProject;

Broadcast::channel('sessions.{session}', function ($user, Session $session) {
    return $user->id === $session->user_id;
});

Broadcast::channel('projects.{project}', function ($user, SharedProject $project) {
    return $user->id === $project->user_id;
});

Broadcast::channel('machines.{machine}', function ($user, $machine) {
    return $user->machines()->where('id', $machine->id)->exists();
});

Broadcast::channel('users.{id}', function ($user, string $id) {
    return $user->id === $id;
});`);

const eventSessionOutput = ref(`{
  "session_id": "550e8400-e29b-41d4-a716-446655440001",
  "data": "Analyzing the codebase structure...\\n",
  "chunk_id": "chunk_abc123",
  "timestamp": "2026-02-17T10:30:00Z"
}`);

const eventSessionInput = ref(`{
  "session_id": "550e8400-e29b-41d4-a716-446655440001",
  "data": "refactor the auth module",
  "timestamp": "2026-02-17T10:30:05Z"
}`);

const eventSessionTerminated = ref(`{
  "session_id": "550e8400-e29b-41d4-a716-446655440001",
  "reason": "completed",
  "exit_code": 0,
  "timestamp": "2026-02-17T10:35:00Z"
}`);

const eventTaskCreated = ref(`{
  "task": {
    "id": "660e8400-e29b-41d4-a716-446655440010",
    "project_id": "770e8400-e29b-41d4-a716-446655440020",
    "title": "Implement user settings page",
    "priority": "high",
    "status": "pending"
  },
  "timestamp": "2026-02-17T10:30:00Z"
}`);

const eventTaskClaimed = ref(`{
  "task_id": "660e8400-e29b-41d4-a716-446655440010",
  "instance_id": "claude-instance-001",
  "claimed_at": "2026-02-17T10:30:15Z",
  "timestamp": "2026-02-17T10:30:15Z"
}`);

const eventTaskCompleted = ref(`{
  "task_id": "660e8400-e29b-41d4-a716-446655440010",
  "instance_id": "claude-instance-001",
  "summary": "Implemented settings page with theme toggle and locale selector",
  "files_modified": ["src/pages/Settings.vue", "src/stores/settings.ts"],
  "timestamp": "2026-02-17T10:45:00Z"
}`);

const eventFileLocked = ref(`{
  "project_id": "770e8400-e29b-41d4-a716-446655440020",
  "path": "src/auth/login.ts",
  "locked_by": "claude-instance-001",
  "expires_at": "2026-02-17T11:00:00Z",
  "timestamp": "2026-02-17T10:30:00Z"
}`);

const eventFileUnlocked = ref(`{
  "project_id": "770e8400-e29b-41d4-a716-446655440020",
  "path": "src/auth/login.ts",
  "released_by": "claude-instance-001",
  "timestamp": "2026-02-17T10:45:00Z"
}`);

const listeningExample = ref(`import echo from './echo';

interface SessionOutputEvent {
  session_id: string;
  data: string;
  chunk_id: string | null;
  timestamp: string;
}

interface TaskEvent {
  task_id: string;
  instance_id: string;
  timestamp: string;
}

// Type-safe event listeners
echo.private(\`sessions.\${sessionId}\`)
  .listen('.session.output', (e: SessionOutputEvent) => {
    terminal.write(e.data);
  });

echo.private(\`projects.\${projectId}\`)
  .listen('.task.claimed', (e: TaskEvent) => {
    showNotification(\`Task claimed by \${e.instance_id}\`);
  })
  .listen('.task.completed', (e: TaskEvent & { summary: string }) => {
    showNotification(\`Task completed: \${e.summary}\`);
    refreshTaskList();
  });`);

const reconnectionCode = ref(`class ReconnectingWebSocket {
  private ws: WebSocket | null = null;
  private attempts = 0;
  private maxAttempts = 10;
  private baseDelay = 1000;   // 1 second
  private maxDelay = 30000;   // 30 seconds

  connect(url: string): void {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.attempts = 0; // Reset on successful connection
      this.onConnected();
    };

    this.ws.onclose = (event) => {
      if (event.code === 1000) return; // Normal closure

      this.scheduleReconnect(url);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleReconnect(url: string): void {
    if (this.attempts >= this.maxAttempts) {
      this.onMaxAttemptsReached();
      return;
    }

    this.attempts++;

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s, 30s...
    const exponentialDelay = this.baseDelay * Math.pow(2, this.attempts - 1);

    // Add jitter (0-1000ms) to prevent thundering herd
    const jitter = Math.random() * 1000;

    const delay = Math.min(exponentialDelay + jitter, this.maxDelay);

    console.log(\`Reconnecting in \${Math.round(delay)}ms (attempt \${this.attempts}/\${this.maxAttempts})\`);
    setTimeout(() => this.connect(url), delay);
  }

  disconnect(): void {
    this.ws?.close(1000, 'Client disconnected');
    this.ws = null;
  }

  onConnected(): void {}
  onMaxAttemptsReached(): void {}
}`);

const stateRecoveryCode = ref(`async function recoverState(echo: Echo, sessionId: string, lastEventTime: string) {
  // 1. Re-subscribe to channels
  echo.private(\`sessions.\${sessionId}\`)
    .listen('.session.output', handleOutput);

  // 2. Fetch missed events via REST API
  const response = await api.get(\`/sessions/\${sessionId}/logs\`, {
    params: {
      since: lastEventTime,
      type: 'output',
    },
  });

  // 3. Replay missed output
  for (const log of response.data.data) {
    handleOutput({ data: log.content, timestamp: log.created_at });
  }

  // 4. Update last known event time
  if (response.data.data.length > 0) {
    lastEventTime = response.data.data.at(-1).created_at;
  }
}`);

const connectionLifecycle = ref(`import { ref, onMounted, onUnmounted } from 'vue';
import echo from './echo';

export function useWebSocketStatus() {
  const status = ref<'connecting' | 'connected' | 'disconnected'>('connecting');
  const latency = ref<number | null>(null);
  let pingInterval: ReturnType<typeof setInterval>;

  onMounted(() => {
    const connector = echo.connector;

    connector.pusher.connection.bind('connected', () => {
      status.value = 'connected';
    });

    connector.pusher.connection.bind('disconnected', () => {
      status.value = 'disconnected';
    });

    connector.pusher.connection.bind('connecting', () => {
      status.value = 'connecting';
    });

    // Measure latency every 30 seconds
    pingInterval = setInterval(() => {
      const start = Date.now();
      connector.pusher.connection.bind('pong', () => {
        latency.value = Date.now() - start;
      });
      connector.pusher.send_event('pusher:ping', {});
    }, 30000);
  });

  onUnmounted(() => {
    clearInterval(pingInterval);
  });

  return { status, latency };
}`);
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
  margin: 1.25rem 0 0.5rem;
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

a {
  color: var(--accent-purple, #a855f7);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: var(--border-color, var(--border));
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
}

/* Tip Box */
.tip {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
  margin: 1.5rem 0;
}

.tip-icon {
  width: 28px;
  height: 28px;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  color: var(--accent-purple, #a855f7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.tip h4 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.tip p {
  margin: 0;
  font-size: 0.9rem;
}

/* Channels Table */
.channels-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.channels-table th {
  text-align: left;
  padding: 0.75rem;
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.channels-table td {
  padding: 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  color: var(--text-secondary);
}

.channels-table tr:hover td {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
}

/* Events Grid */
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
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
}

.event-card h4 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  color: var(--accent-cyan, #22d3ee);
  font-family: 'JetBrains Mono', monospace;
}

.event-card p {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }

  .events-grid {
    grid-template-columns: 1fr;
  }
}
</style>
