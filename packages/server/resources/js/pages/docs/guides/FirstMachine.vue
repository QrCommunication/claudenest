<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>Register Your First Machine</h1>
      <p class="lead">
        Set up the ClaudeNest agent on a machine and pair it with your server
        to start running remote Claude Code sessions.
      </p>
    </header>

    <section id="install-agent">
      <h2>Install the Agent</h2>
      <p>
        The ClaudeNest agent is a Node.js daemon that runs on any machine where
        Claude Code is installed. It manages local processes, streams terminal
        output, and handles session lifecycle.
      </p>

      <h3>Via npm (recommended)</h3>
      <CodeBlock
        code="npm install -g @claudenest/agent"
        language="bash"
        filename="Terminal"
      />

      <h3>Via the install script</h3>
      <CodeTabs :tabs="installScriptTabs" />

      <p>
        After installation, verify the agent is available:
      </p>

      <CodeBlock
        code="claudenest-agent --version"
        language="bash"
        filename="Terminal"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        The agent requires Node.js 20 LTS or later and Claude Code CLI already
        installed and authenticated on the machine.
      </p>
    </section>

    <section id="pairing">
      <h2>Pairing Flow</h2>
      <p>
        Pairing connects the agent to your ClaudeNest server. The process uses a
        short-lived pairing code to securely exchange credentials without exposing
        tokens.
      </p>

      <h3>Step 1: Start the agent in pairing mode</h3>
      <CodeBlock
        :code="pairingStartCode"
        language="bash"
        filename="Terminal (on the machine)"
      />

      <p>
        The agent will display a 6-character pairing code and wait for confirmation
        from the server.
      </p>

      <CodeBlock
        :code="pairingOutputCode"
        language="text"
        filename="Agent Output"
      />

      <h3>Step 2: Enter the code in the dashboard</h3>
      <p>
        Open your ClaudeNest dashboard, navigate to <strong>Machines</strong>, click
        <strong>Add Machine</strong>, and enter the pairing code displayed by the agent.
        The server will register the machine and send back a persistent authentication token.
      </p>

      <h3>Step 3: Automatic connection</h3>
      <p>
        Once paired, the agent stores its token securely in the OS keychain and
        connects to the server automatically on startup. You can also register
        a machine programmatically via the API:
      </p>

      <CodeTabs :tabs="registerMachineTabs" />

      <CodeBlock
        :code="registerMachineResponse"
        language="json"
        filename="Response"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        Store the returned <code>token</code> securely. It is the machine's
        authentication credential and is only shown once.
      </p>
    </section>

    <section id="verify">
      <h2>Verify the Machine</h2>
      <p>
        After pairing, confirm the machine is online and ready to accept sessions.
      </p>

      <h3>From the dashboard</h3>
      <p>
        Navigate to <strong>Machines</strong> in the sidebar. Your machine should
        appear with a green <strong>online</strong> status indicator and its
        platform, hostname, and agent version.
      </p>

      <h3>Via the API</h3>
      <CodeTabs :tabs="listMachinesTabs" />

      <CodeBlock
        :code="listMachinesResponse"
        language="json"
        filename="Response"
      />

      <h3>Agent health check</h3>
      <p>
        On the machine itself, you can check the agent's connection status:
      </p>

      <CodeBlock
        code="claudenest-agent status"
        language="bash"
        filename="Terminal"
      />

      <CodeBlock
        :code="agentStatusOutput"
        language="text"
        filename="Output"
      />
    </section>

    <section id="next-steps">
      <h2>Next Steps</h2>
      <p>Your machine is registered and online. Here is what to do next:</p>
      <div class="next-steps">
        <router-link to="/docs/guides/remote-sessions" class="next-step">
          <strong>Remote Sessions</strong>
          <span>Create your first Claude Code session on this machine &#8594;</span>
        </router-link>
        <router-link to="/docs/api/machines" class="next-step">
          <strong>Machines API</strong>
          <span>Manage machines, tokens, and capabilities &#8594;</span>
        </router-link>
        <router-link to="/docs/api/projects" class="next-step">
          <strong>Multi-Agent Projects</strong>
          <span>Set up shared projects for multi-agent collaboration &#8594;</span>
        </router-link>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const installScriptTabs = ref([
  {
    label: 'macOS / Linux',
    language: 'bash',
    code: `curl -fsSL https://claudenest.io/install-agent.sh | bash`,
    filename: 'Terminal',
  },
  {
    label: 'Windows',
    language: 'powershell',
    code: `irm https://claudenest.io/install-agent.ps1 | iex`,
    filename: 'PowerShell',
  },
]);

const pairingStartCode = `claudenest-agent pair --server https://claudenest.yourdomain.com`;

const pairingOutputCode = `ClaudeNest Agent v1.2.3
Pairing with server: https://claudenest.yourdomain.com

  Pairing Code:  A7X-K2M

Enter this code in the ClaudeNest dashboard under Machines > Add Machine.
Waiting for confirmation...`;

const registerMachineTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://claudenest.yourdomain.com/api/machines \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Dev Workstation",
    "platform": "linux",
    "hostname": "dev-ws.local",
    "arch": "x64",
    "node_version": "20.10.0",
    "agent_version": "1.2.3",
    "claude_version": "0.2.0",
    "claude_path": "/usr/local/bin/claude",
    "capabilities": ["docker"],
    "max_sessions": 5
  }'`,
    filename: 'Request',
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch('https://claudenest.yourdomain.com/api/machines', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Dev Workstation',
    platform: 'linux',
    hostname: 'dev-ws.local',
    arch: 'x64',
    node_version: '20.10.0',
    agent_version: '1.2.3',
    claude_version: '0.2.0',
    claude_path: '/usr/local/bin/claude',
    capabilities: ['docker'],
    max_sessions: 5,
  }),
});

const result = await response.json();
console.log('Machine ID:', result.data.machine.id);
console.log('Token:', result.data.token);`,
    filename: 'register.js',
  },
  {
    label: 'Python',
    language: 'python',
    code: `import requests

response = requests.post(
    "https://claudenest.yourdomain.com/api/machines",
    headers={
        "Authorization": "Bearer YOUR_TOKEN",
        "Content-Type": "application/json",
    },
    json={
        "name": "Dev Workstation",
        "platform": "linux",
        "hostname": "dev-ws.local",
        "arch": "x64",
        "node_version": "20.10.0",
        "agent_version": "1.2.3",
        "claude_version": "0.2.0",
        "claude_path": "/usr/local/bin/claude",
        "capabilities": ["docker"],
        "max_sessions": 5,
    },
)

data = response.json()
print("Machine ID:", data["data"]["machine"]["id"])
print("Token:", data["data"]["token"])`,
    filename: 'register.py',
  },
]);

const registerMachineResponse = `{
  "success": true,
  "data": {
    "machine": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Dev Workstation",
      "platform": "linux",
      "hostname": "dev-ws.local",
      "status": "online"
    },
    "token": "cn_mach_a1b2c3d4e5f6g7h8..."
  },
  "meta": {
    "timestamp": "2026-02-17T10:00:00Z",
    "request_id": "req_abc123"
  }
}`;

const listMachinesTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl https://claudenest.yourdomain.com/api/machines \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
    filename: 'Request',
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch('https://claudenest.yourdomain.com/api/machines', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});

const machines = await response.json();
machines.data.forEach(m => {
  console.log(\`\${m.name} (\${m.platform}) - \${m.status}\`);
});`,
    filename: 'list.js',
  },
  {
    label: 'Python',
    language: 'python',
    code: `import requests

response = requests.get(
    "https://claudenest.yourdomain.com/api/machines",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
)

machines = response.json()["data"]
for m in machines:
    print(f"{m['name']} ({m['platform']}) - {m['status']}")`,
    filename: 'list.py',
  },
]);

const listMachinesResponse = `{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Dev Workstation",
      "platform": "linux",
      "hostname": "dev-ws.local",
      "status": "online",
      "is_online": true,
      "active_sessions_count": 0,
      "max_sessions": 5,
      "last_seen_at": "2026-02-17T10:05:00Z",
      "created_at": "2026-02-17T10:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 15,
      "total": 1
    }
  }
}`;

const agentStatusOutput = `ClaudeNest Agent v1.2.3
Status:        connected
Server:        https://claudenest.yourdomain.com
Machine ID:    550e8400-e29b-41d4-a716-446655440000
Machine Name:  Dev Workstation
Platform:      linux (x64)
Claude Code:   v0.2.0 (/usr/local/bin/claude)
Sessions:      0 / 5 active
Uptime:        5m 32s`;
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
