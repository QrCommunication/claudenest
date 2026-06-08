<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ t('docDocsGuidesGettingstarted.title') }}</h1>
      <p class="lead">
        {{ t('docDocsGuidesGettingstarted.lead') }}
      </p>
    </header>

    <section id="overview">
      <h2>{{ t('docDocsGuidesGettingstarted.overviewHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesGettingstarted.overviewPara1') }}
      </p>
      <p>{{ t('docDocsGuidesGettingstarted.keyCapabilitiesIntro') }}</p>
      <ul>
        <li><strong>{{ t('docDocsGuidesGettingstarted.capRemoteAccessLabel') }}</strong> &mdash; {{ t('docDocsGuidesGettingstarted.capRemoteAccessText') }}</li>
        <li><strong>{{ t('docDocsGuidesGettingstarted.capMultiAgentLabel') }}</strong> &mdash; {{ t('docDocsGuidesGettingstarted.capMultiAgentText') }}</li>
        <li><strong>{{ t('docDocsGuidesGettingstarted.capContextRagLabel') }}</strong> &mdash; {{ t('docDocsGuidesGettingstarted.capContextRagText') }}</li>
        <li><strong>{{ t('docDocsGuidesGettingstarted.capRealTimeLabel') }}</strong> &mdash; {{ t('docDocsGuidesGettingstarted.capRealTimeText') }}</li>
        <li><strong>{{ t('docDocsGuidesGettingstarted.capMcpLabel') }}</strong> &mdash; {{ t('docDocsGuidesGettingstarted.capMcpText') }}</li>
      </ul>
    </section>

    <section id="architecture">
      <h2>{{ t('docDocsGuidesGettingstarted.architectureHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesGettingstarted.architecturePara1') }}
      </p>

      <h3>{{ t('docDocsGuidesGettingstarted.serverHubHeading') }}</h3>
      <p>
        {{ t('docDocsGuidesGettingstarted.serverHubPara') }}
      </p>

      <CodeBlock
        :code="serverStackCode"
        language="text"
        :filename="t('docDocsGuidesGettingstarted.serverStackFilename')"
      />

      <h3>{{ t('docDocsGuidesGettingstarted.agentSpokeHeading') }}</h3>
      <p>
        {{ t('docDocsGuidesGettingstarted.agentSpokePara1') }} <code>node-pty</code>{{ t('docDocsGuidesGettingstarted.agentSpokePara2') }}
      </p>

      <CodeBlock
        :code="agentStackCode"
        language="text"
        :filename="t('docDocsGuidesGettingstarted.agentStackFilename')"
      />

      <h3>{{ t('docDocsGuidesGettingstarted.clientsHeading') }}</h3>
      <p>
        {{ t('docDocsGuidesGettingstarted.clientsPara') }}
      </p>

      <CodeBlock
        :code="architectureDiagram"
        language="text"
        :filename="t('docDocsGuidesGettingstarted.dataFlowFilename')"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        {{ t('docDocsGuidesGettingstarted.architectureTip') }}
      </p>
    </section>

    <section id="prerequisites">
      <h2>{{ t('docDocsGuidesGettingstarted.prerequisitesHeading') }}</h2>
      <p>{{ t('docDocsGuidesGettingstarted.prerequisitesIntro') }}</p>

      <h3>{{ t('docDocsGuidesGettingstarted.forServerHeading') }}</h3>
      <ul class="checklist">
        <li><span class="check">&#10003;</span> {{ t('docDocsGuidesGettingstarted.reqServerPhp') }}</li>
        <li><span class="check">&#10003;</span> {{ t('docDocsGuidesGettingstarted.reqServerPostgres') }}</li>
        <li><span class="check">&#10003;</span> {{ t('docDocsGuidesGettingstarted.reqServerRedis') }}</li>
        <li><span class="check">&#10003;</span> {{ t('docDocsGuidesGettingstarted.reqServerNode') }}</li>
        <li><span class="check">&#10003;</span> {{ t('docDocsGuidesGettingstarted.reqServerComposer') }}</li>
      </ul>

      <h3>{{ t('docDocsGuidesGettingstarted.forAgentHeading') }}</h3>
      <ul class="checklist">
        <li><span class="check">&#10003;</span> {{ t('docDocsGuidesGettingstarted.reqAgentNode') }}</li>
        <li><span class="check">&#10003;</span> {{ t('docDocsGuidesGettingstarted.reqAgentCli') }}</li>
        <li><span class="check">&#10003;</span> {{ t('docDocsGuidesGettingstarted.reqAgentNetwork') }}</li>
      </ul>

      <h3>{{ t('docDocsGuidesGettingstarted.forDevelopmentHeading') }}</h3>
      <ul class="checklist">
        <li><span class="check">&#10003;</span> {{ t('docDocsGuidesGettingstarted.reqDevGit') }}</li>
        <li><span class="check">&#10003;</span> {{ t('docDocsGuidesGettingstarted.reqDevEditor') }}</li>
        <li><span class="check">&#10003;</span> {{ t('docDocsGuidesGettingstarted.reqDevDocker') }}</li>
      </ul>

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        {{ t('docDocsGuidesGettingstarted.prerequisitesTipPre') }} <code>docker-compose up</code> {{ t('docDocsGuidesGettingstarted.prerequisitesTipPost') }}
      </p>
    </section>

    <section id="next-steps">
      <h2>{{ t('docDocsGuidesGettingstarted.nextStepsHeading') }}</h2>
      <p>{{ t('docDocsGuidesGettingstarted.nextStepsIntro') }}</p>
      <div class="next-steps">
        <router-link to="/docs/installation" class="next-step">
          <strong>{{ t('docDocsGuidesGettingstarted.nextInstallationLabel') }}</strong>
          <span>{{ t('docDocsGuidesGettingstarted.nextInstallationText') }} &#8594;</span>
        </router-link>
        <router-link to="/docs/guides/first-machine" class="next-step">
          <strong>{{ t('docDocsGuidesGettingstarted.nextFirstMachineLabel') }}</strong>
          <span>{{ t('docDocsGuidesGettingstarted.nextFirstMachineText') }} &#8594;</span>
        </router-link>
        <router-link to="/docs/guides/remote-sessions" class="next-step">
          <strong>{{ t('docDocsGuidesGettingstarted.nextRemoteSessionsLabel') }}</strong>
          <span>{{ t('docDocsGuidesGettingstarted.nextRemoteSessionsText') }} &#8594;</span>
        </router-link>
        <router-link to="/docs/api" class="next-step">
          <strong>{{ t('docDocsGuidesGettingstarted.nextApiLabel') }}</strong>
          <span>{{ t('docDocsGuidesGettingstarted.nextApiText') }} &#8594;</span>
        </router-link>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const { t } = useI18n();

const serverStackCode = `Server Components
-----------------
Laravel 13          API & WebSocket relay
PostgreSQL 16+      Primary database + pgvector embeddings
Redis 7+            Cache, queues, broadcasting
Laravel Reverb      WebSocket server
Vue.js 3.5          Web dashboard (SPA)
xterm.js            Terminal emulation in the browser`;

const agentStackCode = `Agent Components
----------------
Node.js 24 LTS      Runtime
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
