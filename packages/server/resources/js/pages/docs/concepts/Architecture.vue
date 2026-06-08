<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ $t('docDocsConceptsArchitecture.title') }}</h1>
      <p class="lead">
        {{ $t('docDocsConceptsArchitecture.lead') }}
      </p>
    </header>

    <section id="system-design">
      <h2>{{ $t('docDocsConceptsArchitecture.systemDesignHeading') }}</h2>
      <p>
        {{ $t('docDocsConceptsArchitecture.systemDesignPara1') }}
      </p>

      <div class="architecture-diagram">
        <div class="arch-layer">
          <h4 class="layer-label">{{ $t('docDocsConceptsArchitecture.layerClients') }}</h4>
          <div class="arch-boxes">
            <div class="arch-box">
              <span class="arch-icon">WEB</span>
              <span class="arch-name">{{ $t('docDocsConceptsArchitecture.boxWebDashboard') }}</span>
              <span class="arch-tech">Vue.js 3.5 + Vite 8 + xterm.js</span>
            </div>
            <div class="arch-box">
              <span class="arch-icon">MOB</span>
              <span class="arch-name">{{ $t('docDocsConceptsArchitecture.boxMobileApp') }}</span>
              <span class="arch-tech">Expo 55 + React Native 0.83</span>
            </div>
            <div class="arch-box">
              <span class="arch-icon">AGT</span>
              <span class="arch-name">{{ $t('docDocsConceptsArchitecture.boxAgent') }}</span>
              <span class="arch-tech">Node.js 24 + node-pty</span>
            </div>
          </div>
        </div>

        <div class="arch-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14m0 0l-4-4m4 4l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ $t('docDocsConceptsArchitecture.arrowRestApiWebSocket') }}</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 19V5m0 0l-4 4m4-4l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="arch-layer">
          <h4 class="layer-label">{{ $t('docDocsConceptsArchitecture.layerServer') }}</h4>
          <div class="arch-boxes">
            <div class="arch-box highlight">
              <span class="arch-icon">API</span>
              <span class="arch-name">Laravel 13</span>
              <span class="arch-tech">PHP 8.4 + Sanctum Auth</span>
            </div>
            <div class="arch-box highlight">
              <span class="arch-icon">WS</span>
              <span class="arch-name">Reverb 1.10</span>
              <span class="arch-tech">{{ $t('docDocsConceptsArchitecture.techWebSocketRelay') }}</span>
            </div>
            <div class="arch-box highlight">
              <span class="arch-icon">RAG</span>
              <span class="arch-name">{{ $t('docDocsConceptsArchitecture.boxContextEngine') }}</span>
              <span class="arch-tech">pgvector 384d + bge-small-en</span>
            </div>
          </div>
        </div>

        <div class="arch-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14m0 0l-4-4m4 4l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ $t('docDocsConceptsArchitecture.arrowPersistentStorage') }}</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 19V5m0 0l-4 4m4-4l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="arch-layer">
          <h4 class="layer-label">{{ $t('docDocsConceptsArchitecture.layerInfrastructure') }}</h4>
          <div class="arch-boxes">
            <div class="arch-box infra">
              <span class="arch-icon">PG</span>
              <span class="arch-name">PostgreSQL</span>
              <span class="arch-tech">+ pgvector</span>
            </div>
            <div class="arch-box infra">
              <span class="arch-icon">RD</span>
              <span class="arch-name">Redis</span>
              <span class="arch-tech">{{ $t('docDocsConceptsArchitecture.techCacheQueues') }}</span>
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
          <h4>{{ $t('docDocsConceptsArchitecture.monorepoTipHeading') }}</h4>
          <p>
            <i18n-t keypath="docDocsConceptsArchitecture.monorepoTipBody" tag="span" scope="global">
              <template #packages><code>packages/</code></template>
            </i18n-t>
          </p>
        </div>
      </div>
    </section>

    <section id="server">
      <h2>{{ $t('docDocsConceptsArchitecture.serverHeading') }}</h2>
      <p>
        <i18n-t keypath="docDocsConceptsArchitecture.serverPara1" tag="span" scope="global">
          <template #laravel><strong>Laravel 13</strong></template>
        </i18n-t>
      </p>

      <h3>{{ $t('docDocsConceptsArchitecture.keyResponsibilitiesHeading') }}</h3>
      <ul>
        <li>{{ $t('docDocsConceptsArchitecture.serverResp1') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.serverResp2') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.serverResp3') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.serverResp4') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.serverResp5') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.serverResp6') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.serverResp7') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.serverResp8') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.serverResp9') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.serverResp10') }}</li>
      </ul>

      <h3>{{ $t('docDocsConceptsArchitecture.directoryLayoutHeading') }}</h3>
      <CodeBlock :code="serverStructure" language="bash" />

      <h3>{{ $t('docDocsConceptsArchitecture.requestLifecycleHeading') }}</h3>
      <p>
        {{ $t('docDocsConceptsArchitecture.requestLifecyclePara1') }}
      </p>
      <CodeBlock :code="requestLifecycle" language="php" :filename="$t('docDocsConceptsArchitecture.filenameTypicalApiFlow')" />
    </section>

    <section id="agent">
      <h2>{{ $t('docDocsConceptsArchitecture.agentHeading') }}</h2>
      <p>
        <i18n-t keypath="docDocsConceptsArchitecture.agentPara1" tag="span" scope="global">
          <template #nodejs><strong>Node.js</strong></template>
          <template #nodePty><code>node-pty</code></template>
        </i18n-t>
      </p>

      <h3>{{ $t('docDocsConceptsArchitecture.keyResponsibilitiesHeading') }}</h3>
      <ul>
        <li>{{ $t('docDocsConceptsArchitecture.agentResp1') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.agentResp2') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.agentResp3') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.agentResp4') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.agentResp5') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.agentResp6') }}</li>
      </ul>

      <h3>{{ $t('docDocsConceptsArchitecture.agentLifecycleHeading') }}</h3>
      <CodeBlock :code="agentLifecycle" language="typescript" filename="agent.ts" />
    </section>

    <section id="mobile">
      <h2>{{ $t('docDocsConceptsArchitecture.mobileHeading') }}</h2>
      <p>
        <i18n-t keypath="docDocsConceptsArchitecture.mobilePara1" tag="span" scope="global">
          <template #expo><strong>Expo 55 / React Native 0.83</strong></template>
          <template #react><strong>React 19</strong></template>
        </i18n-t>
      </p>

      <h3>{{ $t('docDocsConceptsArchitecture.keyFeaturesHeading') }}</h3>
      <ul>
        <li>{{ $t('docDocsConceptsArchitecture.mobileFeature1') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.mobileFeature2') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.mobileFeature3') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.mobileFeature4') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.mobileFeature5') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.mobileFeature6') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.mobileFeature7') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.mobileFeature8') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.mobileFeature9') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.mobileFeature10') }}</li>
        <li>{{ $t('docDocsConceptsArchitecture.mobileFeature11') }}</li>
      </ul>

      <h3>{{ $t('docDocsConceptsArchitecture.stateManagementHeading') }}</h3>
      <CodeBlock :code="mobileStore" language="typescript" filename="stores/sessions.ts" />
    </section>

    <section id="data-flow">
      <h2>{{ $t('docDocsConceptsArchitecture.dataFlowHeading') }}</h2>
      <p>
        {{ $t('docDocsConceptsArchitecture.dataFlowPara1') }}
      </p>

      <h3>{{ $t('docDocsConceptsArchitecture.sessionIoFlowHeading') }}</h3>
      <p>
        {{ $t('docDocsConceptsArchitecture.sessionIoFlowPara1') }}
      </p>
      <CodeTabs :tabs="dataFlowTabs" />

      <h3>{{ $t('docDocsConceptsArchitecture.contextSyncHeading') }}</h3>
      <p>
        {{ $t('docDocsConceptsArchitecture.contextSyncPara1') }}
      </p>
      <CodeBlock :code="contextFlow" language="typescript" :filename="$t('docDocsConceptsArchitecture.filenameContextSyncFlow')" />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>{{ $t('docDocsConceptsArchitecture.eventDrivenTipHeading') }}</h4>
          <p>
            {{ $t('docDocsConceptsArchitecture.eventDrivenTipBody') }}
          </p>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const { t } = useI18n();

const serverStructure = ref(`packages/server/
  app/
    Http/Controllers/Api/   # REST API controllers
    Models/                  # Eloquent models (UUID primary keys)
      Epic.php               # Epic model (feature grouping)
      Sprint.php             # Sprint model (time-boxed iteration)
      SharedTask.php         # Task model (subtasks, story points)
      ClaudeCredential.php   # Encrypted credential storage
    Services/                # Business logic
      ContextRAGService.php  # RAG search with pgvector
      EmbeddingService.php   # bge-small-en-v1.5 embeddings
      PlanningAgentService.php # AI planning agent
      RunnerAgentService.php   # Automated monitoring agent
      CredentialService.php    # AES-256-CBC credential management
      MCPManagerService.php    # MCP server orchestration
    Events/                  # Broadcast events (sessions, tasks, locks)
  resources/js/              # Vue.js 3.5 SPA (Vite 8, Tailwind 4.1)
    components/              # Reusable UI components
    pages/                   # Route-level page components
    stores/                  # Pinia 3 state management
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

const dataFlowTabs = computed(() => [
  {
    label: t('docDocsConceptsArchitecture.tabInputUserToAgent'),
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
    label: t('docDocsConceptsArchitecture.tabOutputAgentToUser'),
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
