<template>
  <DocsLayout>
    <div class="docs-page">
      <h1>Tasks API</h1>
      
      <p class="lead">
        Tasks enable work distribution across multiple Claude instances in a project. 
        Tasks can be claimed, completed, and tracked through their entire lifecycle.
      </p>

      <div class="section">
        <h2>Task Object</h2>
        <CodeBlock language="json" :code="taskObject" />
      </div>

      <!-- List Tasks -->
      <EndpointCard
        method="GET"
        path="/projects/{project}/tasks"
        description="List all tasks in a project with optional filtering."
        :params="listParams"
        :curlExample="listCurl"
        :jsExample="listJs"
        :phpExample="listPhp"
        :responses="listResponses"
      />

      <!-- Create Task -->
      <EndpointCard
        method="POST"
        path="/projects/{project}/tasks"
        description="Create a new task in the project."
        :params="createParams"
        :curlExample="createCurl"
        :jsExample="createJs"
        :phpExample="createPhp"
        :responses="createResponses"
      />

      <!-- Get Task -->
      <EndpointCard
        method="GET"
        path="/tasks/{id}"
        description="Get detailed information about a specific task."
        :params="getParams"
        :curlExample="getCurl"
        :jsExample="getJs"
        :phpExample="getPhp"
        :responses="getResponses"
      />

      <!-- Update Task -->
      <EndpointCard
        method="PATCH"
        path="/tasks/{id}"
        description="Update task details."
        :params="updateParams"
        :curlExample="updateCurl"
        :jsExample="updateJs"
        :phpExample="updatePhp"
        :responses="updateResponses"
      />

      <!-- Delete Task -->
      <EndpointCard
        method="DELETE"
        path="/tasks/{id}"
        description="Delete a task."
        :params="deleteParams"
        :curlExample="deleteCurl"
        :jsExample="deleteJs"
        :phpExample="deletePhp"
        :responses="deleteResponses"
      />

      <!-- Claim Task -->
      <EndpointCard
        method="POST"
        path="/tasks/{id}/claim"
        description="Claim a task for an instance to work on."
        :params="claimParams"
        :curlExample="claimCurl"
        :jsExample="claimJs"
        :phpExample="claimPhp"
        :responses="claimResponses"
      />

      <!-- Release Task -->
      <EndpointCard
        method="POST"
        path="/tasks/{id}/release"
        description="Release a claimed task back to pending status."
        :params="releaseParams"
        :curlExample="releaseCurl"
        :jsExample="releaseJs"
        :phpExample="releasePhp"
        :responses="releaseResponses"
      />

      <!-- Complete Task -->
      <EndpointCard
        method="POST"
        path="/tasks/{id}/complete"
        description="Mark a task as completed with a summary."
        :params="completeParams"
        :curlExample="completeCurl"
        :jsExample="completeJs"
        :phpExample="completePhp"
        :responses="completeResponses"
      />

      <!-- Next Available Task -->
      <EndpointCard
        method="GET"
        path="/projects/{project}/tasks/next-available"
        description="Get the next available task that can be claimed (based on dependencies)."
        :params="nextParams"
        :curlExample="nextCurl"
        :jsExample="nextJs"
        :phpExample="nextPhp"
        :responses="nextResponses"
      />

      <div class="section">
        <h2>Task Statuses</h2>
        <ul>
          <li><code>pending</code> - Task is waiting to be claimed</li>
          <li><code>in_progress</code> - Task is currently being worked on</li>
          <li><code>blocked</code> - Task is blocked by dependencies</li>
          <li><code>review</code> - Task is completed and under review</li>
          <li><code>done</code> - Task is completed</li>
        </ul>
      </div>

      <div class="section">
        <h2>Task Priorities</h2>
        <ul>
          <li><code>low</code> - Low priority, can be done later</li>
          <li><code>medium</code> - Normal priority (default)</li>
          <li><code>high</code> - High priority, should be done soon</li>
          <li><code>critical</code> - Critical priority, needs immediate attention</li>
        </ul>
      </div>

      <div class="section">
        <h2>Task Dependencies</h2>
        <p>
          Tasks can have dependencies on other tasks. A task cannot be claimed until 
          all its dependencies are completed. Use the <code>dependencies</code> array 
          when creating a task to specify task IDs that must be completed first.
        </p>
        <CodeBlock language="json" :code="dependenciesExample" />
      </div>

      <div class="section">
        <h2>Task Lifecycle</h2>
        <p>
          The typical task lifecycle:
        </p>
        <ol>
          <li>Task is created with status <code>pending</code></li>
          <li>An instance claims the task (status becomes <code>in_progress</code>)</li>
          <li>The instance works on the task</li>
          <li>If needed, the task can be released back to <code>pending</code></li>
          <li>When done, the instance marks it as <code>done</code></li>
          <li>A context chunk is created with the completion summary</li>
        </ol>
      </div>
    </div>
  </DocsLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DocsLayout from '@/layouts/DocsLayout.vue';
import EndpointCard from '@/components/docs/EndpointCard.vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';

const taskObject = ref(`{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "project_id": "550e8400-e29b-41d4-a716-446655440002",
  "title": "Implement user authentication",
  "description": "Create login/logout functionality with JWT tokens",
  "priority": "high",
  "status": "in_progress",
  "is_claimed": true,
  "is_completed": false,
  "is_blocked": false,
  "assigned_to": "inst-001",
  "claimed_at": "2026-02-02T14:00:00Z",
  "completed_at": null,
  "files": ["src/auth.ts", "src/middleware.ts"],
  "estimated_tokens": 5000,
  "dependencies": [],
  "blocked_by": [],
  "created_at": "2026-02-02T10:00:00Z",
  "updated_at": "2026-02-02T14:00:00Z"
}`);

// List Tasks
const listParams = [
  { name: 'project', type: 'uuid', required: true, description: 'Project ID' },
  { name: 'status', type: 'enum', required: false, description: 'Filter by status', enum: ['pending', 'in_progress', 'blocked', 'review', 'done'] },
  { name: 'assigned_to', type: 'string', required: false, description: 'Filter by assigned instance ID' },
  { name: 'priority', type: 'enum', required: false, description: 'Filter by priority', enum: ['low', 'medium', 'high', 'critical'] },
  { name: 'per_page', type: 'integer', required: false, description: 'Items per page', default: 20 },
];

const listCurl = `curl https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/tasks \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -G -d "status=pending" -d "priority=high"`;

const listJs = `const response = await fetch('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/tasks?status=pending', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const tasks = await response.json();
console.log(tasks.data);`;

const listPhp = `<?php
$tasks = Http::withToken($token)
    ->get('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/tasks', [
        'status' => 'pending',
        'priority' => 'high',
    ])['data'];`;

const listResponses = {
  '200': {
    success: true,
    data: [
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        title: 'Implement user authentication',
        priority: 'high',
        status: 'pending',
        is_claimed: false,
        created_at: '2026-02-02T10:00:00Z',
      },
    ],
    meta: {
      timestamp: '2026-02-02T15:30:00Z',
      request_id: 'req_abc',
      pagination: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
    },
  },
};

// Create Task
const createParams = [
  { name: 'project', type: 'uuid', required: true, description: 'Project ID' },
  { name: 'title', type: 'string', required: true, description: 'Task title' },
  { name: 'description', type: 'string', required: false, description: 'Task description' },
  { name: 'priority', type: 'enum', required: false, description: 'Task priority', enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  { name: 'files', type: 'array', required: false, description: 'Array of relevant file paths' },
  { name: 'estimated_tokens', type: 'integer', required: false, description: 'Estimated token usage' },
  { name: 'dependencies', type: 'array', required: false, description: 'Array of task IDs this task depends on' },
];

const createCurl = `curl -X POST https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/tasks \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Implement user authentication",
    "description": "Create login/logout functionality",
    "priority": "high",
    "files": ["src/auth.ts", "src/middleware.ts"],
    "estimated_tokens": 5000,
    "dependencies": []
  }'`;

const createJs = `const response = await fetch('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/tasks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Implement user authentication',
    description: 'Create login/logout functionality',
    priority: 'high',
    files: ['src/auth.ts', 'src/middleware.ts'],
    estimated_tokens: 5000,
  }),
});
const task = await response.json();
console.log(task.data);`;

const createPhp = `<?php
$task = Http::withToken($token)
    ->post('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/tasks', [
        'title' => 'Implement user authentication',
        'description' => 'Create login/logout functionality',
        'priority' => 'high',
        'files' => ['src/auth.ts', 'src/middleware.ts'],
        'estimated_tokens' => 5000,
    ])['data'];`;

const createResponses = {
  '201': {
    success: true,
    data: {
      id: '550e8400-e29b-41d4-a716-446655440003',
      project_id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Implement user authentication',
      priority: 'high',
      status: 'pending',
      is_claimed: false,
      created_at: '2026-02-02T15:30:00Z',
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_xyz' },
  },
};

// Get Task
const getParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Task ID' },
];

const getCurl = `curl https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003 \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const getJs = `const response = await fetch('https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const task = await response.json();
console.log(task.data);`;

const getPhp = `<?php
$task = Http::withToken($token)
    ->get('https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003')['data'];`;

const getResponses = {
  '200': {
    success: true,
    data: {
      id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'Implement user authentication',
      description: 'Create login/logout functionality',
      priority: 'high',
      status: 'in_progress',
      is_claimed: true,
      assigned_to: 'inst-001',
      files: ['src/auth.ts', 'src/middleware.ts'],
      dependencies: [],
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_123' },
  },
  '404': {
    success: false,
    error: { code: 'TSK_001', message: 'Task not found' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_456' },
  },
};

// Update Task
const updateParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Task ID' },
  { name: 'title', type: 'string', required: false, description: 'New title' },
  { name: 'description', type: 'string', required: false, description: 'New description' },
  { name: 'priority', type: 'enum', required: false, description: 'New priority', enum: ['low', 'medium', 'high', 'critical'] },
  { name: 'files', type: 'array', required: false, description: 'Updated file list' },
  { name: 'estimated_tokens', type: 'integer', required: false, description: 'Updated token estimate' },
];

const updateCurl = `curl -X PATCH https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003 \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"priority": "critical", "estimated_tokens": 8000}'`;

const updateJs = `await fetch('https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ priority: 'critical', estimated_tokens: 8000 }),
});`;

const updatePhp = `<?php
Http::withToken($token)
    ->patch('https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003', [
        'priority' => 'critical',
        'estimated_tokens' => 8000,
    ]);`;

const updateResponses = {
  '200': {
    success: true,
    data: { id: '...', priority: 'critical', estimated_tokens: 8000 },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_789' },
  },
};

// Delete Task
const deleteParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Task ID' },
];

const deleteCurl = `curl -X DELETE https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003 \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const deleteJs = `await fetch('https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003', {
  method: 'DELETE',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});`;

const deletePhp = `<?php
Http::withToken($token)
    ->delete('https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003');`;

const deleteResponses = {
  '200': {
    success: true,
    data: null,
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_012' },
  },
};

// Claim Task
const claimParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Task ID' },
  { name: 'instance_id', type: 'string', required: true, description: 'Instance ID claiming the task' },
];

const claimCurl = `curl -X POST https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003/claim \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"instance_id": "inst-001"}'`;

const claimJs = `const response = await fetch('https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003/claim', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ instance_id: 'inst-001' }),
});
const task = await response.json();
console.log(task.data.status); // 'in_progress'`;

const claimPhp = `<?php
$task = Http::withToken($token)
    ->post('https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003/claim', [
        'instance_id' => 'inst-001',
    ])['data'];`;

const claimResponses = {
  '200': {
    success: true,
    data: { id: '...', status: 'in_progress', is_claimed: true, assigned_to: 'inst-001' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_claim' },
  },
  '409': {
    success: false,
    error: { code: 'TSK_002', message: 'Task already claimed by inst-002' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_err' },
  },
  '400': {
    success: false,
    error: { code: 'TSK_003', message: 'Task dependencies not completed' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_dep' },
  },
};

// Release Task
const releaseParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Task ID' },
  { name: 'reason', type: 'string', required: false, description: 'Reason for releasing' },
];

const releaseCurl = `curl -X POST https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003/release \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"reason": "Need to work on higher priority task"}'`;

const releaseJs = `await fetch('https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003/release', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ reason: 'Need to work on higher priority task' }),
});`;

const releasePhp = `<?php
Http::withToken($token)
    ->post('https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003/release', [
        'reason' => 'Need to work on higher priority task',
    ]);`;

const releaseResponses = {
  '200': {
    success: true,
    data: { id: '...', status: 'pending', is_claimed: false, assigned_to: null },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_rel' },
  },
  '400': {
    success: false,
    error: { code: 'TSK_003', message: 'Task is not claimed' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_err' },
  },
};

// Complete Task
const completeParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Task ID' },
  { name: 'summary', type: 'string', required: true, description: 'Completion summary' },
  { name: 'files_modified', type: 'array', required: false, description: 'Files modified during task' },
  { name: 'instance_id', type: 'string', required: true, description: 'Instance ID completing the task' },
];

const completeCurl = `curl -X POST https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003/complete \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "summary": "Implemented JWT-based authentication with login/logout endpoints",
    "files_modified": ["src/auth.ts", "src/middleware.ts", "tests/auth.test.ts"],
    "instance_id": "inst-001"
  }'`;

const completeJs = `const response = await fetch('https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003/complete', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    summary: 'Implemented JWT-based authentication...',
    files_modified: ['src/auth.ts', 'src/middleware.ts'],
    instance_id: 'inst-001',
  }),
});`;

const completePhp = `<?php
$task = Http::withToken($token)
    ->post('https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003/complete', [
        'summary' => 'Implemented JWT-based authentication...',
        'files_modified' => ['src/auth.ts', 'src/middleware.ts'],
        'instance_id' => 'inst-001',
    ])['data'];`;

const completeResponses = {
  '200': {
    success: true,
    data: { id: '...', status: 'done', is_completed: true, completion_summary: '...' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_comp' },
  },
  '400': {
    success: false,
    error: { code: 'TSK_003', message: 'Task must be claimed before completion' },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_err' },
  },
};

// Next Available Task
const nextParams = [
  { name: 'project', type: 'uuid', required: true, description: 'Project ID' },
];

const nextCurl = `curl https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/tasks/next-available \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const nextJs = `const response = await fetch('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/tasks/next-available', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
});
const task = await response.json();
if (task.data) {
  console.log('Next task:', task.data.title);
} else {
  console.log('No available tasks');
}`;

const nextPhp = `<?php
$task = Http::withToken($token)
    ->get('https://api.claudenest.io/api/projects/550e8400-e29b-41d4-a716-446655440002/tasks/next-available')['data'];`;

const nextResponses = {
  '200 (with task)': {
    success: true,
    data: {
      id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'Implement user authentication',
      priority: 'high',
      status: 'pending',
    },
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_next' },
  },
  '200 (no task)': {
    success: true,
    data: null,
    meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_none' },
  },
};

const dependenciesExample = ref(`{
  "title": "Add payment processing",
  "description": "Implement Stripe payment processing",
  "dependencies": [
    "550e8400-e29b-41d4-a716-446655440003",  // User auth task
    "550e8400-e29b-41d4-a716-446655440004"   // Database setup task
  ]
}`);
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

ul, ol {
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
