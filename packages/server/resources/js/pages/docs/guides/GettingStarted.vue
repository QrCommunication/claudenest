<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>Getting Started</h1>
      <p class="lead">
        ClaudeNest is a remote Claude Code orchestration platform that lets you control,
        coordinate, and monitor multiple Claude Code instances from anywhere.
      </p>
    </header>

    <section id="overview">
      <h2>Overview</h2>
      <p>
        ClaudeNest transforms Claude Code from a local-only tool into a fully remote,
        multi-agent system. Whether you need to run Claude on a powerful server,
        coordinate multiple instances on the same codebase, or monitor sessions from
        your phone, ClaudeNest provides the infrastructure to make it happen.
      </p>
      <p>Key capabilities include:</p>
      <ul>
        <li><strong>Remote Access</strong> &mdash; Control Claude Code instances running on any machine from a web dashboard or mobile app</li>
        <li><strong>Multi-Agent Coordination</strong> &mdash; Run multiple Claude instances on the same project with shared context, task coordination, and file locking</li>
        <li><strong>Context RAG</strong> &mdash; pgvector-powered retrieval augmented generation so every agent shares project understanding</li>
        <li><strong>Real-Time Communication</strong> &mdash; WebSocket-based bidirectional streaming for terminal I/O</li>
        <li><strong>MCP Integration</strong> &mdash; Discover and manage Model Context Protocol servers across your machines</li>
      </ul>
    </section>

    <section id="architecture">
      <h2>Architecture</h2>
      <p>
        ClaudeNest follows a hub-and-spoke architecture with three main components
        that communicate in real time:
      </p>

      <h3>Server (Hub)</h3>
      <p>
        The central Laravel 11 application handles authentication, API routing,
        WebSocket relay via Laravel Reverb, and persistent storage in PostgreSQL
        with pgvector for embeddings. It also serves the Vue.js web dashboard.
      </p>

      <CodeBlock
        :code="serverStackCode"
        language="text"
        filename="Server Stack"
      />

      <h3>Agent (Spoke)</h3>
      <p>
        A lightweight Node.js daemon that runs on each machine you want to control.
        It manages local Claude Code processes via <code>node-pty</code>, streams
        terminal output over WebSocket, and handles session lifecycle.
      </p>

      <CodeBlock
        :code="agentStackCode"
        language="text"
        filename="Agent Stack"
      />

      <h3>Clients</h3>
      <p>
        Users interact with ClaudeNest through the web dashboard (Vue.js + xterm.js),
        native mobile apps (React Native), or directly via the REST API. All clients
        connect to the server, which relays commands to the appropriate agent.
      </p>

      <CodeBlock
        :code="architectureDiagram"
        language="text"
        filename="Data Flow"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        The agent connects outbound to the server via WebSocket, so no inbound ports
        need to be opened on the machine running Claude Code.
      </p>
    </section>

    <section id="prerequisites">
      <h2>Prerequisites</h2>
      <p>Before setting up ClaudeNest, make sure you have the following:</p>

      <h3>For the Server</h3>
      <ul class="checklist">
        <li><span class="check">&#10003;</span> PHP 8.3+ with required extensions (pgsql, redis, pcntl)</li>
        <li><span class="check">&#10003;</span> PostgreSQL 16+ with the pgvector extension</li>
        <li><span class="check">&#10003;</span> Redis 7+ for caching, queues, and broadcasting</li>
        <li><span class="check">&#10003;</span> Node.js 20+ and npm (for building the frontend)</li>
        <li><span class="check">&#10003;</span> Composer 2.x for PHP dependencies</li>
      </ul>

      <h3>For the Agent</h3>
      <ul class="checklist">
        <li><span class="check">&#10003;</span> Node.js 20 LTS</li>
        <li><span class="check">&#10003;</span> Claude Code CLI installed and authenticated</li>
        <li><span class="check">&#10003;</span> Network access to the ClaudeNest server (outbound WebSocket)</li>
      </ul>

      <h3>For Development</h3>
      <ul class="checklist">
        <li><span class="check">&#10003;</span> Git</li>
        <li><span class="check">&#10003;</span> A code editor with Vue.js and PHP support</li>
        <li><span class="check">&#10003;</span> Docker (optional, for containerized setup)</li>
      </ul>

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        If you prefer Docker, you can skip the individual prerequisites and use
        <code>docker-compose up</code> to start all services at once.
      </p>
    </section>

    <section id="next-steps">
      <h2>Next Steps</h2>
      <p>Now that you understand the platform, follow these guides to get up and running:</p>
      <div class="next-steps">
        <router-link to="/docs/installation" class="next-step">
          <strong>Installation</strong>
          <span>Install and configure the ClaudeNest server &#8594;</span>
        </router-link>
        <router-link to="/docs/guides/first-machine" class="next-step">
          <strong>Register Your First Machine</strong>
          <span>Set up the agent and pair it with the server &#8594;</span>
        </router-link>
        <router-link to="/docs/guides/remote-sessions" class="next-step">
          <strong>Remote Sessions</strong>
          <span>Create and interact with Claude Code sessions &#8594;</span>
        </router-link>
        <router-link to="/docs/api" class="next-step">
          <strong>API Reference</strong>
          <span>Explore the full REST API documentation &#8594;</span>
        </router-link>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const serverStackCode = `Server Components
-----------------
Laravel 11          API & WebSocket relay
PostgreSQL 16       Primary database + pgvector embeddings
Redis 7             Cache, queues, broadcasting
Laravel Reverb      WebSocket server
Vue.js 3            Web dashboard (SPA)
xterm.js            Terminal emulation in the browser`;

const agentStackCode = `Agent Components
----------------
Node.js 20          Runtime
node-pty            PTY management for Claude Code processes
ws                  WebSocket client (connects to server)
keytar              Secure credential storage (OS keychain)
pino                Structured logging`;

const architectureDiagram = `Client (Browser / Mobile)
    |
    |  HTTPS + WSS
    v
ClaudeNest Server (Laravel + Reverb)
    |
    |  WebSocket (outbound from agent)
    v
Agent (Node.js daemon)
    |
    |  node-pty (spawns process)
    v
Claude Code CLI (local)`;
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

/* Checklist */
.checklist {
  list-style: none;
  padding: 0;
}

.checklist li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.check {
  width: 24px;
  height: 24px;
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
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
