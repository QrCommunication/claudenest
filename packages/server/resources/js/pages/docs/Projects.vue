<template>
  <DocsLayout>
    <div class="docs-page">
      <h1>{{ $t('docDocsProjects.title') }}</h1>

      <p class="lead">
        {{ $t('docDocsProjects.lead') }}
      </p>

      <div class="section">
        <h2>{{ $t('docDocsProjects.projectObjectHeading') }}</h2>
        <CodeBlock language="json" :code="projectObject" />
      </div>

      <!-- List Projects -->
      <EndpointCard
        method="GET"
        path="/machines/{machine}/projects"
        :description="$t('docDocsProjects.listDescription')"
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
        :description="$t('docDocsProjects.createDescription')"
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
        :description="$t('docDocsProjects.getDescription')"
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
        :description="$t('docDocsProjects.updateDescription')"
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
        :description="$t('docDocsProjects.deleteDescription')"
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
        :description="$t('docDocsProjects.statsDescription')"
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
        :description="$t('docDocsProjects.instancesDescription')"
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
        :description="$t('docDocsProjects.activityDescription')"
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
        :description="$t('docDocsProjects.broadcastDescription')"
        :params="broadcastParams"
        :curlExample="broadcastCurl"
        :jsExample="broadcastJs"
        :phpExample="broadcastPhp"
        :responses="broadcastResponses"
      />

      <div class="section">
        <h2>{{ $t('docDocsProjects.contextHeading') }}</h2>
        <p>
          {{ $t('docDocsProjects.contextIntro') }}
        </p>
        <ul>
          <li><strong>{{ $t('docDocsProjects.contextSummaryLabel') }}</strong> {{ $t('docDocsProjects.contextSummaryText') }}</li>
          <li><strong>{{ $t('docDocsProjects.contextArchitectureLabel') }}</strong> {{ $t('docDocsProjects.contextArchitectureText') }}</li>
          <li><strong>{{ $t('docDocsProjects.contextConventionsLabel') }}</strong> {{ $t('docDocsProjects.contextConventionsText') }}</li>
          <li><strong>{{ $t('docDocsProjects.contextCurrentFocusLabel') }}</strong> {{ $t('docDocsProjects.contextCurrentFocusText') }}</li>
          <li><strong>{{ $t('docDocsProjects.contextRecentChangesLabel') }}</strong> {{ $t('docDocsProjects.contextRecentChangesText') }}</li>
        </ul>
        <p>
          {{ $t('docDocsProjects.contextUpdatePre') }}<router-link to="/docs/projects">{{ $t('docDocsProjects.contextApiLink') }}</router-link>{{ $t('docDocsProjects.contextUpdatePost') }}
        </p>
      </div>

      <div class="section">
        <h2>{{ $t('docDocsProjects.tokenManagementHeading') }}</h2>
        <p>
          {{ $t('docDocsProjects.tokenManagementIntro') }}
        </p>
        <ul>
          <li><code>total_tokens</code> - {{ $t('docDocsProjects.tokenTotalText') }}</li>
          <li><code>max_tokens</code> - {{ $t('docDocsProjects.tokenMaxText') }}</li>
          <li><code>token_usage_percent</code> - {{ $t('docDocsProjects.tokenPercentText') }}</li>
          <li><code>is_token_limit_reached</code> - {{ $t('docDocsProjects.tokenLimitReachedText') }}</li>
        </ul>
      </div>

      <div class="section">
        <h2>{{ $t('docDocsProjects.coordinationHeading') }}</h2>
        <p>
          {{ $t('docDocsProjects.coordinationIntro') }}
        </p>
        <ul>
          <li><strong>{{ $t('docDocsProjects.coordinationTasksLabel') }}</strong> {{ $t('docDocsProjects.coordinationTasksText') }}</li>
          <li><strong>{{ $t('docDocsProjects.coordinationLocksLabel') }}</strong> {{ $t('docDocsProjects.coordinationLocksText') }}</li>
          <li><strong>{{ $t('docDocsProjects.coordinationBroadcastLabel') }}</strong> {{ $t('docDocsProjects.coordinationBroadcastText') }}</li>
          <li><strong>{{ $t('docDocsProjects.coordinationActivityLabel') }}</strong> {{ $t('docDocsProjects.coordinationActivityText') }}</li>
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

const listResponses = [
  {
    status: 200,
    body: JSON.stringify({
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
    }, null, 2),
  },
];

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

const createResponses = [
  {
    status: 201,
    body: JSON.stringify({
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
    }, null, 2),
  },
  {
    status: 422,
    description: 'Validation error',
    body: JSON.stringify({
      success: false,
      error: { code: 'VAL_001', message: 'Project already exists for this path' },
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_err' },
    }, null, 2),
  },
];

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

const getResponses = [
  {
    status: 200,
    body: JSON.stringify({
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
    }, null, 2),
  },
  {
    status: 404,
    description: 'Project not found',
    body: JSON.stringify({
      success: false,
      error: { code: 'CTX_001', message: 'Project not found' },
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_456' },
    }, null, 2),
  },
];

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

const updateResponses = [
  {
    status: 200,
    body: JSON.stringify({
      success: true,
      data: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'E-commerce Platform v2',
        current_focus: 'Implementing checkout flow',
        recent_changes: 'Updated product catalog API',
        max_tokens: 150000,
      },
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_789' },
    }, null, 2),
  },
];

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

const deleteResponses = [
  {
    status: 200,
    body: JSON.stringify({
      success: true,
      data: null,
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_012' },
    }, null, 2),
  },
];

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

const statsResponses = [
  {
    status: 200,
    body: JSON.stringify({
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
    }, null, 2),
  },
];

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

const instancesResponses = [
  {
    status: 200,
    body: JSON.stringify({
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
    }, null, 2),
  },
];

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

const activityResponses = [
  {
    status: 200,
    body: JSON.stringify({
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
    }, null, 2),
  },
];

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

const broadcastResponses = [
  {
    status: 200,
    body: JSON.stringify({
      success: true,
      data: {
        message_id: 'msg_abc123',
        broadcasted_at: '2026-02-02T15:30:00Z',
      },
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_bc' },
    }, null, 2),
  },
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

a {
  color: var(--accent-purple-light, #c084fc);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
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
