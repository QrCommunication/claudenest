<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>Architecture Overview</h1>
      <p class="lead">
        ClaudeNest follows a distributed architecture with three main packages: a Laravel server
        acting as the central hub, lightweight Node.js agents running on developer machines, and
        native mobile apps for on-the-go access.
      </p>
    </header>

    <section id="system-design">
      <h2>System Design</h2>
      <p>
        The platform is organized around a client-server model where multiple client types
        (web dashboard, mobile apps, agents) communicate with a central Laravel server. The
        server manages authentication, session orchestration, context storage, and real-time
        event distribution.
      </p>

      <div class="architecture-diagram">
        <div class="arch-layer">
          <h4 class="layer-label">Clients</h4>
          <div class="arch-boxes">
            <div class="arch-box">
              <span class="arch-icon">WEB</span>
              <span class="arch-name">Web Dashboard</span>
              <span class="arch-tech">Vue.js 3 + xterm.js</span>
            </div>
            <div class="arch-box">
              <span class="arch-icon">MOB</span>
              <span class="arch-name">Mobile App</span>
              <span class="arch-tech">React Native</span>
            </div>
            <div class="arch-box">
              <span class="arch-icon">AGT</span>
              <span class="arch-name">Agent</span>
              <span class="arch-tech">Node.js + node-pty</span>
            </div>
          </div>
        </div>

        <div class="arch-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14m0 0l-4-4m4 4l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>REST API + WebSocket</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 19V5m0 0l-4 4m4-4l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="arch-layer">
          <h4 class="layer-label">Server</h4>
          <div class="arch-boxes">
            <div class="arch-box highlight">
              <span class="arch-icon">API</span>
              <span class="arch-name">Laravel 11</span>
              <span class="arch-tech">REST + Sanctum Auth</span>
            </div>
            <div class="arch-box highlight">
              <span class="arch-icon">WS</span>
              <span class="arch-name">Reverb</span>
              <span class="arch-tech">WebSocket Relay</span>
            </div>
            <div class="arch-box highlight">
              <span class="arch-icon">RAG</span>
              <span class="arch-name">Context Engine</span>
              <span class="arch-tech">Embeddings + Search</span>
            </div>
          </div>
        </div>

        <div class="arch-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14m0 0l-4-4m4 4l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Persistent Storage</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 19V5m0 0l-4 4m4-4l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="arch-layer">
          <h4 class="layer-label">Infrastructure</h4>
          <div class="arch-boxes">
            <div class="arch-box infra">
              <span class="arch-icon">PG</span>
              <span class="arch-name">PostgreSQL</span>
              <span class="arch-tech">+ pgvector</span>
            </div>
            <div class="arch-box infra">
              <span class="arch-icon">RD</span>
              <span class="arch-name">Redis</span>
              <span class="arch-tech">Cache + Queues</span>
            </div>
            <div class="arch-box infra">
              <span class="arch-icon">AI</span>
              <span class="arch-name">Ollama</span>
              <span class="arch-tech">Mistral 7B</span>
            </div>
          </div>
        </div>
      </div>

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>Monorepo Structure</h4>
          <p>
            All three packages live in a single monorepo under <code>packages/</code>. The server
            package includes both the Laravel backend and the Vue.js frontend SPA.
          </p>
        </div>
      </div>
    </section>

    <section id="server">
      <h2>Server Package</h2>
      <p>
        The server is a <strong>Laravel 11</strong> application that serves as the central orchestration
        hub. It exposes a REST API for CRUD operations, hosts the Vue.js SPA dashboard, and runs a
        WebSocket relay via Laravel Reverb for real-time communication.
      </p>

      <h3>Key Responsibilities</h3>
      <ul>
        <li>User authentication and authorization via Laravel Sanctum</li>
        <li>Machine registration and health monitoring</li>
        <li>Session lifecycle management (create, attach, terminate)</li>
        <li>Multi-agent coordination (tasks, file locks, shared context)</li>
        <li>RAG engine with pgvector for context retrieval</li>
        <li>Real-time event broadcasting via Laravel Reverb</li>
      </ul>

      <h3>Directory Layout</h3>
      <CodeBlock :code="serverStructure" language="bash" />

      <h3>Request Lifecycle</h3>
      <p>
        Every API request follows the standard Laravel pipeline: middleware (auth, rate limiting),
        controller, form request validation, service layer, Eloquent model, and API resource
        for response formatting.
      </p>
      <CodeBlock :code="requestLifecycle" language="php" filename="Typical API flow" />
    </section>

    <section id="agent">
      <h2>Agent Package</h2>
      <p>
        The agent is a <strong>Node.js</strong> daemon that runs on the developer's machine. It manages
        local Claude Code processes via <code>node-pty</code>, streams terminal I/O over WebSocket, and
        handles discovery of local skills and MCP servers.
      </p>

      <h3>Key Responsibilities</h3>
      <ul>
        <li>Maintain a persistent WebSocket connection to the server</li>
        <li>Spawn and manage Claude Code PTY processes</li>
        <li>Stream terminal output in real-time (chunked at 16ms intervals)</li>
        <li>Discover local MCP servers and slash commands</li>
        <li>Sync context data with the server's RAG engine</li>
        <li>Handle reconnection with exponential backoff</li>
      </ul>

      <h3>Agent Lifecycle</h3>
      <CodeBlock :code="agentLifecycle" language="typescript" filename="agent.ts" />
    </section>

    <section id="mobile">
      <h2>Mobile Package</h2>
      <p>
        The mobile package is a <strong>React Native</strong> application targeting both iOS and Android.
        It provides on-the-go access to sessions, machines, and multi-agent projects with native
        performance and platform-specific UI conventions.
      </p>

      <h3>Key Features</h3>
      <ul>
        <li>Real-time session monitoring and interaction</li>
        <li>Machine status overview and Wake-on-LAN</li>
        <li>Multi-agent task board with drag-and-drop</li>
        <li>Push notifications for session events</li>
        <li>Biometric authentication (Face ID / fingerprint)</li>
        <li>Offline support with Zustand persisted stores</li>
      </ul>

      <h3>State Management</h3>
      <CodeBlock :code="mobileStore" language="typescript" filename="stores/sessions.ts" />
    </section>

    <section id="data-flow">
      <h2>Data Flow</h2>
      <p>
        Data flows through the system in two main patterns: request-response for CRUD operations
        and event-driven for real-time updates. Both paths converge at the server, which acts
        as the single source of truth.
      </p>

      <h3>Session I/O Flow</h3>
      <p>
        When a user types in the web terminal, the input travels through several hops before
        reaching the Claude Code process on the agent machine:
      </p>
      <CodeTabs :tabs="dataFlowTabs" />

      <h3>Context Synchronization</h3>
      <p>
        Context data flows from agents to the server, where it is embedded and stored in pgvector.
        Other agents and clients can then query this context for relevant information:
      </p>
      <CodeBlock :code="contextFlow" language="typescript" filename="Context sync flow" />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>Event-Driven Architecture</h4>
          <p>
            All state changes are broadcast as Laravel events. Clients subscribe to relevant
            channels and receive updates in real-time via WebSocket, eliminating the need for
            polling.
          </p>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const serverStructure = ref(`packages/server/
  app/
    Http/Controllers/Api/   # REST API controllers
    Models/                  # Eloquent models (UUID primary keys)
    Services/                # Business logic (RAG, embedding, MCP)
    Events/                  # Broadcast events (sessions, tasks, locks)
  resources/js/              # Vue.js 3 SPA
    components/              # Reusable UI components
    pages/                   # Route-level page components
    stores/                  # Pinia state management
    composables/             # Shared composition functions
  routes/
    api.php                  # API route definitions
    channels.php             # WebSocket channel authorization
    web.php                  # Web routes (SPA entry)`);

const requestLifecycle = ref(`// 1. Route definition (routes/api.php)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/machines', [MachineController::class, 'index']);
});

// 2. Controller receives validated request
public function index(Request $request): JsonResponse
{
    $machines = $request->user()
        ->machines()
        ->with('sessions')   // Eager load to prevent N+1
        ->paginate($request->input('per_page', 15));

    // 3. API Resource formats the response
    return response()->json([
        'success' => true,
        'data' => MachineResource::collection($machines),
        'meta' => [
            'timestamp' => now()->toIso8601String(),
            'request_id' => $request->header('X-Request-ID', uniqid()),
        ],
    ]);
}`);

const agentLifecycle = ref(`// The agent connects, discovers, and waits for commands
const agent = new ClaudeRemoteAgent(config);

// 1. Initialize discovery (skills, MCP servers)
await agent.discovery.initialize();

// 2. Connect to server via WebSocket
await agent.wsClient.connect();

// 3. Register machine capabilities
agent.wsClient.send('machine:register', {
  platform: process.platform,
  hostname: os.hostname(),
  capabilities: ['claude_code', 'git', 'docker'],
});

// 4. Listen for session commands
agent.wsClient.on('session:create', async (payload) => {
  const session = await agent.sessionManager.create({
    claudePath: config.claudePath,
    cwd: payload.project_path,
    cols: payload.pty_size?.cols ?? 120,
    rows: payload.pty_size?.rows ?? 40,
  });

  // Stream output back to server
  session.on('output', (data) => {
    agent.wsClient.send('session:output', {
      session_id: session.id,
      data,
    });
  });
});`);

const mobileStore = ref(`import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SessionsState {
  sessions: Session[];
  isLoading: boolean;
  fetchSessions: (machineId: string) => Promise<void>;
  createSession: (machineId: string, opts: CreateSessionOpts) => Promise<Session>;
}

export const useSessionsStore = create<SessionsState>()(
  persist(
    (set) => ({
      sessions: [],
      isLoading: false,

      fetchSessions: async (machineId) => {
        set({ isLoading: true });
        const response = await api.get(\`/machines/\${machineId}/sessions\`);
        set({ sessions: response.data.data, isLoading: false });
      },

      createSession: async (machineId, opts) => {
        const response = await api.post(\`/machines/\${machineId}/sessions\`, opts);
        const session = response.data.data;
        set((state) => ({ sessions: [session, ...state.sessions] }));
        return session;
      },
    }),
    {
      name: 'claudenest-sessions',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);`);

const dataFlowTabs = ref([
  {
    label: 'Input (User to Agent)',
    language: 'typescript',
    code: `// 1. User types in xterm.js terminal (Web Dashboard)
terminal.onData((data: string) => {
  // 2. Input sent via WebSocket to server
  echo.private(\`sessions.\${sessionId}\`)
    .whisper('input', { data });
});

// 3. Server broadcasts to agent channel
// (SessionInput event on private channel)

// 4. Agent receives and writes to PTY
wsClient.on('session:input', (payload) => {
  const session = sessionManager.get(payload.session_id);
  session.pty.write(payload.data);
});`,
  },
  {
    label: 'Output (Agent to User)',
    language: 'typescript',
    code: `// 1. Claude Code writes to PTY stdout
pty.onData((data: string) => {
  // 2. Agent sends output via WebSocket
  wsClient.send('session:output', {
    session_id: sessionId,
    data,
    chunk_id: generateChunkId(),
  });
});

// 3. Server receives and broadcasts SessionOutput event
// (Laravel Reverb distributes to all subscribers)

// 4. Web Dashboard renders in xterm.js
echo.private(\`sessions.\${sessionId}\`)
  .listen('.session.output', (event) => {
    terminal.write(event.data);
  });`,
  },
]);

const contextFlow = ref(`// Agent adds context after completing a task
await contextClient.addChunk({
  project_id: projectId,
  content: 'Refactored auth module to use middleware pattern',
  type: 'task_completion',
  metadata: {
    instance_id: instanceId,
    files: ['src/middleware/auth.ts', 'src/routes/api.ts'],
    importance_score: 0.8,
  },
});

// Server embeds content using bge-small-en-v1.5
// and stores the 384-dimensional vector in pgvector

// Another agent queries for relevant context
const results = await contextClient.query({
  project_id: projectId,
  query: 'How is authentication handled?',
  limit: 5,
});
// Returns the most semantically similar context chunks`);
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

strong {
  color: var(--text-primary);
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

/* Architecture Diagram */
.architecture-diagram {
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
}

.arch-layer {
  margin-bottom: 0.5rem;
}

.layer-label {
  text-align: center;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin: 0 0 0.75rem;
}

.arch-boxes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.arch-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1rem 0.5rem;
  background: color-mix(in srgb, var(--text-primary) 4%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 8px;
  text-align: center;
}

.arch-box.highlight {
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
}

.arch-box.infra {
  border-color: color-mix(in srgb, var(--accent-cyan, #22d3ee) 30%, transparent);
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 5%, transparent);
}

.arch-icon {
  font-size: 0.75rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: var(--accent-purple, #a855f7);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.arch-box.infra .arch-icon {
  color: var(--accent-cyan, #22d3ee);
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 15%, transparent);
}

.arch-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.arch-tech {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.arch-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.arch-arrow svg {
  width: 20px;
  height: 20px;
}

/* Tip Box */
.tip {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-radius: 12px;
  margin: 1.5rem 0;
}

.tip-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  color: var(--accent-purple, #a855f7);
  border-radius: 50%;
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

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }

  .arch-boxes {
    grid-template-columns: 1fr;
  }
}
</style>
