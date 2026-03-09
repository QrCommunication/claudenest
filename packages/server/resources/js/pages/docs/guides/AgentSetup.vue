<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>Agent Setup</h1>
      <p class="lead">
        Install and configure the ClaudeNest agent on your machine. The agent is a
        lightweight daemon that connects to the server, manages PTY sessions, and
        relays terminal I/O in real time.
      </p>
    </header>

    <section id="installation">
      <h2>Installation</h2>
      <p>
        The agent is distributed as an npm package. You can install it globally or run
        it from a cloned repository.
      </p>

      <h3>Via npm (recommended)</h3>
      <CodeBlock
        code="npm install -g @claudenest/agent"
        language="bash"
        filename="Terminal"
      />

      <h3>From source</h3>
      <CodeBlock
        :code="installFromSourceCode"
        language="bash"
        filename="Terminal"
      />

      <p>Verify the installation:</p>
      <CodeBlock
        code="claudenest-agent --version"
        language="bash"
        filename="Terminal"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        The agent requires <strong>Node.js 20 LTS</strong> or later. On Linux and macOS
        the <code>node-pty</code> native add-on is compiled during install, so you also
        need a C++ toolchain (build-essential / Xcode CLI tools).
      </p>
    </section>

    <section id="configuration">
      <h2>Configuration</h2>
      <p>
        The agent reads its configuration from <code>~/.claudenest/config.json</code>.
        You can generate a starter file interactively or create one manually.
      </p>

      <h3>Interactive setup</h3>
      <CodeBlock
        :code="interactiveSetupCode"
        language="bash"
        filename="Terminal"
      />

      <h3>Manual configuration</h3>
      <p>
        Create or edit <code>~/.claudenest/config.json</code> with the following
        structure:
      </p>

      <CodeBlock
        :code="configJsonCode"
        language="json"
        filename="~/.claudenest/config.json"
      />

      <h3>Configuration Reference</h3>
      <div class="config-table">
        <div class="config-row">
          <code>serverUrl</code>
          <span>WebSocket URL of the ClaudeNest server (wss:// for production)</span>
        </div>
        <div class="config-row">
          <code>machineToken</code>
          <span>Authentication token obtained when registering the machine via the API or dashboard</span>
        </div>
        <div class="config-row">
          <code>claudePath</code>
          <span>Absolute path to the Claude Code binary</span>
        </div>
        <div class="config-row">
          <code>websocket.reconnectDelay</code>
          <span>Initial reconnect delay in milliseconds (exponential backoff)</span>
        </div>
        <div class="config-row">
          <code>websocket.maxReconnectAttempts</code>
          <span>Maximum number of reconnection attempts before giving up</span>
        </div>
        <div class="config-row">
          <code>websocket.heartbeatInterval</code>
          <span>Interval in milliseconds between heartbeat pings</span>
        </div>
        <div class="config-row">
          <code>sessions.maxSessions</code>
          <span>Maximum concurrent PTY sessions on this machine</span>
        </div>
        <div class="config-row">
          <code>sessions.defaultCwd</code>
          <span>Default working directory for new sessions</span>
        </div>
        <div class="config-row">
          <code>logLevel</code>
          <span>Logging verbosity: debug, info, warn, or error</span>
        </div>
      </div>
    </section>

    <section id="connecting">
      <h2>Connecting to the Server</h2>
      <p>
        Once configured, start the agent. It will connect to the server, register
        the machine capabilities, and begin listening for session requests.
      </p>

      <h3>Run in the foreground</h3>
      <CodeBlock
        code="claudenest-agent start"
        language="bash"
        filename="Terminal"
      />

      <h3>Run as a system service</h3>
      <CodeBlock
        :code="serviceInstallCode"
        language="bash"
        filename="Terminal"
      />

      <p>You can verify the connection from the dashboard or the API:</p>

      <CodeBlock
        :code="verifyConnectionCode"
        language="bash"
        filename="Terminal"
      />

      <CodeBlock
        :code="verifyConnectionResponse"
        language="json"
        filename="Response"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        The agent sends a heartbeat every 30 seconds. If the server does not receive a
        heartbeat within 90 seconds the machine is automatically marked as
        <code>offline</code>.
      </p>
    </section>

    <section id="troubleshooting">
      <h2>Troubleshooting</h2>

      <div class="trouble-grid">
        <div class="trouble-item">
          <h4>Connection Refused</h4>
          <p>
            The agent cannot reach the server. Verify that
            <code>serverUrl</code> in your config points to the correct host and port.
            Check that the Reverb WebSocket server is running and that firewalls allow
            outbound traffic on the configured port.
          </p>
          <CodeBlock
            :code="troubleConnectionCode"
            language="bash"
            filename="Debug"
          />
        </div>

        <div class="trouble-item">
          <h4>Invalid Token</h4>
          <p>
            The server rejects the machine token. Regenerate it from the dashboard or
            via the API and update <code>config.json</code>.
          </p>
          <CodeBlock
            :code="troubleTokenCode"
            language="bash"
            filename="Regenerate Token"
          />
        </div>

        <div class="trouble-item">
          <h4>Claude Binary Not Found</h4>
          <p>
            The agent cannot locate the Claude Code binary. Run <code>which claude</code>
            to find the correct path and update the <code>claudePath</code> field in your
            configuration.
          </p>
          <CodeBlock
            code="which claude
# /usr/local/bin/claude"
            language="bash"
            filename="Terminal"
          />
        </div>

        <div class="trouble-item">
          <h4>PTY Spawn Errors</h4>
          <p>
            If sessions fail to start with <code>ENOENT</code> or permission errors,
            ensure <code>node-pty</code> is compiled for your platform and the agent
            process has the required permissions.
          </p>
          <CodeBlock
            code="# Rebuild native modules
cd $(npm root -g)/@claudenest/agent
npm rebuild node-pty"
            language="bash"
            filename="Terminal"
          />
        </div>
      </div>
    </section>

    <section id="next-steps">
      <h2>Next Steps</h2>
      <div class="next-steps">
        <router-link to="/docs/quickstart" class="next-step">
          <strong>Quickstart Guide</strong>
          <span>Create your first session end-to-end &#8594;</span>
        </router-link>
        <router-link to="/docs/api/machines" class="next-step">
          <strong>Machines API</strong>
          <span>Register and manage machines programmatically &#8594;</span>
        </router-link>
        <router-link to="/docs/guides/task-coordination" class="next-step">
          <strong>Task Coordination</strong>
          <span>Distribute work between Claude instances &#8594;</span>
        </router-link>
        <router-link to="/docs/websocket" class="next-step">
          <strong>WebSocket Protocol</strong>
          <span>Real-time communication reference &#8594;</span>
        </router-link>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';

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
