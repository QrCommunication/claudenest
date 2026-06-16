<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ t('docDocsGuidesAgentsetup.title') }}</h1>
      <p class="lead">
        {{ t('docDocsGuidesAgentsetup.lead') }}
      </p>
    </header>

    <section id="installation">
      <h2>{{ t('docDocsGuidesAgentsetup.installationHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesAgentsetup.installationIntro') }}
      </p>

      <h3>{{ t('docDocsGuidesAgentsetup.viaNpmHeading') }}</h3>
      <CodeBlock
        code="npm install -g @claudenest/agent"
        language="bash"
        :filename="t('docDocsGuidesAgentsetup.terminalFilename')"
      />

      <h3>{{ t('docDocsGuidesAgentsetup.fromSourceHeading') }}</h3>
      <CodeBlock
        :code="installFromSourceCode"
        language="bash"
        :filename="t('docDocsGuidesAgentsetup.terminalFilename')"
      />

      <p>{{ t('docDocsGuidesAgentsetup.verifyInstallation') }}</p>
      <CodeBlock
        code="claudenest-agent --version"
        language="bash"
        :filename="t('docDocsGuidesAgentsetup.terminalFilename')"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        <span v-html="t('docDocsGuidesAgentsetup.nodeRequirement')"></span>
      </p>
    </section>

    <section id="configuration">
      <h2>{{ t('docDocsGuidesAgentsetup.configurationHeading') }}</h2>
      <p>
        <span v-html="t('docDocsGuidesAgentsetup.configurationIntro')"></span>
      </p>

      <h3>{{ t('docDocsGuidesAgentsetup.interactiveSetupHeading') }}</h3>
      <CodeBlock
        :code="interactiveSetupCode"
        language="bash"
        :filename="t('docDocsGuidesAgentsetup.terminalFilename')"
      />

      <h3>{{ t('docDocsGuidesAgentsetup.manualConfigHeading') }}</h3>
      <p>
        <span v-html="t('docDocsGuidesAgentsetup.manualConfigIntro')"></span>
      </p>

      <CodeBlock
        :code="configJsonCode"
        language="json"
        filename="~/.claudenest/config.json"
      />

      <h3>{{ t('docDocsGuidesAgentsetup.configReferenceHeading') }}</h3>
      <div class="config-table">
        <div class="config-row">
          <code>serverUrl</code>
          <span>{{ t('docDocsGuidesAgentsetup.refServerUrl') }}</span>
        </div>
        <div class="config-row">
          <code>machineToken</code>
          <span>{{ t('docDocsGuidesAgentsetup.refMachineToken') }}</span>
        </div>
        <div class="config-row">
          <code>claudePath</code>
          <span>{{ t('docDocsGuidesAgentsetup.refClaudePath') }}</span>
        </div>
        <div class="config-row">
          <code>websocket.reconnectDelay</code>
          <span>{{ t('docDocsGuidesAgentsetup.refReconnectDelay') }}</span>
        </div>
        <div class="config-row">
          <code>websocket.maxReconnectAttempts</code>
          <span>{{ t('docDocsGuidesAgentsetup.refMaxReconnectAttempts') }}</span>
        </div>
        <div class="config-row">
          <code>websocket.heartbeatInterval</code>
          <span>{{ t('docDocsGuidesAgentsetup.refHeartbeatInterval') }}</span>
        </div>
        <div class="config-row">
          <code>sessions.maxSessions</code>
          <span>{{ t('docDocsGuidesAgentsetup.refMaxSessions') }}</span>
        </div>
        <div class="config-row">
          <code>sessions.defaultCwd</code>
          <span>{{ t('docDocsGuidesAgentsetup.refDefaultCwd') }}</span>
        </div>
        <div class="config-row">
          <code>logLevel</code>
          <span>{{ t('docDocsGuidesAgentsetup.refLogLevel') }}</span>
        </div>
      </div>
    </section>

    <section id="connecting">
      <h2>{{ t('docDocsGuidesAgentsetup.connectingHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesAgentsetup.connectingIntro') }}
      </p>

      <h3>{{ t('docDocsGuidesAgentsetup.foregroundHeading') }}</h3>
      <CodeBlock
        code="claudenest-agent start"
        language="bash"
        :filename="t('docDocsGuidesAgentsetup.terminalFilename')"
      />

      <h3>{{ t('docDocsGuidesAgentsetup.systemServiceHeading') }}</h3>
      <CodeBlock
        :code="serviceInstallCode"
        language="bash"
        :filename="t('docDocsGuidesAgentsetup.terminalFilename')"
      />

      <p>{{ t('docDocsGuidesAgentsetup.verifyConnectionIntro') }}</p>

      <CodeBlock
        :code="verifyConnectionCode"
        language="bash"
        :filename="t('docDocsGuidesAgentsetup.terminalFilename')"
      />

      <CodeBlock
        :code="verifyConnectionResponse"
        language="json"
        :filename="t('docDocsGuidesAgentsetup.responseFilename')"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        <span v-html="t('docDocsGuidesAgentsetup.heartbeatTip')"></span>
      </p>
    </section>

    <section id="troubleshooting">
      <h2>{{ t('docDocsGuidesAgentsetup.troubleshootingHeading') }}</h2>

      <div class="trouble-grid">
        <div class="trouble-item">
          <h4>{{ t('docDocsGuidesAgentsetup.connectionRefusedHeading') }}</h4>
          <p>
            <span v-html="t('docDocsGuidesAgentsetup.connectionRefusedBody')"></span>
          </p>
          <CodeBlock
            :code="troubleConnectionCode"
            language="bash"
            :filename="t('docDocsGuidesAgentsetup.debugFilename')"
          />
        </div>

        <div class="trouble-item">
          <h4>{{ t('docDocsGuidesAgentsetup.invalidTokenHeading') }}</h4>
          <p>
            <span v-html="t('docDocsGuidesAgentsetup.invalidTokenBody')"></span>
          </p>
          <CodeBlock
            :code="troubleTokenCode"
            language="bash"
            :filename="t('docDocsGuidesAgentsetup.regenerateTokenFilename')"
          />
        </div>

        <div class="trouble-item">
          <h4>{{ t('docDocsGuidesAgentsetup.binaryNotFoundHeading') }}</h4>
          <p>
            <span v-html="t('docDocsGuidesAgentsetup.binaryNotFoundBody')"></span>
          </p>
          <CodeBlock
            code="which claude
# /usr/local/bin/claude"
            language="bash"
            :filename="t('docDocsGuidesAgentsetup.terminalFilename')"
          />
        </div>

        <div class="trouble-item">
          <h4>{{ t('docDocsGuidesAgentsetup.ptySpawnHeading') }}</h4>
          <p>
            <span v-html="t('docDocsGuidesAgentsetup.ptySpawnBody')"></span>
          </p>
          <CodeBlock
            code="# Rebuild native modules
cd $(npm root -g)/@claudenest/agent
npm rebuild node-pty"
            language="bash"
            :filename="t('docDocsGuidesAgentsetup.terminalFilename')"
          />
        </div>
      </div>
    </section>

    <section id="next-steps">
      <h2>{{ t('docDocsGuidesAgentsetup.nextStepsHeading') }}</h2>
      <div class="next-steps">
        <router-link to="/docs/guides/agent-update" class="next-step">
          <strong>{{ t('docDocsGuidesAgentsetup.nextAgentUpdateTitle') }}</strong>
          <span>{{ t('docDocsGuidesAgentsetup.nextAgentUpdateDesc') }} &#8594;</span>
        </router-link>
        <router-link to="/docs/quickstart" class="next-step">
          <strong>{{ t('docDocsGuidesAgentsetup.nextQuickstartTitle') }}</strong>
          <span>{{ t('docDocsGuidesAgentsetup.nextQuickstartDesc') }} &#8594;</span>
        </router-link>
        <router-link to="/docs/api/machines" class="next-step">
          <strong>{{ t('docDocsGuidesAgentsetup.nextMachinesTitle') }}</strong>
          <span>{{ t('docDocsGuidesAgentsetup.nextMachinesDesc') }} &#8594;</span>
        </router-link>
        <router-link to="/docs/guides/task-coordination" class="next-step">
          <strong>{{ t('docDocsGuidesAgentsetup.nextTaskCoordTitle') }}</strong>
          <span>{{ t('docDocsGuidesAgentsetup.nextTaskCoordDesc') }} &#8594;</span>
        </router-link>
        <router-link to="/docs/websocket" class="next-step">
          <strong>{{ t('docDocsGuidesAgentsetup.nextWebsocketTitle') }}</strong>
          <span>{{ t('docDocsGuidesAgentsetup.nextWebsocketDesc') }} &#8594;</span>
        </router-link>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import CodeBlock from '@/components/docs/CodeBlock.vue';

const { t } = useI18n();

const installFromSourceCode = ref(`git clone https://github.com/yourusername/claudenest.git
cd claudenest/packages/agent
npm install
npm run build
npm link`);

const interactiveSetupCode = ref(`claudenest-agent configure
# ? Server URL: wss://claudenest.yourdomain.com:8080
# ? Machine Token: mn_xxxxxxxxxxxxxxxxxxxxxxxx
# ? Claude binary path: /usr/local/bin/claude
# ? Max concurrent sessions: 10
# Configuration saved to ~/.claudenest/config.json`);

const configJsonCode = ref(`{
  "serverUrl": "wss://claudenest.yourdomain.com:8080",
  "machineToken": "mn_xxxxxxxxxxxxxxxxxxxxxxxx",
  "claudePath": "/usr/local/bin/claude",
  "projectPaths": [
    "~/projects"
  ],
  "cachePath": "~/.cache/claudenest",
  "logLevel": "info",
  "websocket": {
    "reconnectDelay": 1000,
    "maxReconnectDelay": 30000,
    "maxReconnectAttempts": 10,
    "heartbeatInterval": 30000
  },
  "sessions": {
    "maxSessions": 10,
    "defaultCwd": "~"
  }
}`);

const serviceInstallCode = ref(`# Install the systemd / launchd service
claudenest-agent install-service

# Start the service
claudenest-agent start-service

# Check service status
claudenest-agent status`);

const verifyConnectionCode = ref(`curl https://claudenest.yourdomain.com/api/machines \\
  -H 'Authorization: Bearer YOUR_TOKEN'`);

const verifyConnectionResponse = ref(`{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "MacBook-Pro-Work",
      "platform": "darwin",
      "status": "online",
      "is_online": true,
      "agent_version": "1.1.0",
      "last_seen_at": "2026-02-17T10:00:00Z"
    }
  ]
}`);

const troubleConnectionCode = ref(`# Run with debug logging
claudenest-agent start --log-level debug

# Test WebSocket connectivity
wscat -c wss://claudenest.yourdomain.com:8080

# Check firewall rules
sudo ufw status | grep 8080`);

const troubleTokenCode = ref(`curl -X POST https://claudenest.yourdomain.com/api/machines/MACHINE_ID/regenerate-token \\
  -H 'Authorization: Bearer YOUR_USER_TOKEN'

# Copy the new token to ~/.claudenest/config.json`);
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

/* Config Reference Table */
.config-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0 1.5rem;
}

.config-row {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 8px;
  align-items: baseline;
}

.config-row code {
  flex-shrink: 0;
  min-width: 240px;
}

.config-row span {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Troubleshooting Grid */
.trouble-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.trouble-item {
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
}

.trouble-item h4 {
  margin: 0 0 0.5rem;
}

.trouble-item p {
  font-size: 0.95rem;
  margin: 0 0 0.75rem;
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

  .config-row {
    flex-direction: column;
    gap: 0.25rem;
  }

  .config-row code {
    min-width: auto;
  }
}
</style>
