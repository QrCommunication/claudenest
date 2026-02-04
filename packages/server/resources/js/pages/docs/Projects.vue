<template>
  <DocsLayout>
    <div class="docs-page">
      <h1>Projects API</h1>
      
      <p class="lead">
        Multi-agent projects enable collaborative AI development across multiple Claude instances. 
        Projects maintain shared context, tasks, and file locks to coordinate work.
      </p>

      <div class="section">
        <h2>Project Object</h2>
        <CodeBlock language="json" :code="projectObject" />
      </div>

      <!-- List Projects -->
      <EndpointCard
        method="GET"
        path="/machines/{machine}/projects"
        description="List all projects for a specific machine."
        :params="listParams"
        :curlExample="listCurl"
        :jsExample="listJs"
        :phpExample="listPhp"
        :responses="listResponses"
      />

      <!-- Create Project -->
      <EndpointCard
        method="POST"
        path="/machines/{machine}/projects"
        description="Create a new shared project on the specified machine."
        :params="createParams"
        :curlExample="createCurl"
        :jsExample="createJs"
        :phpExample="createPhp"
        :responses="createResponses"
      />

      <!-- Get Project -->
      <EndpointCard
        method="GET"
        path="/projects/{id}"
        description="Get detailed information about a specific project."
        :params="getParams"
        :curlExample="getCurl"
        :jsExample="getJs"
        :phpExample="getPhp"
        :responses="getResponses"
      />

      <!-- Update Project -->
      <EndpointCard
        method="PATCH"
        path="/projects/{id}"
        description="Update project configuration and context."
        :params="updateParams"
        :curlExample="updateCurl"
        :jsExample="updateJs"
        :phpExample="updatePhp"
        :responses="updateResponses"
      />

      <!-- Delete Project -->
      <EndpointCard
        method="DELETE"
        path="/projects/{id}"
        description="Delete a project and all associated data."
        :params="deleteParams"
        :curlExample="deleteCurl"
        :jsExample="deleteJs"
        :phpExample="deletePhp"
        :responses="deleteResponses"
      />

      <!-- Get Stats -->
      <EndpointCard
        method="GET"
        path="/projects/{id}/stats"
        description="Get project statistics including tasks, instances, and token usage."
        :params="statsParams"
        :curlExample="statsCurl"
        :jsExample="statsJs"
        :phpExample="statsPhp"
        :responses="statsResponses"
      />

      <!-- Get Instances -->
      <EndpointCard
        method="GET"
        path="/projects/{id}/instances"
        description="Get all active Claude instances connected to this project."
        :params="instancesParams"
        :curlExample="instancesCurl"
        :jsExample="instancesJs"
        :phpExample="instancesPhp"
        :responses="instancesResponses"
      />

      <!-- Get Activity -->
      <EndpointCard
        method="GET"
        path="/projects/{id}/activity"
        description="Get recent activity logs for the project."
        :params="activityParams"
        :curlExample="activityCurl"
        :jsExample="activityJs"
        :phpExample="activityPhp"
        :responses="activityResponses"
      />

      <!-- Broadcast -->
      <EndpointCard
        method="POST"
        path="/projects/{id}/broadcast"
        description="Broadcast a message to all instances in the project."
        :params="broadcastParams"
        :curlExample="broadcastCurl"
        :jsExample="broadcastJs"
        :phpExample="broadcastPhp"
        :responses="broadcastResponses"
      />

      <div class="section">
        <h2>Project Context</h2>
        <p>
          Projects maintain shared context that all connected instances can access:
        </p>
        <ul>
          <li><strong>Summary:</strong> High-level project overview</li>
          <li><strong>Architecture:</strong> System design and patterns</li>
          <li><strong>Conventions:</strong> Coding standards and guidelines</li>
          <li><strong>Current Focus:</strong> Active development area</li>
          <li><strong>Recent Changes:</strong> Latest modifications</li>
        </ul>
        <p>
          Update context via the PATCH endpoint or use the <router-link to="/docs/projects">Context API</router-link> 
          for RAG-powered queries.
        </p>
      </div>

      <div class="section">
        <h2>Token Management</h2>
        <p>
          Projects track token usage to prevent context overflow:
        </p>
        <ul>
          <li><code>total_tokens</code> - Current tokens used in project context</li>
          <li><code>max_tokens</code> - Maximum allowed tokens</li>
          <li><code>token_usage_percent</code> - Percentage of limit used</li>
          <li><code>is_token_limit_reached</code> - Whether limit is exceeded</li>
        </ul>
      </div>

      <div class="section">
        <h2>Multi-Agent Coordination</h2>
        <p>
          Projects enable multiple Claude instances to work together through:
        </p>
        <ul>
          <li><strong>Shared Tasks:</strong> Distribute work via the Tasks API</li>
          <li><strong>File Locks:</strong> Prevent conflicts using the File Locks API</li>
          <li><strong>Broadcast Messages:</strong> Send notifications to all instances</li>
          <li><strong>Activity Log:</strong> Track all project activity</li>
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

const projectObject = ref(`{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "machine_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "E-commerce Platform",
  "project_path": "/Users/dev/projects/ecommerce",
  "summary": "Modern e-commerce platform with React frontend and Node.js backend",
  "architecture": "Microservices architecture with API Gateway...",
  "conventions": "Use TypeScript, follow ESLint rules, write tests...",
  "current_focus": "Implementing payment gateway integration",
  "recent_changes": "Added user authentication module",
  "total_tokens": 45000,
  "max_tokens": 100000,
  "token_usage_percent": 45,
  "is_token_limit_reached": false,
  "active_instances_count": 3,
  "pending_tasks_count": 5,
  "settings": {
    "autoSummarize": true,
    "contextRetentionDays": 30
  },
  "created_at": "2026-02-01T10:00:00Z",
  "updated_at": "2026-02-02T15:30:00Z"
}`);

// List Projects
const listParams = [
  { name: 'machine', type: 'uuid', required: true, description: 'Machine ID' },
];

const listCurl = `curl https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/projects \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const listJs = `const response = await fetch('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/projects', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const projects = await response.json();
console.log(projects.data);`;

const listPhp = `<?php
$projects = Http::withToken($token)
    ->get('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/projects')['data'];`;

const listResponses = {
  '200': {
    success: true,
    data: [
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        machine_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'E-commerce Platform',
        project_path: '/Users/dev/projects/ecommerce',
        summary: 'Modern e-commerce platform...',
        token_usage_percent: 45,
        active_instances_count: 3,
        pending_tasks_count: 5,
        created_at: '2026-02-01T10:00:00Z',
      },
    ],
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_abc' },
  },
};

// Create Project
const createParams = [
  { name: 'machine', type: 'uuid', required: true, description: 'Machine ID' },
  { name: 'name', type: 'string', required: true, description: 'Project name' },
  { name: 'project_path', type: 'string', required: true, description: 'Absolute path to project directory' },
  { name: 'summary', type: 'string', required: false, description: 'Project summary/description' },
  { name: 'architecture', type: 'string', required: false, description: 'System architecture notes' },
  { name: 'conventions', type: 'string', required: false, description: 'Coding conventions' },
  { name: 'settings', type: 'object', required: false, description: 'Project settings object' },
];

const createCurl = `curl -X POST https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/projects \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "E-commerce Platform",
    "project_path": "/Users/dev/projects/ecommerce",
    "summary": "Modern e-commerce platform with React frontend",
    "architecture": "Microservices with API Gateway",
    "conventions": "TypeScript, ESLint, Jest testing",
    "settings": { "autoSummarize": true }
  }'`;

const createJs = `const response = await fetch('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/projects', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'E-commerce Platform',
    project_path: '/Users/dev/projects/ecommerce',
    summary: 'Modern e-commerce platform with React frontend',
    architecture: 'Microservices with API Gateway',
  }),
});
const project = await response.json();
console.log(project.data);`;

const createPhp = `<?php
$project = Http::withToken($token)
    ->post('https://api.claudenest.io/api/machines/550e8400-e29b-41d4-a716-446655440000/projects', [
        'name' => 'E-commerce Platform',
        'project_path' => '/Users/dev/projects/ecommerce',
        'summary' => 'Modern e-commerce platform...',
    ])['data'];`;

const createResponses = {
  '201': {
    success: true,
    data: {
      id: '550e8400-e29b-41d4-a716-446655440002',
      machine_id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'E-commerce Platform',
      project_path: '/Users/dev/projects/ecommerce',
      summary: 'Modern e-commerce platform with React frontend',
      total_tokens: 0,
      max_tokens: 100000,
      token_usage_percent: 0,
      created_at: '2026-02-02T15:30:00Z',
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_xyz' },
  },
  '422': {
    success: false,
    error: { code: 'VAL_001', message: 'Project already exists for this path' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_err' },
  },
};

// Get Project
const getParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Project ID' },
];

const getCurl = `curl https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002 \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const getJs = `const response = await fetch('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const project = await response.json();
console.log(project.data);`;

const getPhp = `<?php
$project = Http::withToken($token)
    ->get('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002')['data'];`;

const getResponses = {
  '200': {
    success: true,
    data: {
      id: '550e8400-e29b-41d4-a716-446655440002',
      machine_id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'E-commerce Platform',
      project_path: '/Users/dev/projects/ecommerce',
      summary: 'Modern e-commerce platform...',
      architecture: 'Microservices with API Gateway...',
      conventions: 'TypeScript, ESLint, Jest...',
      current_focus: 'Implementing payment gateway...',
      recent_changes: 'Added user authentication...',
      total_tokens: 45000,
      max_tokens: 100000,
      settings: { autoSummarize: true, contextRetentionDays: 30 },
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_123' },
  },
  '404': {
    success: false,
    error: { code: 'CTX_001', message: 'Project not found' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_456' },
  },
};

// Update Project
const updateParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Project ID' },
  { name: 'name', type: 'string', required: false, description: 'New project name' },
  { name: 'summary', type: 'string', required: false, description: 'Updated summary' },
  { name: 'architecture', type: 'string', required: false, description: 'Updated architecture notes' },
  { name: 'conventions', type: 'string', required: false, description: 'Updated conventions' },
  { name: 'current_focus', type: 'string', required: false, description: 'Current development focus' },
  { name: 'recent_changes', type: 'string', required: false, description: 'Recent changes summary' },
  { name: 'max_tokens', type: 'integer', required: false, description: 'New token limit (1000-128000)' },
  { name: 'settings', type: 'object', required: false, description: 'Settings to update' },
];

const updateCurl = `curl -X PATCH https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002 \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "E-commerce Platform v2",
    "current_focus": "Implementing checkout flow",
    "recent_changes": "Updated product catalog API",
    "max_tokens": 150000
  }'`;

const updateJs = `await fetch('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'E-commerce Platform v2',
    current_focus: 'Implementing checkout flow',
    recent_changes: 'Updated product catalog API',
  }),
});`;

const updatePhp = `<?php
Http::withToken($token)
    ->patch('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002', [
        'name' => 'E-commerce Platform v2',
        'current_focus' => 'Implementing checkout flow',
    ]);`;

const updateResponses = {
  '200': {
    success: true,
    data: {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'E-commerce Platform v2',
      current_focus: 'Implementing checkout flow',
      recent_changes: 'Updated product catalog API',
      max_tokens: 150000,
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_789' },
  },
};

// Delete Project
const deleteParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Project ID' },
];

const deleteCurl = `curl -X DELETE https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002 \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const deleteJs = `await fetch('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002', {
  method: 'DELETE',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});`;

const deletePhp = `<?php
Http::withToken($token)
    ->delete('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002');`;

const deleteResponses = {
  '200': {
    success: true,
    data: null,
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_012' },
  },
};

// Get Stats
const statsParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Project ID' },
];

const statsCurl = `curl https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/stats \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const statsJs = `const response = await fetch('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/stats', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const stats = await response.json();
console.log(stats.data);`;

const statsPhp = `<?php
$stats = Http::withToken($token)
    ->get('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/stats')['data'];`;

const statsResponses = {
  '200': {
    success: true,
    data: {
      total_tasks: 25,
      pending_tasks: 5,
      completed_tasks: 18,
      active_instances: 3,
      context_chunks: 42,
      active_locks: 2,
      token_usage: {
        current: 45000,
        max: 100000,
        percent: 45,
      },
      activity_last_24h: 15,
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_345' },
  },
};

// Get Instances
const instancesParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Project ID' },
];

const instancesCurl = `curl https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/instances \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const instancesJs = `const response = await fetch('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/instances', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const instances = await response.json();
console.log(instances.data);`;

const instancesPhp = `<?php
$instances = Http::withToken($token)
    ->get('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/instances')['data'];`;

const instancesResponses = {
  '200': {
    success: true,
    data: [
      {
        id: 'inst-001',
        status: 'active',
        is_connected: true,
        is_available: true,
        context_tokens: 12000,
        context_usage_percent: 25,
        max_context_tokens: 100000,
        tasks_completed: 8,
        current_task: { id: 'task-1', title: 'Implement payment API' },
        uptime: 3600,
        connected_at: '2026-02-02T14:30:00Z',
        last_activity_at: '2026-02-02T15:25:00Z',
      },
    ],
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_678' },
  },
};

// Get Activity
const activityParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Project ID' },
  { name: 'limit', type: 'integer', required: false, description: 'Number of activities to return', default: 50 },
  { name: 'since', type: 'string', required: false, description: 'ISO timestamp to fetch activities since' },
];

const activityCurl = `curl https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/activity?limit=10 \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const activityJs = `const response = await fetch('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/activity?limit=10', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const activity = await response.json();
console.log(activity.data);`;

const activityPhp = `<?php
$activity = Http::withToken($token)
    ->get('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/activity', [
        'limit' => 10,
    ])['data'];`;

const activityResponses = {
  '200': {
    success: true,
    data: [
      {
        id: 'act-1',
        type: 'task_completed',
        message: 'Task "Setup database" completed by Instance-1',
        icon: 'check',
        color: 'green',
        instance_id: 'inst-001',
        details: { task_id: 'task-1' },
        created_at: '2026-02-02T15:20:00Z',
      },
    ],
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_act' },
  },
};

// Broadcast
const broadcastParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Project ID' },
  { name: 'message', type: 'string', required: true, description: 'Message to broadcast' },
  { name: 'type', type: 'enum', required: false, description: 'Message type', enum: ['info', 'warning', 'error', 'success'], default: 'info' },
  { name: 'target_instances', type: 'array', required: false, description: 'Specific instance IDs to target (omit for all)' },
];

const broadcastCurl = `curl -X POST https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/broadcast \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "New API specification is ready for review",
    "type": "info"
  }'`;

const broadcastJs = `await fetch('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/broadcast', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'New API specification is ready for review',
    type: 'info',
  }),
});`;

const broadcastPhp = `<?php
Http::withToken($token)
    ->post('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/broadcast', [
        'message' => 'New API specification is ready for review',
        'type' => 'info',
    ]);`;

const broadcastResponses = {
  '200': {
    success: true,
    data: {
      message_id: 'msg_abc123',
      broadcasted_at: '2026-02-02T15:30:00Z',
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_bc' },
  },
};
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
  background: linear-gradient(135deg, #a855f7, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 1.1rem;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.section {
  margin-bottom: 2.5rem;
}

h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

p {
  color: #94a3b8;
  line-height: 1.7;
  margin-bottom: 1rem;
}

ul {
  color: #94a3b8;
  line-height: 1.8;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

li {
  margin-bottom: 0.5rem;
}

a {
  color: #c084fc;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

:deep(code) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  color: #c084fc;
  background: rgba(168, 85, 247, 0.1);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

@media (max-width: 640px) {
  h1 {
    font-size: 1.75rem;
  }
}
</style>
