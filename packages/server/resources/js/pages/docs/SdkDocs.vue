<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ sdkTitle }}</h1>
      <p class="lead">{{ sdkDescription }}</p>
    </header>

    <nav class="sdk-nav">
      <router-link
        v-for="sdk in sdks"
        :key="sdk.id"
        :to="`/docs/sdks/${sdk.id}`"
        class="sdk-link"
        :class="{ 'is-active': currentSdk === sdk.id }"
      >
        {{ sdk.name }}
      </router-link>
    </nav>

    <section id="installation">
      <h2>Installation</h2>
      <CodeBlock :code="installCode" :language="installLang" />
    </section>

    <section id="configuration">
      <h2>Configuration</h2>
      <p>Initialize the client with your server URL and API token:</p>
      <CodeBlock :code="configCode" :language="currentSdk" />
    </section>

    <section id="machines">
      <h2>Machines</h2>
      <p>Manage your registered machines:</p>
      <CodeBlock :code="machinesCode" :language="currentSdk" />
    </section>

    <section id="sessions">
      <h2>Sessions</h2>
      <p>Create and manage Claude Code sessions:</p>
      <CodeBlock :code="sessionsCode" :language="currentSdk" />
    </section>

    <section id="examples">
      <h2>Complete Example</h2>
      <p>A complete example showing common operations:</p>
      <CodeBlock :code="fullExample" :language="currentSdk" :filename="`example.${fileExtension}`" />
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import CodeBlock from '@/components/docs/CodeBlock.vue';

const route = useRoute();

const sdks = [
  { id: 'javascript', name: 'JavaScript', ext: 'js' },
  { id: 'cli', name: 'CLI', ext: 'sh' },
  { id: 'php', name: 'PHP', ext: 'php' },
  { id: 'python', name: 'Python', ext: 'py' },
];

const currentSdk = computed(() => (route.params.sdk as string) || 'javascript');
const sdkInfo = computed(() => sdks.find(s => s.id === currentSdk.value) || sdks[0]);
const fileExtension = computed(() => sdkInfo.value.ext);

const sdkTitle = computed(() => {
  const titles: Record<string, string> = {
    javascript: 'JavaScript SDK',
    cli: 'CLI Reference',
    php: 'PHP SDK',
    python: 'Python SDK'
  };
  return titles[currentSdk.value] || 'SDK Documentation';
});

const sdkDescription = computed(() => {
  const descs: Record<string, string> = {
    javascript: 'Official JavaScript/TypeScript SDK for Node.js and browsers.',
    cli: 'Command-line interface for managing ClaudeNest from the terminal.',
    php: 'PHP client library for Laravel and other PHP applications.',
    python: 'Python SDK for scripts and automation.'
  };
  return descs[currentSdk.value] || '';
});

const installLang = computed(() => currentSdk.value === 'cli' ? 'bash' : 'bash');

const installCode = computed(() => {
  const codes: Record<string, string> = {
    javascript: 'npm install @claudenest/sdk\n# or\nyarn add @claudenest/sdk',
    cli: 'npm install -g @claudenest/agent\n# or\ncurl -fsSL https://claudenest.io/install-agent.sh | bash',
    php: 'composer require claudenest/sdk',
    python: 'pip install claudenest-sdk'
  };
  return codes[currentSdk.value] || '';
});

const configCode = computed(() => {
  const codes: Record<string, string> = {
    javascript: `import { ClaudeNestClient } from '@claudenest/sdk';\n\nconst client = new ClaudeNestClient({\n  baseUrl: 'https://claudenest.yourdomain.com',\n  token: 'your-api-token'\n});`,
    cli: `# Configure the CLI\nclaudenest config set server https://claudenest.yourdomain.com\nclaudenest config set token your-api-token`,
    php: `use ClaudeNest\\Sdk\\Client;\n\n$client = new Client([\n    'baseUrl' => 'https://claudenest.yourdomain.com',\n    'token' => 'your-api-token'\n]);`,
    python: `from claudenest import Client\n\nclient = Client(\n    base_url='https://claudenest.yourdomain.com',\n    token='your-api-token'\n)`
  };
  return codes[currentSdk.value] || '';
});

const machinesCode = computed(() => {
  const codes: Record<string, string> = {
    javascript: `// List all machines\nconst machines = await client.machines.list();\nconsole.log(machines);\n\n// Get a specific machine\nconst machine = await client.machines.get('machine-id');\n\n// Register a new machine\nconst newMachine = await client.machines.create({\n  name: 'MacBook-Pro',\n  platform: 'darwin',\n  capabilities: ['claude_code', 'git']\n});`,
    cli: `# List all machines\nclaudenest machines list\n\n# Get a specific machine\nclaudenest machines get machine-id\n\n# Register a new machine\nclaudenest machines create --name "MacBook-Pro" --platform darwin`,
    php: `// List all machines\n$machines = $client->machines->list();\n\n// Get a specific machine\n$machine = $client->machines->get('machine-id');\n\n// Register a new machine\n$newMachine = $client->machines->create([\n    'name' => 'MacBook-Pro',\n    'platform' => 'darwin'\n]);`,
    python: `# List all machines\nmachines = client.machines.list()\n\n# Get a specific machine\nmachine = client.machines.get('machine-id')\n\n# Register a new machine\nnew_machine = client.machines.create(\n    name='MacBook-Pro',\n    platform='darwin'\n)`
  };
  return codes[currentSdk.value] || '';
});

const sessionsCode = computed(() => {
  const codes: Record<string, string> = {
    javascript: `// Create a new session\nconst session = await client.sessions.create('machine-id', {\n  mode: 'interactive',\n  projectPath: '/home/user/project',\n  initialPrompt: 'Help me refactor this code'\n});\n\n// Attach to session\nconst ws = await client.sessions.attach(session.id);\nws.onOutput((data) => console.log(data));\n\n// Terminate session\nawait client.sessions.terminate(session.id);`,
    cli: `# Create a new session\nclaudenest sessions create machine-id \\\n  --mode interactive \\\n  --project-path /home/user/project\n\n# Attach to session\nclaudenest sessions attach session-id\n\n# Terminate session\nclaudenest sessions terminate session-id`,
    php: `// Create a new session\n$session = $client->sessions->create('machine-id', [\n    'mode' => 'interactive',\n    'project_path' => '/home/user/project'\n]);\n\n// Terminate session\n$client->sessions->terminate($session->id);`,
    python: `# Create a new session\nsession = client.sessions.create(\n    'machine-id',\n    mode='interactive',\n    project_path='/home/user/project'\n)\n\n# Terminate session\nclient.sessions.terminate(session.id)`
  };
  return codes[currentSdk.value] || '';
});

const fullExample = computed(() => {
  const codes: Record<string, string> = {
    javascript: `import { ClaudeNestClient } from '@claudenest/sdk';\n\nasync function main() {\n  const client = new ClaudeNestClient({\n    baseUrl: 'https://claudenest.yourdomain.com',\n    token: process.env.CLAUDENEST_TOKEN\n  });\n\n  // Get machines\n  const machines = await client.machines.list();\n  const machine = machines.data[0];\n  \n  // Create a session\n  const session = await client.sessions.create(machine.id, {\n    mode: 'interactive',\n    projectPath: '/home/user/project'\n  });\n\n  console.log('Session created:', session.id);\n}\n\nmain().catch(console.error);`,
    cli: `#!/bin/bash\n\n# Set configuration\nexport CLAUDENEST_SERVER=https://claudenest.yourdomain.com\nexport CLAUDENEST_TOKEN=your-token\n\n# Get first machine\nMACHINE_ID=$(claudenest machines list --format json | jq -r '.data[0].id')\n\n# Create session\nSESSION_ID=$(claudenest sessions create $MACHINE_ID \\\n  --mode interactive \\\n  --project-path /home/user/project \\\n  --format json | jq -r '.data.id')\n\n# Attach to session\nclaudenest sessions attach $SESSION_ID`,
    php: `<?php\nrequire 'vendor/autoload.php';\nuse ClaudeNest\\Sdk\\Client;\n\n$client = new Client([\n    'baseUrl' => getenv('CLAUDENEST_URL'),\n    'token' => getenv('CLAUDENEST_TOKEN')\n]);\n\n$machines = $client->machines->list();\n$machine = $machines->data[0];\n\n$session = $client->sessions->create($machine->id, [\n    'mode' => 'interactive',\n    'project_path' => '/home/user/project'\n]);\n\necho "Session created: {$session->id}\\n";`,
    python: `import os\nfrom claudenest import Client\n\nclient = Client(\n    base_url=os.environ['CLAUDENEST_URL'],\n    token=os.environ['CLAUDENEST_TOKEN']\n)\n\nmachines = client.machines.list()\nmachine = machines['data'][0]\n\nsession = client.sessions.create(\n    machine['id'],\n    mode='interactive',\n    project_path='/home/user/project'\n)\n\nprint(f'Session created: {session["id"]}')`
  };
  return codes[currentSdk.value] || '';
});
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

p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 1rem;
}

.sdk-nav {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
  overflow-x: auto;
}

.sdk-link {
  padding: 0.5rem 1rem;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.15s;
  white-space: nowrap;
}

.sdk-link:hover {
  background: color-mix(in srgb, var(--text-primary) 5%, transparent);
  color: var(--text-primary);
}

.sdk-link.is-active {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  color: var(--accent-purple, #a855f7);
  font-weight: 500;
}

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }
}
</style>
