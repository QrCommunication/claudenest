<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>ClaudeNest Documentation</h1>
      <p class="lead">
        Welcome to the ClaudeNest API documentation. ClaudeNest is a remote Claude Code 
        orchestration platform that enables you to control Claude Code from anywhere.
      </p>
    </header>

    <section id="what-is-claudenest">
      <h2>What is ClaudeNest?</h2>
      <p>
        ClaudeNest is a comprehensive platform for managing Claude Code instances remotely. 
        It consists of three main components:
      </p>
      
      <div class="component-cards">
        <div class="component-card">
          <div class="card-icon server">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 3C2.89 3 2 3.89 2 5V9C2 10.11 2.89 11 4 11H20C21.11 11 22 10.11 22 9V5C22 3.89 21.11 3 20 3H4M4 13C2.89 13 2 13.89 2 15V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V15C22 13.89 21.11 13 20 13H4M8 7H16V9H8V7M8 17H16V19H8V17Z"/>
            </svg>
          </div>
          <h3>Server</h3>
          <p>Laravel backend with WebSocket relay, web dashboard, and REST API</p>
        </div>
        
        <div class="component-card">
          <div class="card-icon agent">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h3>Agent</h3>
          <p>Local Node.js daemon that manages PTY and connects to the server</p>
        </div>
        
        <div class="component-card">
          <div class="card-icon mobile">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
            </svg>
          </div>
          <h3>Mobile</h3>
          <p>iOS and Android apps for on-the-go access</p>
        </div>
      </div>
    </section>

    <section id="features">
      <h2>Key Features</h2>
      <div class="features-grid">
        <div class="feature">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <h3>Remote Access</h3>
          <p>Control Claude Code from anywhere via web dashboard or mobile apps</p>
        </div>
        
        <div class="feature">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <h3>Multi-Agent</h3>
          <p>Run multiple Claude instances on the same project with shared context</p>
        </div>
        
        <div class="feature">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
          </div>
          <h3>Secure</h3>
          <p>OAuth authentication, machine tokens, and end-to-end encryption</p>
        </div>
        
        <div class="feature">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          </div>
          <h3>Task Coordination</h3>
          <p>Atomic task claiming and file locking to prevent conflicts</p>
        </div>
        
        <div class="feature">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>
          <h3>RAG Context</h3>
          <p>pgvector-powered semantic search for context retrieval</p>
        </div>
        
        <div class="feature">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
          <h3>Web Terminal</h3>
          <p>Full-featured terminal with xterm.js in the browser</p>
        </div>
      </div>
    </section>

    <section id="architecture">
      <h2>Architecture Overview</h2>
      <pre class="architecture-diagram"><code>
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │     │    Web      │     │    Agent    │
│  iOS/Android│     │   Dashboard │     │  Local Mac  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
              ┌────────────┴────────────┐
              │   ClaudeNest Server     │
              │  Laravel + Reverb + RAG │
              └────────────┬────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │PostgreSQL│       │  Redis  │       │ Ollama  │
   │+pgvector│       │ (Cache) │       │Mistral7B│
   └─────────┘       └─────────┘       └─────────┘
      </code></pre>
    </section>

    <section id="getting-started">
      <h2>Getting Started</h2>
      <p>Ready to get started with ClaudeNest? Follow these steps:</p>
      
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Install the Server</h3>
            <p>Deploy the ClaudeNest server using Docker or bare-metal installation.</p>
            <router-link to="/docs/installation" class="step-link">
              Installation Guide →
            </router-link>
          </div>
        </div>
        
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>Configure Authentication</h3>
            <p>Set up OAuth providers or use email/password authentication.</p>
            <router-link to="/docs/authentication" class="step-link">
              Authentication Setup →
            </router-link>
          </div>
        </div>
        
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Connect Your First Machine</h3>
            <p>Install and configure the agent on your local machine.</p>
            <router-link to="/docs/quickstart" class="step-link">
              Quickstart Guide →
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <section id="api-overview">
      <h2>API Overview</h2>
      <p>
        The ClaudeNest API is a RESTful API that uses JSON for request and response bodies. 
        All endpoints are prefixed with <code>/api</code>.
      </p>
      
      <h3>Base URL</h3>
      <CodeBlock code="https://your-claudenest-instance.com/api" language="bash" />
      
      <h3>Authentication</h3>
      <p>
        Most endpoints require authentication using a Bearer token in the 
        <code>Authorization</code> header:
      </p>
      <CodeBlock code="Authorization: Bearer your-token-here" language="bash" />
      
      <h3>Response Format</h3>
      <p>All responses follow a consistent format:</p>
      <CodeBlock 
        :code="responseFormatExample" 
        language="json" 
      />
    </section>

    <section id="support">
      <h2>Support & Resources</h2>
      <div class="resource-links">
        <a href="https://github.com/yourusername/claudenest" target="_blank" class="resource-link">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
          </svg>
          GitHub Repository
        </a>
        <a href="#" class="resource-link">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
          Community Discord
        </a>
        <a href="mailto:support@claudenest.dev" class="resource-link">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
          Email Support
        </a>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import CodeBlock from '@/components/docs/CodeBlock.vue';

const responseFormatExample = `{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2026-02-02T17:00:00Z",
    "request_id": "req_abc123"
  }
}`;
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
  margin: 0 0 0.75rem;
  color: #ffffff;
}

p {
  color: #a9b1d6;
  line-height: 1.7;
  margin: 0 0 1rem;
}

/* Component Cards */
.component-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.component-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
}

.component-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(168, 85, 247, 0.3);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.card-icon svg {
  width: 24px;
  height: 24px;
}

.card-icon.server {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

.card-icon.agent {
  background: rgba(34, 211, 238, 0.2);
  color: #22d3ee;
}

.card-icon.mobile {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.component-card h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.component-card p {
  font-size: 0.9rem;
  margin: 0;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.feature {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.feature-icon {
  width: 40px;
  height: 40px;
  background: rgba(168, 85, 247, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a855f7;
  flex-shrink: 0;
}

.feature-icon svg {
  width: 20px;
  height: 20px;
}

.feature h3 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.feature p {
  font-size: 0.9rem;
  margin: 0;
}

/* Architecture Diagram */
.architecture-diagram {
  background: #0d0d14;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  overflow-x: auto;
  margin: 1.5rem 0;
}

.architecture-diagram code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: #a855f7;
  line-height: 1.4;
}

/* Steps */
.steps {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.step {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.step-number {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #ffffff;
  flex-shrink: 0;
}

.step-content h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.step-content p {
  margin-bottom: 0.75rem;
}

.step-link {
  color: #a855f7;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

.step-link:hover {
  text-decoration: underline;
}

/* Resource Links */
.resource-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.resource-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #a9b1d6;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.resource-link:hover {
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.3);
  color: #ffffff;
}

.resource-link svg {
  width: 18px;
  height: 18px;
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
  
  .lead {
    font-size: 1.1rem;
  }
  
  .component-cards {
    grid-template-columns: 1fr;
  }
}
</style>
