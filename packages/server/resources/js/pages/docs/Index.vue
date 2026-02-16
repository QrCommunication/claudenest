<template>
  <article class="doc-content">
    <!-- Hero Header -->
    <header class="doc-hero">
      <div class="hero-badge">
        <span class="badge-dot"></span>
        v1.0.0 -- Production Ready
      </div>
      <h1>ClaudeNest Documentation</h1>
      <p class="hero-lead">
        The open-source platform for remote Claude Code orchestration. Control sessions,
        coordinate multiple agents, and build with real-time WebSocket communication.
      </p>
      <div class="hero-actions">
        <router-link to="/docs/quickstart" class="hero-btn primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Quickstart Guide
        </router-link>
        <router-link to="/docs/api/authentication" class="hero-btn secondary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
          </svg>
          API Reference
        </router-link>
      </div>
    </header>

    <!-- Quick Navigation Cards -->
    <section id="explore">
      <h2>Explore the Platform</h2>
      <p>
        ClaudeNest consists of three core packages that work together to provide
        seamless remote access and multi-agent coordination for Claude Code.
      </p>
      <div class="nav-cards">
        <router-link to="/docs/installation" class="nav-card">
          <div class="nav-card-icon install">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="nav-card-content">
            <h3>Installation</h3>
            <p>Deploy with Docker Compose or install on bare-metal for production.</p>
          </div>
          <svg class="nav-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </router-link>

        <router-link to="/docs/api/authentication" class="nav-card">
          <div class="nav-card-icon auth">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="nav-card-content">
            <h3>Authentication</h3>
            <p>OAuth, API tokens, and machine registration for secure access.</p>
          </div>
          <svg class="nav-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </router-link>

        <router-link to="/docs/api/sessions" class="nav-card">
          <div class="nav-card-icon sessions">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="4 17 10 11 4 5"/>
              <line x1="12" y1="19" x2="20" y2="19" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="nav-card-content">
            <h3>Sessions</h3>
            <p>Create and manage interactive Claude Code terminal sessions.</p>
          </div>
          <svg class="nav-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </router-link>

        <router-link to="/docs/websocket" class="nav-card">
          <div class="nav-card-icon websocket">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="nav-card-content">
            <h3>WebSocket</h3>
            <p>Real-time bidirectional communication for session streaming.</p>
          </div>
          <svg class="nav-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </router-link>

        <router-link to="/docs/api/projects" class="nav-card">
          <div class="nav-card-icon multiagent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="nav-card-content">
            <h3>Multi-Agent</h3>
            <p>Coordinate multiple Claude instances with shared context and tasks.</p>
          </div>
          <svg class="nav-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </router-link>

        <router-link to="/docs/api/mcp" class="nav-card">
          <div class="nav-card-icon mcp">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="nav-card-content">
            <h3>MCP Integration</h3>
            <p>Discover and manage Model Context Protocol servers and tools.</p>
          </div>
          <svg class="nav-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </router-link>
      </div>
    </section>

    <!-- Architecture Overview -->
    <section id="architecture">
      <h2>Architecture Overview</h2>
      <p>
        ClaudeNest uses a hub-and-spoke architecture. The central server orchestrates
        communication between web clients, mobile apps, and local agents running Claude Code.
      </p>
      <div class="arch-diagram">
        <div class="arch-row clients-row">
          <div class="arch-node client">
            <div class="arch-node-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            <span>Web Dashboard</span>
            <span class="arch-tech">Vue.js + xterm.js</span>
          </div>
          <div class="arch-node client">
            <div class="arch-node-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="5" y="2" width="14" height="20" rx="2"/>
                <line x1="12" y1="18" x2="12" y2="18" stroke-linecap="round"/>
              </svg>
            </div>
            <span>Mobile App</span>
            <span class="arch-tech">React Native</span>
          </div>
          <div class="arch-node client">
            <div class="arch-node-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <polyline points="4 17 10 11 4 5"/>
                <line x1="12" y1="19" x2="20" y2="19"/>
              </svg>
            </div>
            <span>Agent Daemon</span>
            <span class="arch-tech">Node.js + node-pty</span>
          </div>
        </div>

        <div class="arch-connector">
          <div class="connector-line"></div>
          <div class="connector-labels">
            <span>REST API</span>
            <span>WebSocket</span>
          </div>
        </div>

        <div class="arch-row server-row">
          <div class="arch-node server-node">
            <div class="arch-node-icon server-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="2" width="20" height="8" rx="2"/>
                <rect x="2" y="14" width="20" height="8" rx="2"/>
                <circle cx="6" cy="6" r="1" fill="currentColor"/>
                <circle cx="6" cy="18" r="1" fill="currentColor"/>
              </svg>
            </div>
            <span>ClaudeNest Server</span>
            <span class="arch-tech">Laravel 11 + Reverb + RAG</span>
          </div>
        </div>

        <div class="arch-connector">
          <div class="connector-line triple"></div>
        </div>

        <div class="arch-row infra-row">
          <div class="arch-node infra">
            <div class="arch-node-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
            </div>
            <span>PostgreSQL</span>
            <span class="arch-tech">+ pgvector</span>
          </div>
          <div class="arch-node infra">
            <div class="arch-node-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span>Redis</span>
            <span class="arch-tech">Cache + Queues</span>
          </div>
          <div class="arch-node infra">
            <div class="arch-node-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </div>
            <span>Ollama</span>
            <span class="arch-tech">Mistral 7B</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Getting Started -->
    <section id="getting-started">
      <h2>Getting Started</h2>
      <p>
        Set up ClaudeNest in three steps. The quickest path is Docker Compose for local
        development, or bare-metal for production deployments.
      </p>

      <div class="steps-timeline">
        <div class="step">
          <div class="step-indicator">
            <div class="step-number">1</div>
            <div class="step-line"></div>
          </div>
          <div class="step-body">
            <h3 id="step-install">Install the Server</h3>
            <p>
              Clone the repository and start services with Docker Compose. This sets up
              PostgreSQL with pgvector, Redis, and the Laravel application.
            </p>
            <CodeBlock
              :code="installCode"
              language="bash"
              filename="terminal"
            />
          </div>
        </div>

        <div class="step">
          <div class="step-indicator">
            <div class="step-number">2</div>
            <div class="step-line"></div>
          </div>
          <div class="step-body">
            <h3 id="step-configure">Configure Environment</h3>
            <p>
              Copy the example environment file, generate an application key, and run
              database migrations. Adjust the <code>.env</code> file for your setup.
            </p>
            <CodeBlock
              :code="configCode"
              language="bash"
              filename="terminal"
            />
            <div class="callout info">
              <div class="callout-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </div>
              <div class="callout-content">
                <strong>Note:</strong> PostgreSQL must have the <code>pgvector</code> extension
                installed for context RAG features to work. The Docker setup handles this automatically.
              </div>
            </div>
          </div>
        </div>

        <div class="step">
          <div class="step-indicator">
            <div class="step-number">3</div>
          </div>
          <div class="step-body">
            <h3 id="step-connect">Connect an Agent</h3>
            <p>
              Register a machine from the dashboard, install the agent on your local
              machine, and start it with the generated token.
            </p>
            <CodeBlock
              :code="agentCode"
              language="bash"
              filename="terminal"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- API Overview -->
    <section id="api-overview">
      <h2>API Overview</h2>
      <p>
        ClaudeNest exposes a RESTful JSON API. All endpoints are prefixed with
        <code>/api</code> and require Bearer token authentication unless otherwise noted.
      </p>

      <h3 id="base-url">Base URL</h3>
      <CodeBlock code="https://your-claudenest-instance.com/api" language="bash" />

      <h3 id="authentication-header">Authentication</h3>
      <p>
        Include your API token in the <code>Authorization</code> header on every request.
        Tokens are obtained via the login endpoint or OAuth flow.
      </p>
      <CodeBlock
        :code="authHeaderCode"
        language="bash"
        filename="curl"
      />

      <h3 id="response-format">Response Format</h3>
      <p>All successful responses share a consistent envelope structure:</p>
      <CodeBlock :code="responseFormatCode" language="json" />

      <h3 id="error-format">Error Responses</h3>
      <p>Errors return the appropriate HTTP status code along with a structured body:</p>
      <CodeBlock :code="errorFormatCode" language="json" />

      <div class="endpoint-overview">
        <h3 id="core-endpoints">Core Endpoints</h3>
        <div class="endpoint-table">
          <div class="endpoint-row header">
            <span class="ep-method">Method</span>
            <span class="ep-path">Endpoint</span>
            <span class="ep-desc">Description</span>
          </div>
          <div class="endpoint-row" v-for="ep in coreEndpoints" :key="ep.path">
            <span class="ep-method" :class="ep.method.toLowerCase()">{{ ep.method }}</span>
            <code class="ep-path">{{ ep.path }}</code>
            <span class="ep-desc">{{ ep.description }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- WebSocket -->
    <section id="websocket-overview">
      <h2>WebSocket Communication</h2>
      <p>
        Real-time session interaction uses WebSocket connections via Laravel Reverb.
        After attaching to a session over HTTP, you receive a WebSocket token for
        bidirectional streaming.
      </p>

      <div class="ws-flow">
        <div class="ws-flow-step">
          <div class="ws-flow-num">1</div>
          <div class="ws-flow-content">
            <strong>Attach to Session</strong>
            <span>POST /api/sessions/{id}/attach</span>
          </div>
        </div>
        <div class="ws-flow-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="ws-flow-step">
          <div class="ws-flow-num">2</div>
          <div class="ws-flow-content">
            <strong>Open WebSocket</strong>
            <span>wss://your-server:8080</span>
          </div>
        </div>
        <div class="ws-flow-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="ws-flow-step">
          <div class="ws-flow-num">3</div>
          <div class="ws-flow-content">
            <strong>Authenticate</strong>
            <span>Send ws_token</span>
          </div>
        </div>
        <div class="ws-flow-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="ws-flow-step">
          <div class="ws-flow-num">4</div>
          <div class="ws-flow-content">
            <strong>Stream I/O</strong>
            <span>Send input, receive output</span>
          </div>
        </div>
      </div>

      <h3 id="ws-events">Key Events</h3>
      <div class="events-grid">
        <div class="event-item outgoing">
          <div class="event-direction">Client to Server</div>
          <div class="event-name">input</div>
          <div class="event-desc">Send keystrokes to the PTY session</div>
        </div>
        <div class="event-item outgoing">
          <div class="event-direction">Client to Server</div>
          <div class="event-name">resize</div>
          <div class="event-desc">Update terminal dimensions (cols, rows)</div>
        </div>
        <div class="event-item incoming">
          <div class="event-direction">Server to Client</div>
          <div class="event-name">SessionOutput</div>
          <div class="event-desc">Terminal output from the Claude session</div>
        </div>
        <div class="event-item incoming">
          <div class="event-direction">Server to Client</div>
          <div class="event-name">SessionTerminated</div>
          <div class="event-desc">Session has ended with exit code</div>
        </div>
      </div>

      <CodeBlock :code="wsExampleCode" language="javascript" filename="websocket-client.js" />

      <router-link to="/docs/websocket" class="section-link">
        Full WebSocket documentation
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </router-link>
    </section>

    <!-- Multi-Agent Coordination -->
    <section id="multi-agent">
      <h2>Multi-Agent Coordination</h2>
      <p>
        ClaudeNest enables multiple Claude Code instances to work on the same project
        simultaneously. The system provides shared context, task coordination, and
        file locking to prevent conflicts.
      </p>

      <div class="feature-cards">
        <div class="feature-card">
          <div class="feature-card-header">
            <div class="feature-card-icon context">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35" stroke-linecap="round"/>
              </svg>
            </div>
            <h4>Context RAG</h4>
          </div>
          <p>
            Semantic search over project knowledge using pgvector embeddings.
            Each agent queries shared context to stay aligned with project state.
          </p>
          <CodeBlock :code="ragExampleCode" language="php" filename="ContextRAGService.php" />
        </div>

        <div class="feature-card">
          <div class="feature-card-header">
            <div class="feature-card-icon tasks">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h4>Task Coordination</h4>
          </div>
          <p>
            Atomic task claiming prevents multiple agents from working on the same task.
            Tasks track status, dependencies, and completion summaries.
          </p>
          <CodeBlock :code="taskExampleCode" language="javascript" filename="claim-task.js" />
        </div>

        <div class="feature-card">
          <div class="feature-card-header">
            <div class="feature-card-icon locks">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <h4>File Locking</h4>
          </div>
          <p>
            Before editing a file, agents acquire a lock to prevent conflicting changes.
            Locks expire automatically and can be force-released if needed.
          </p>
          <CodeBlock :code="lockExampleCode" language="javascript" filename="file-lock.js" />
        </div>
      </div>
    </section>

    <!-- Configuration Reference -->
    <section id="configuration">
      <h2>Configuration Reference</h2>
      <p>
        ClaudeNest is configured through environment variables on the server side
        and a JSON configuration file for the agent.
      </p>

      <h3 id="server-env">Server Environment</h3>
      <p>Essential environment variables for the Laravel server:</p>
      <CodeBlock :code="serverEnvCode" language="bash" filename=".env" />

      <h3 id="agent-config">Agent Configuration</h3>
      <p>
        The agent reads its configuration from <code>~/.claudenest/config.json</code>.
        Generate the machine token from the dashboard after registering a machine.
      </p>
      <CodeBlock :code="agentConfigCode" language="json" filename="~/.claudenest/config.json" />
    </section>

    <!-- CLI Reference -->
    <section id="cli">
      <h2>CLI Reference</h2>
      <p>
        The ClaudeNest agent provides a command-line interface for managing the local daemon.
      </p>

      <div class="cli-table">
        <div class="cli-row header">
          <span class="cli-cmd">Command</span>
          <span class="cli-desc">Description</span>
        </div>
        <div class="cli-row" v-for="cmd in cliCommands" :key="cmd.command">
          <code class="cli-cmd">{{ cmd.command }}</code>
          <span class="cli-desc">{{ cmd.description }}</span>
        </div>
      </div>

      <CodeBlock :code="cliExampleCode" language="bash" filename="terminal" />
    </section>

    <!-- Resources -->
    <section id="resources">
      <h2>Resources</h2>
      <div class="resource-grid">
        <a href="https://github.com/yourusername/claudenest" target="_blank" class="resource-card">
          <div class="resource-icon github">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
            </svg>
          </div>
          <div class="resource-content">
            <strong>GitHub Repository</strong>
            <span>Source code, issues, and contributions</span>
          </div>
        </a>

        <a href="#" class="resource-card">
          <div class="resource-icon discord">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/>
            </svg>
          </div>
          <div class="resource-content">
            <strong>Community Discord</strong>
            <span>Chat with other developers and get help</span>
          </div>
        </a>

        <router-link to="/docs/api/authentication" class="resource-card">
          <div class="resource-icon api">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            </svg>
          </div>
          <div class="resource-content">
            <strong>Full API Reference</strong>
            <span>Detailed endpoint documentation with examples</span>
          </div>
        </router-link>

        <router-link to="/changelog" class="resource-card">
          <div class="resource-icon changelog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div class="resource-content">
            <strong>Changelog</strong>
            <span>Release history and migration guides</span>
          </div>
        </router-link>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import CodeBlock from '@/components/docs/CodeBlock.vue';

// --- Code Samples ---

const installCode = `# Clone the repository
git clone https://github.com/yourusername/claudenest.git
cd claudenest

# Start all services (PostgreSQL, Redis, Ollama, Server)
docker-compose up -d

# Run database migrations
docker-compose exec server php artisan migrate --seed`;

const configCode = `# Copy environment configuration
cp packages/server/.env.example packages/server/.env

# Generate application key
docker-compose exec server php artisan key:generate

# Install PHP dependencies
docker-compose exec server composer install

# Build frontend assets
docker-compose exec server npm install && npm run build

# Start the WebSocket server
docker-compose exec server php artisan reverb:start`;

const agentCode = `# Install the agent globally
npm install -g @claudenest/agent

# Initialize with your machine token from the dashboard
claudenest-agent init --token mn_your_machine_token_here

# Start the agent daemon
claudenest-agent start

# Verify connection
claudenest-agent status`;

const authHeaderCode = `curl -X GET https://your-server.com/api/machines \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json"`;

const responseFormatCode = `{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "my-machine",
    "status": "online"
  },
  "meta": {
    "timestamp": "2026-02-16T10:30:00Z",
    "request_id": "req_abc123def456"
  }
}`;

const errorFormatCode = `{
  "success": false,
  "error": {
    "code": "MACHINE_NOT_FOUND",
    "message": "The requested machine does not exist."
  },
  "meta": {
    "timestamp": "2026-02-16T10:30:00Z",
    "request_id": "req_abc123def456"
  }
}`;

const wsExampleCode = `// Attach to a session and open WebSocket
const attach = await fetch('/api/sessions/{id}/attach', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const { ws_token, ws_url } = await attach.json();

const ws = new WebSocket(ws_url);

ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'auth', token: ws_token }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'SessionOutput') {
    terminal.write(msg.data);
  }
};

// Send user input to the session
function sendInput(data) {
  ws.send(JSON.stringify({ type: 'input', data }));
}`;

const ragExampleCode = `// Query project context with semantic search
$embedding = $this->embeddingService->generate($query);

$chunks = ContextChunk::query()
    ->where('project_id', $project->id)
    ->orderByRaw('embedding <=> ?', [$embedding])
    ->limit(5)
    ->get();

// Each chunk contains relevant project knowledge
// scored by cosine similarity to the query`;

const taskExampleCode = `// Claim the next available task for this agent
const response = await fetch(
  '/api/projects/{projectId}/tasks/next-available',
  { headers: { 'Authorization': 'Bearer TOKEN' } }
);
const { data: task } = await response.json();

// Work on the task...

// Mark task as completed
await fetch(\`/api/tasks/\${task.id}/complete\`, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer TOKEN' },
  body: JSON.stringify({
    summary: 'Refactored auth module',
    files_modified: ['src/auth.ts', 'src/middleware.ts']
  })
});`;

const lockExampleCode = `// Acquire a file lock before editing
const lock = await fetch('/api/projects/{id}/locks', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer TOKEN' },
  body: JSON.stringify({
    path: 'src/auth/handler.ts',
    instance_id: 'agent-001',
    reason: 'Refactoring authentication flow'
  })
});

// Edit the file safely...

// Release the lock when done
await fetch('/api/projects/{id}/locks/release', {
  method: 'POST',
  body: JSON.stringify({ path: 'src/auth/handler.ts' })
});`;

const serverEnvCode = `# Database (PostgreSQL with pgvector)
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=claudenest
DB_USERNAME=postgres
DB_PASSWORD=secret

# WebSocket (Laravel Reverb)
BROADCAST_DRIVER=reverb
REVERB_APP_KEY=your-reverb-key
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

# AI Models (Ollama for embeddings)
OLLAMA_HOST=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=bge-small-en-v1.5
OLLAMA_SUMMARIZATION_MODEL=mistral:7b

# Cache & Queues
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis`;

const agentConfigCode = `{
  "serverUrl": "wss://your-server.com:8080",
  "machineToken": "mn_generated_token_from_dashboard",
  "claudePath": "/usr/local/bin/claude",
  "sessions": {
    "maxSessions": 10,
    "defaultCwd": "~"
  },
  "websocket": {
    "reconnectDelay": 1000,
    "maxReconnectDelay": 30000,
    "heartbeatInterval": 30000
  }
}`;

const cliExampleCode = `# Start the agent in the foreground for debugging
claudenest-agent start --foreground --log-level debug

# List active sessions on this machine
claudenest-agent sessions list

# Terminate a specific session
claudenest-agent sessions kill abc123

# Check connectivity to the server
claudenest-agent ping`;

// --- Data ---

interface Endpoint {
  method: string;
  path: string;
  description: string;
}

const coreEndpoints: Endpoint[] = [
  { method: 'POST', path: '/api/auth/login', description: 'Authenticate and receive a Bearer token' },
  { method: 'GET', path: '/api/machines', description: 'List all registered machines' },
  { method: 'POST', path: '/api/machines/{id}/sessions', description: 'Create a new Claude Code session' },
  { method: 'POST', path: '/api/sessions/{id}/attach', description: 'Attach to a session and get WebSocket token' },
  { method: 'POST', path: '/api/sessions/{id}/input', description: 'Send input to a running session' },
  { method: 'GET', path: '/api/projects/{id}/tasks', description: 'List tasks in a shared project' },
  { method: 'POST', path: '/api/tasks/{id}/claim', description: 'Atomically claim a task for an agent' },
  { method: 'POST', path: '/api/projects/{id}/context/query', description: 'Semantic search over project context' },
];

interface CliCommand {
  command: string;
  description: string;
}

const cliCommands: CliCommand[] = [
  { command: 'claudenest-agent init', description: 'Initialize agent configuration with a machine token' },
  { command: 'claudenest-agent start', description: 'Start the agent daemon and connect to the server' },
  { command: 'claudenest-agent stop', description: 'Gracefully stop the agent and terminate sessions' },
  { command: 'claudenest-agent status', description: 'Show agent status, active sessions, and connectivity' },
  { command: 'claudenest-agent sessions list', description: 'List all active sessions on this machine' },
  { command: 'claudenest-agent sessions kill <id>', description: 'Terminate a specific session by ID' },
  { command: 'claudenest-agent ping', description: 'Test connectivity to the ClaudeNest server' },
  { command: 'claudenest-agent logs', description: 'Stream agent logs in real-time' },
];
</script>

<style scoped>
.doc-content {
  max-width: 768px;
}

/* ========================
   Hero Header
   ======================== */
.doc-hero {
  margin-bottom: 3.5rem;
  padding-bottom: 2.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.25);
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #c084fc;
  margin-bottom: 1.25rem;
}

.badge-dot {
  width: 6px;
  height: 6px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.doc-hero h1 {
  font-size: 2.75rem;
  font-weight: 800;
  margin: 0 0 1rem;
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 40%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.hero-lead {
  font-size: 1.2rem;
  color: #94a3b8;
  line-height: 1.65;
  margin: 0 0 1.75rem;
  max-width: 640px;
}

.hero-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.25rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}

.hero-btn svg {
  width: 18px;
  height: 18px;
}

.hero-btn.primary {
  background: linear-gradient(135deg, #a855f7, #6366f1);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(168, 85, 247, 0.35);
}

.hero-btn.primary:hover {
  box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5);
  transform: translateY(-1px);
}

.hero-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
}

.hero-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(168, 85, 247, 0.4);
}

/* ========================
   Shared Section Styles
   ======================== */
section {
  margin-bottom: 3.5rem;
}

h2 {
  font-size: 1.65rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
  color: #ffffff;
  letter-spacing: -0.01em;
}

h3 {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 1.75rem 0 0.6rem;
  color: #e2e8f0;
}

h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.4rem;
  color: #e2e8f0;
}

p {
  color: #94a3b8;
  line-height: 1.7;
  margin: 0 0 1rem;
}

code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.88em;
  background: rgba(168, 85, 247, 0.1);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  color: #c084fc;
}

/* ========================
   Navigation Cards
   ======================== */
.nav-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.nav-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.15rem 1.25rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}

.nav-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(168, 85, 247, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.nav-card-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-card-icon svg {
  width: 22px;
  height: 22px;
}

.nav-card-icon.install {
  background: rgba(34, 211, 238, 0.12);
  color: #22d3ee;
}

.nav-card-icon.auth {
  background: rgba(168, 85, 247, 0.12);
  color: #a855f7;
}

.nav-card-icon.sessions {
  background: rgba(34, 197, 94, 0.12);
  color: #4ade80;
}

.nav-card-icon.websocket {
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
}

.nav-card-icon.multiagent {
  background: rgba(99, 102, 241, 0.12);
  color: #818cf8;
}

.nav-card-icon.mcp {
  background: rgba(244, 114, 182, 0.12);
  color: #f472b6;
}

.nav-card-content {
  flex: 1;
  min-width: 0;
}

.nav-card-content h3 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 0.2rem;
  color: #ffffff;
}

.nav-card-content p {
  font-size: 0.825rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.nav-card-arrow {
  width: 18px;
  height: 18px;
  color: #475569;
  flex-shrink: 0;
  transition: transform 0.2s, color 0.2s;
}

.nav-card:hover .nav-card-arrow {
  color: #a855f7;
  transform: translateX(3px);
}

/* ========================
   Architecture Diagram
   ======================== */
.arch-diagram {
  margin-top: 1.5rem;
  padding: 2rem 1.5rem;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.arch-row {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.arch-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  min-width: 130px;
  text-align: center;
  transition: border-color 0.2s;
}

.arch-node:hover {
  border-color: rgba(168, 85, 247, 0.3);
}

.arch-node-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
}

.arch-node-icon svg {
  width: 28px;
  height: 28px;
}

.arch-node.client .arch-node-icon {
  color: #22d3ee;
}

.arch-node.server-node {
  background: rgba(168, 85, 247, 0.08);
  border-color: rgba(168, 85, 247, 0.25);
}

.server-icon {
  color: #a855f7;
}

.arch-node.infra .arch-node-icon {
  color: #fbbf24;
}

.arch-node span {
  font-size: 0.85rem;
  font-weight: 500;
  color: #e2e8f0;
}

.arch-tech {
  font-size: 0.72rem !important;
  color: #64748b !important;
  font-weight: 400 !important;
}

.arch-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0;
}

.connector-line {
  width: 2px;
  height: 28px;
  background: linear-gradient(to bottom, rgba(168, 85, 247, 0.4), rgba(34, 211, 238, 0.4));
  border-radius: 1px;
}

.connector-line.triple {
  background: linear-gradient(to bottom, rgba(168, 85, 247, 0.4), rgba(251, 191, 36, 0.4));
}

.connector-labels {
  display: flex;
  gap: 1rem;
  margin-top: 0.35rem;
}

.connector-labels span {
  font-size: 0.7rem;
  color: #64748b;
  padding: 0.15rem 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
}

/* ========================
   Getting Started Steps
   ======================== */
.steps-timeline {
  margin-top: 1.5rem;
}

.step {
  display: flex;
  gap: 1.25rem;
  position: relative;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.step-number {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffffff;
}

.step-line {
  width: 2px;
  flex: 1;
  background: linear-gradient(to bottom, rgba(168, 85, 247, 0.3), rgba(168, 85, 247, 0.05));
  margin: 0.5rem 0;
  min-height: 20px;
}

.step-body {
  flex: 1;
  padding-bottom: 2rem;
}

.step-body h3 {
  margin: 0.15rem 0 0.5rem;
  font-size: 1.1rem;
}

.step-body p {
  margin-bottom: 1rem;
}

/* ========================
   Callout
   ======================== */
.callout {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  margin: 1.25rem 0;
}

.callout.info {
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.callout-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 0.1rem;
}

.callout-icon svg {
  width: 20px;
  height: 20px;
}

.callout.info .callout-icon {
  color: #60a5fa;
}

.callout-content {
  font-size: 0.9rem;
  color: #94a3b8;
  line-height: 1.6;
}

.callout-content strong {
  color: #e2e8f0;
}

/* ========================
   Endpoint Table
   ======================== */
.endpoint-overview {
  margin-top: 1.5rem;
}

.endpoint-table {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 0.75rem;
}

.endpoint-row {
  display: grid;
  grid-template-columns: 70px 1fr 1fr;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.15s;
}

.endpoint-row:last-child {
  border-bottom: none;
}

.endpoint-row:not(.header):hover {
  background: rgba(255, 255, 255, 0.02);
}

.endpoint-row.header {
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.endpoint-row.header .ep-method,
.endpoint-row.header .ep-path,
.endpoint-row.header .ep-desc {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  font-family: inherit;
  background: transparent;
  padding: 0;
}

.ep-method {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.ep-method.get { color: #22c55e; }
.ep-method.post { color: #a855f7; }
.ep-method.patch { color: #f59e0b; }
.ep-method.delete { color: #ef4444; }

.ep-path {
  font-size: 0.8rem;
  color: #94a3b8;
}

.ep-desc {
  font-size: 0.82rem;
  color: #64748b;
}

/* ========================
   WebSocket Flow
   ======================== */
.ws-flow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1.5rem 0;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow-x: auto;
}

.ws-flow-step {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.ws-flow-num {
  width: 26px;
  height: 26px;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #c084fc;
  flex-shrink: 0;
}

.ws-flow-content {
  display: flex;
  flex-direction: column;
}

.ws-flow-content strong {
  font-size: 0.82rem;
  color: #e2e8f0;
}

.ws-flow-content span {
  font-size: 0.72rem;
  color: #64748b;
}

.ws-flow-arrow {
  flex-shrink: 0;
}

.ws-flow-arrow svg {
  width: 16px;
  height: 16px;
  color: #475569;
}

/* ========================
   Events Grid
   ======================== */
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
  margin: 1rem 0 1.5rem;
}

.event-item {
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: border-color 0.2s;
}

.event-item:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

.event-item.outgoing {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.15);
}

.event-item.incoming {
  background: rgba(34, 197, 94, 0.05);
  border-color: rgba(34, 197, 94, 0.15);
}

.event-direction {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.event-item.outgoing .event-direction { color: #60a5fa; }
.event-item.incoming .event-direction { color: #4ade80; }

.event-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 0.25rem;
}

.event-desc {
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.4;
}

/* ========================
   Section Link
   ======================== */
.section-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #a855f7;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  transition: gap 0.2s;
}

.section-link:hover {
  gap: 0.65rem;
  text-decoration: underline;
}

.section-link svg {
  width: 16px;
  height: 16px;
}

/* ========================
   Feature Cards (Multi-Agent)
   ======================== */
.feature-cards {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 1.25rem;
}

.feature-card {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  transition: border-color 0.2s;
}

.feature-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
}

.feature-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.feature-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-card-icon svg {
  width: 20px;
  height: 20px;
}

.feature-card-icon.context {
  background: rgba(34, 211, 238, 0.12);
  color: #22d3ee;
}

.feature-card-icon.tasks {
  background: rgba(168, 85, 247, 0.12);
  color: #a855f7;
}

.feature-card-icon.locks {
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
}

.feature-card-header h4 {
  margin: 0;
  font-size: 1.05rem;
}

.feature-card > p {
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

/* ========================
   CLI Table
   ======================== */
.cli-table {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  margin: 1rem 0 1.5rem;
}

.cli-row {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1rem;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  align-items: center;
  transition: background 0.15s;
}

.cli-row:last-child {
  border-bottom: none;
}

.cli-row:not(.header):hover {
  background: rgba(255, 255, 255, 0.02);
}

.cli-row.header {
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.cli-row.header .cli-cmd,
.cli-row.header .cli-desc {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  font-family: inherit;
  background: transparent;
  padding: 0;
}

.cli-cmd {
  font-size: 0.82rem;
  color: #22d3ee;
}

.cli-desc {
  font-size: 0.82rem;
  color: #94a3b8;
}

/* ========================
   Resource Grid
   ======================== */
.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.resource-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}

.resource-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(168, 85, 247, 0.3);
  transform: translateY(-1px);
}

.resource-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.resource-icon svg {
  width: 22px;
  height: 22px;
}

.resource-icon.github {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
}

.resource-icon.discord {
  background: rgba(88, 101, 242, 0.15);
  color: #7289da;
}

.resource-icon.api {
  background: rgba(168, 85, 247, 0.12);
  color: #a855f7;
}

.resource-icon.changelog {
  background: rgba(34, 211, 238, 0.12);
  color: #22d3ee;
}

.resource-content {
  display: flex;
  flex-direction: column;
}

.resource-content strong {
  font-size: 0.9rem;
  color: #e2e8f0;
}

.resource-content span {
  font-size: 0.78rem;
  color: #64748b;
  margin-top: 0.15rem;
}

/* ========================
   Responsive
   ======================== */
@media (max-width: 768px) {
  .doc-hero h1 {
    font-size: 2rem;
  }

  .hero-lead {
    font-size: 1.05rem;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-btn {
    justify-content: center;
  }

  .nav-cards {
    grid-template-columns: 1fr;
  }

  .arch-row {
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .arch-node {
    width: 100%;
    max-width: 200px;
  }

  .ws-flow {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .ws-flow-arrow {
    transform: rotate(90deg);
    align-self: center;
  }

  .events-grid {
    grid-template-columns: 1fr;
  }

  .endpoint-row {
    grid-template-columns: 55px 1fr;
  }

  .endpoint-row .ep-desc {
    display: none;
  }

  .endpoint-row.header .ep-desc {
    display: none;
  }

  .cli-row {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }

  .resource-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .doc-hero h1 {
    font-size: 1.75rem;
  }

  section {
    margin-bottom: 2.5rem;
  }

  .feature-card {
    padding: 1.15rem;
  }
}
</style>
