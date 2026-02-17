<template>
  <DocsLayout>
    <div class="docs-page">
      <h1>Machines API</h1>
      
      <p class="lead">
        Manage machines (computers running the ClaudeNest agent) in your account. 
        Machines host sessions and can be controlled remotely including Wake-on-LAN support.
      </p>

      <div class="section">
        <h2>Machine Object</h2>
        <CodeBlock language="json" :code="machineObject" />
      </div>

      <!-- List Machines -->
      <EndpointCard
        method="GET"
        path="/machines"
        description="List all machines associated with the authenticated user."
        :params="listParams"
        :curlExample="listCurl"
        :jsExample="listJs"
        :phpExample="listPhp"
        :responses="listResponses"
      />

      <!-- Create Machine -->
      <EndpointCard
        method="POST"
        path="/machines"
        description="Register a new machine. This is typically called by the agent on first connection."
        :params="createParams"
        :curlExample="createCurl"
        :jsExample="createJs"
        :phpExample="createPhp"
        :responses="createResponses"
      />

      <!-- Get Machine -->
      <EndpointCard
        method="GET"
        path="/machines/{id}"
        description="Get detailed information about a specific machine."
        :params="getParams"
        :curlExample="getCurl"
        :jsExample="getJs"
        :phpExample="getPhp"
        :responses="getResponses"
      />

      <!-- Update Machine -->
      <EndpointCard
        method="PATCH"
        path="/machines/{id}"
        description="Update machine configuration such as name or max sessions."
        :params="updateParams"
        :curlExample="updateCurl"
        :jsExample="updateJs"
        :phpExample="updatePhp"
        :responses="updateResponses"
      />

      <!-- Delete Machine -->
      <EndpointCard
        method="DELETE"
        path="/machines/{id}"
        description="Delete a machine and all associated sessions."
        :params="deleteParams"
        :curlExample="deleteCurl"
        :jsExample="deleteJs"
        :phpExample="deletePhp"
        :responses="deleteResponses"
      />

      <!-- Regenerate Token -->
      <EndpointCard
        method="POST"
        path="/machines/{id}/regenerate-token"
        description="Generate a new authentication token for the machine."
        :params="regenerateParams"
        :curlExample="regenerateCurl"
        :jsExample="regenerateJs"
        :phpExample="regeneratePhp"
        :responses="regenerateResponses"
      />

      <!-- Get Environment -->
      <EndpointCard
        method="GET"
        path="/machines/{id}/environment"
        description="Get the machine's environment information including versions and capabilities."
        :params="environmentParams"
        :curlExample="environmentCurl"
        :jsExample="environmentJs"
        :phpExample="environmentPhp"
        :responses="environmentResponses"
      />

      <!-- Wake-on-LAN -->
      <EndpointCard
        method="POST"
        path="/machines/{id}/wake"
        description="Send a Wake-on-LAN magic packet to wake up an offline machine."
        :params="wakeParams"
        :curlExample="wakeCurl"
        :jsExample="wakeJs"
        :phpExample="wakePhp"
        :responses="wakeResponses"
      />

      <div class="section">
        <h2>Machine Capabilities</h2>
        <p>Capabilities indicate what features a machine supports:</p>
        <ParamTable :params="capabilitiesTable" />
      </div>

      <div class="section">
        <h2>Machine Statuses</h2>
        <p>Possible machine status values:</p>
        <ul>
          <li><code>online</code> - Machine is connected and ready</li>
          <li><code>offline</code> - Machine is disconnected</li>
          <li><code>connecting</code> - Machine is in the process of connecting</li>
          <li><code>error</code> - Machine has reported an error state</li>
          <li><code>maintenance</code> - Machine is in maintenance mode</li>
        </ul>
      </div>

      <div class="section">
        <h2>Wake-on-LAN Requirements</h2>
        <p>
          For Wake-on-LAN to work, the machine must:
        </p>
        <ul>
          <li>Have a network card that supports Wake-on-LAN</li>
          <li>Have WoL enabled in BIOS/UEFI settings</li>
          <li>Have WoL enabled in the operating system</li>
          <li>Have the <code>wake_on_lan</code> capability set</li>
          <li>Be on the same network as another online ClaudeNest agent (for proxy)</li>
        </ul>
      </div>
    </div>
  </DocsLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DocsLayout from '@/layouts/DocsLayout.vue';
import EndpointCard from '@/components/docs/EndpointCard.vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import ParamTable from '@/components/docs/ParamTable.vue';

const machineObject = ref(`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "MacBook Pro",
  "platform": "darwin",
  "hostname": "macbook-pro.local",
  "arch": "arm64",
  "status": "online",
  "is_online": true,
  "node_version": "20.10.0",
  "agent_version": "1.2.3",
  "claude_version": "0.2.0",
  "claude_path": "/usr/local/bin/claude",
  "capabilities": ["wake_on_lan", "gpu_acceleration", "docker"],
  "max_sessions": 5,
  "active_sessions_count": 2,
  "last_seen_at": "2026-02-02T14:30:00Z",
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-02-02T14:30:00Z"
}`);

// List Machines
const listParams = [
  { name: 'per_page', type: 'integer', required: false, description: 'Items per page (default: 15)', default: 15 },
  { name: 'search', type: 'string', required: false, description: 'Search by name or hostname' },
  { name: 'status', type: 'enum', required: false, description: 'Filter by status', enum: ['online', 'offline', 'connecting', 'error', 'maintenance'] },
];

const listCurl = `curl https://api.claudenest.io/api/machines \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -G -d "per_page=20" \\
  -d "search=macbook" \\
  -d "status=online"`;

const listJs = `const response = await fetch('https://api.claudenest.io/api/machines?per_page=20&status=online', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const machines = await response.json();
console.log(machines.data);`;

const listPhp = `<?php
$machines = Http::withToken($token)
    ->get('https://api.claudenest.io/api/machines', [
        'per_page' => 20,
        'status' => 'online',
    ])['data'];`;

const listResponses = {
  '200': {
    success: true,
    data: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'MacBook Pro',
        platform: 'darwin',
        status: 'online',
        is_online: true,
        active_sessions_count: 2,
        max_sessions: 5,
        last_seen_at: '2026-02-02T14:30:00Z',
        created_at: '2026-01-15T10:00:00Z',
      },
    ],
    meta: {
      timestamp: '2026-02-02T15:30:00Z',
      request_id: 'req_abc',
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 1,
      },
    },
  },
};

// Create Machine
const createParams = [
  { name: 'name', type: 'string', required: true, description: 'Machine name' },
  { name: 'platform', type: 'enum', required: true, description: 'Operating system', enum: ['darwin', 'linux', 'win32'] },
  { name: 'hostname', type: 'string', required: false, description: 'System hostname' },
  { name: 'arch', type: 'string', required: false, description: 'CPU architecture (e.g., arm64, x64)' },
  { name: 'node_version', type: 'string', required: false, description: 'Node.js version' },
  { name: 'agent_version', type: 'string', required: false, description: 'ClaudeNest agent version' },
  { name: 'claude_version', type: 'string', required: false, description: 'Claude CLI version' },
  { name: 'claude_path', type: 'string', required: false, description: 'Path to Claude CLI executable' },
  { name: 'capabilities', type: 'array', required: false, description: 'Array of capability strings', default: [] },
  { name: 'max_sessions', type: 'integer', required: false, description: 'Maximum concurrent sessions', default: 10 },
];

const createCurl = `curl -X POST https://api.claudenest.io/api/machines \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "MacBook Pro",
    "platform": "darwin",
    "hostname": "macbook-pro.local",
    "arch": "arm64",
    "node_version": "20.10.0",
    "agent_version": "1.2.3",
    "capabilities": ["wake_on_lan", "docker"],
    "max_sessions": 5
  }'`;

const createJs = `const response = await fetch('https://api.claudenest.io/api/machines', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'MacBook Pro',
    platform: 'darwin',
    hostname: 'macbook-pro.local',
    arch: 'arm64',
    capabilities: ['wake_on_lan', 'docker'],
    max_sessions: 5,
  }),
});

const result = await response.json();
// Save the machine token for the agent
console.log(result.data.token);`;

const createPhp = `<?php
$result = Http::withToken($token)
    ->post('https://api.claudenest.io/api/machines', [
        'name' => 'MacBook Pro',
        'platform' => 'darwin',
        'hostname' => 'macbook-pro.local',
        'arch' => 'arm64',
        'capabilities' => ['wake_on_lan', 'docker'],
        'max_sessions' => 5,
    ])['data'];

$machineToken = $result['token'];`;

const createResponses = {
  '201': {
    success: true,
    data: {
      machine: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'MacBook Pro',
        platform: 'darwin',
        status: 'online',
      },
      token: 'cn_mach_token_abc123...',
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_xyz' },
  },
};

// Get Machine
const getParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Machine ID' },
];

const getCurl = `curl https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000 \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const getJs = `const response = await fetch('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const machine = await response.json();
console.log(machine.data);`;

const getPhp = `<?php
$machine = Http::withToken($token)
    ->get('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000')['data'];`;

const getResponses = {
  '200': {
    success: true,
    data: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'MacBook Pro',
      platform: 'darwin',
      hostname: 'macbook-pro.local',
      arch: 'arm64',
      status: 'online',
      capabilities: ['wake_on_lan', 'gpu_acceleration', 'docker'],
      max_sessions: 5,
      active_sessions_count: 2,
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_123' },
  },
  '404': {
    success: false,
    error: { code: 'MCH_001', message: 'Machine not found' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_456' },
  },
};

// Update Machine
const updateParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Machine ID' },
  { name: 'name', type: 'string', required: false, description: 'New machine name' },
  { name: 'max_sessions', type: 'integer', required: false, description: 'New max sessions limit' },
];

const updateCurl = `curl -X PATCH https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000 \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "MacBook Pro (Work)", "max_sessions": 10}'`;

const updateJs = `await fetch('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'MacBook Pro (Work)', max_sessions: 10 }),
});`;

const updatePhp = `<?php
Http::withToken($token)
    ->patch('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000', [
        'name' => 'MacBook Pro (Work)',
        'max_sessions' => 10,
    ]);`;

const updateResponses = {
  '200': {
    success: true,
    data: { id: '...', name: 'MacBook Pro (Work)', max_sessions: 10 },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_789' },
  },
};

// Delete Machine
const deleteParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Machine ID' },
];

const deleteCurl = `curl -X DELETE https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000 \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const deleteJs = `await fetch('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000', {
  method: 'DELETE',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});`;

const deletePhp = `<?php
Http::withToken($token)
    ->delete('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000');`;

const deleteResponses = {
  '200': {
    success: true,
    data: null,
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_012' },
  },
};

// Regenerate Token
const regenerateParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Machine ID' },
];

const regenerateCurl = `curl -X POST https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/regenerate-token \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const regenerateJs = `const response = await fetch('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/regenerate-token', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const result = await response.json();
console.log(result.data.token); // New machine token`;

const regeneratePhp = `<?php
$newToken = Http::withToken($token)
    ->post('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/regenerate-token')['data']['token'];`;

const regenerateResponses = {
  '200': {
    success: true,
    data: { token: 'cn_mach_newtoken456...' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_345' },
  },
};

// Environment
const environmentParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Machine ID' },
];

const environmentCurl = `curl https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/environment \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const environmentJs = `const response = await fetch('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/environment', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const env = await response.json();
console.log(env.data);`;

const environmentPhp = `<?php
$env = Http::withToken($token)
    ->get('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/environment')['data'];`;

const environmentResponses = {
  '200': {
    success: true,
    data: {
      platform: 'darwin',
      hostname: 'macbook-pro.local',
      arch: 'arm64',
      node_version: '20.10.0',
      agent_version: '1.2.3',
      claude_version: '0.2.0',
      claude_path: '/usr/local/bin/claude',
      capabilities: ['wake_on_lan', 'gpu_acceleration', 'docker'],
      max_sessions: 5,
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_678' },
  },
  '400': {
    success: false,
    error: { code: 'MCH_002', message: 'Machine is offline' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_901' },
  },
};

// Wake
const wakeParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Machine ID' },
];

const wakeCurl = `curl -X POST https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/wake \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const wakeJs = `const response = await fetch('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/wake', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const result = await response.json();
console.log(result.data.message);`;

const wakePhp = `<?php
$result = Http::withToken($token)
    ->post('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/wake')['data'];`;

const wakeResponses = {
  '200': {
    success: true,
    data: {
      message: 'Wake-on-LAN signal sent',
      machine: { id: '...', name: 'MacBook Pro', status: 'connecting' },
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_234' },
  },
  '400': {
    success: false,
    error: { code: 'MCH_003', message: 'Machine does not support Wake-on-LAN' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_567' },
  },
};

// Capabilities table
const capabilitiesTable = [
  { name: 'wake_on_lan', type: 'string', required: false, description: 'Supports Wake-on-LAN functionality' },
  { name: 'gpu_acceleration', type: 'string', required: false, description: 'Has GPU available for acceleration' },
  { name: 'docker', type: 'string', required: false, description: 'Docker is installed and available' },
  { name: 'kubernetes', type: 'string', required: false, description: 'Kubernetes cluster access available' },
  { name: 'remote_desktop', type: 'string', required: false, description: 'Supports remote desktop connections' },
  { name: 'file_sync', type: 'string', required: false, description: 'Supports real-time file synchronization' },
];
</script>

<style scoped>
.docs-page {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-cyan, #22d3ee));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.section {
  margin-bottom: 2.5rem;
}

h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color, var(--border));
}

p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1rem;
}

ul {
  color: var(--text-secondary);
  line-height: 1.8;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

li {
  margin-bottom: 0.5rem;
}

:deep(code) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  color: var(--accent-purple-light, #c084fc);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

@media (max-width: 640px) {
  h1 {
    font-size: 1.75rem;
  }
}
</style>
