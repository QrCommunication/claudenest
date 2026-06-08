<template>
  <DocsLayout>
    <div class="docs-page">
      <h1>{{ $t('docDocsTasks.title') }}</h1>

      <p class="lead">
        {{ $t('docDocsTasks.lead') }}
      </p>

      <div class="section">
        <h2>{{ $t('docDocsTasks.taskObjectHeading') }}</h2>
        <CodeBlock language="json" :code="taskObject" />
      </div>

      <!-- List Tasks -->
      <EndpointCard
        method="GET"
        path="/projects/{project}/tasks"
        :description="$t('docDocsTasks.listDescription')"
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
        :description="$t('docDocsTasks.createDescription')"
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
        :description="$t('docDocsTasks.getDescription')"
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
        :description="$t('docDocsTasks.updateDescription')"
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
        :description="$t('docDocsTasks.deleteDescription')"
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
        :description="$t('docDocsTasks.claimDescription')"
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
        :description="$t('docDocsTasks.releaseDescription')"
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
        :description="$t('docDocsTasks.completeDescription')"
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
        :description="$t('docDocsTasks.nextDescription')"
        :params="nextParams"
        :curlExample="nextCurl"
        :jsExample="nextJs"
        :phpExample="nextPhp"
        :responses="nextResponses"
      />

      <!-- Get Subtasks -->
      <EndpointCard
        method="GET"
        path="/tasks/{id}/subtasks"
        :description="$t('docDocsTasks.subtasksDescription')"
        :params="subtasksParams"
        :curlExample="subtasksCurl"
        :jsExample="subtasksJs"
        :phpExample="subtasksPhp"
        :responses="subtasksResponses"
      />

      <!-- Move Task -->
      <EndpointCard
        method="POST"
        path="/tasks/{id}/move"
        :description="$t('docDocsTasks.moveDescription')"
        :params="moveParams"
        :curlExample="moveCurl"
        :jsExample="moveJs"
        :phpExample="movePhp"
        :responses="moveResponses"
      />

      <div class="section">
        <h2>{{ $t('docDocsTasks.extendedFieldsHeading') }}</h2>
        <p>
          {{ $t('docDocsTasks.extendedFieldsIntro') }}
        </p>
        <CodeBlock language="json" :code="extendedTaskObject" />
        <ul>
          <li><code>epic_id</code> &mdash; {{ $t('docDocsTasks.fieldEpicId') }} <code>null</code></li>
          <li><code>sprint_id</code> &mdash; {{ $t('docDocsTasks.fieldSprintId') }} <code>null</code></li>
          <li><code>parent_id</code> &mdash; {{ $t('docDocsTasks.fieldParentId') }} <code>null</code></li>
          <li><code>story_points</code> &mdash; {{ $t('docDocsTasks.fieldStoryPoints') }}</li>
          <li><code>due_date</code> &mdash; {{ $t('docDocsTasks.fieldDueDate') }} <code>null</code></li>
          <li><code>sort_order</code> &mdash; {{ $t('docDocsTasks.fieldSortOrder') }}</li>
          <li><code>labels</code> &mdash; {{ $t('docDocsTasks.fieldLabels') }} <code>["backend", "stripe"]</code>)</li>
          <li><code>has_subtasks</code> &mdash; {{ $t('docDocsTasks.fieldHasSubtasksPre') }} <code>true</code> {{ $t('docDocsTasks.fieldHasSubtasksPost') }}</li>
          <li><code>subtasks_count</code> &mdash; {{ $t('docDocsTasks.fieldSubtasksCount') }}</li>
          <li><code>completed_subtasks_count</code> &mdash; {{ $t('docDocsTasks.fieldCompletedSubtasksCount') }} <code>done</code></li>
        </ul>
      </div>

      <div class="section">
        <h2>{{ $t('docDocsTasks.additionalFiltersHeading') }}</h2>
        <p>
          {{ $t('docDocsTasks.additionalFiltersIntroPre') }} <code>GET /projects/{project}/tasks</code> {{ $t('docDocsTasks.additionalFiltersIntroMid') }} <code>status</code>, <code>priority</code>, {{ $t('docDocsTasks.additionalFiltersIntroAnd') }}
          <code>assigned_to</code>:
        </p>
        <ul>
          <li><code>?epic_id=</code> &mdash; {{ $t('docDocsTasks.filterEpicId') }}</li>
          <li><code>?sprint_id=</code> &mdash; {{ $t('docDocsTasks.filterSprintId') }}</li>
          <li><code>?parent_id=</code> &mdash; {{ $t('docDocsTasks.filterParentId') }}</li>
          <li><code>?root_only=true</code> &mdash; {{ $t('docDocsTasks.filterRootOnly') }}</li>
        </ul>
      </div>

      <div class="section">
        <h2>{{ $t('docDocsTasks.statusesHeading') }}</h2>
        <ul>
          <li><code>pending</code> - {{ $t('docDocsTasks.statusPending') }}</li>
          <li><code>in_progress</code> - {{ $t('docDocsTasks.statusInProgress') }}</li>
          <li><code>blocked</code> - {{ $t('docDocsTasks.statusBlocked') }}</li>
          <li><code>review</code> - {{ $t('docDocsTasks.statusReview') }}</li>
          <li><code>done</code> - {{ $t('docDocsTasks.statusDone') }}</li>
        </ul>
      </div>

      <div class="section">
        <h2>{{ $t('docDocsTasks.prioritiesHeading') }}</h2>
        <ul>
          <li><code>low</code> - {{ $t('docDocsTasks.priorityLow') }}</li>
          <li><code>medium</code> - {{ $t('docDocsTasks.priorityMedium') }}</li>
          <li><code>high</code> - {{ $t('docDocsTasks.priorityHigh') }}</li>
          <li><code>critical</code> - {{ $t('docDocsTasks.priorityCritical') }}</li>
        </ul>
      </div>

      <div class="section">
        <h2>{{ $t('docDocsTasks.dependenciesHeading') }}</h2>
        <p>
          {{ $t('docDocsTasks.dependenciesIntroPre') }} <code>dependencies</code> {{ $t('docDocsTasks.dependenciesIntroPost') }}
        </p>
        <CodeBlock language="json" :code="dependenciesExample" />
      </div>

      <div class="section">
        <h2>{{ $t('docDocsTasks.lifecycleHeading') }}</h2>
        <p>
          {{ $t('docDocsTasks.lifecycleIntro') }}
        </p>
        <ol>
          <li>{{ $t('docDocsTasks.lifecycle1Pre') }} <code>pending</code></li>
          <li>{{ $t('docDocsTasks.lifecycle2Pre') }} <code>in_progress</code>{{ $t('docDocsTasks.lifecycle2Post') }}</li>
          <li>{{ $t('docDocsTasks.lifecycle3') }}</li>
          <li>{{ $t('docDocsTasks.lifecycle4Pre') }} <code>pending</code></li>
          <li>{{ $t('docDocsTasks.lifecycle5Pre') }} <code>done</code></li>
          <li>{{ $t('docDocsTasks.lifecycle6') }}</li>
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

const listResponses = [
  {
    status: 200,
    body: JSON.stringify({
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
    }, null, 2),
  },
];

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

const createResponses = [
  {
    status: 201,
    body: JSON.stringify({
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
    }, null, 2),
  },
];

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

const getResponses = [
  {
    status: 200,
    body: JSON.stringify({
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
    }, null, 2),
  },
  {
    status: 404,
    description: 'Task not found',
    body: JSON.stringify({
      success: false,
      error: { code: 'TSK_001', message: 'Task not found' },
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_456' },
    }, null, 2),
  },
];

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

const updateResponses = [
  {
    status: 200,
    body: JSON.stringify({
      success: true,
      data: { id: '...', priority: 'critical', estimated_tokens: 8000 },
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_789' },
    }, null, 2),
  },
];

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

const claimResponses = [
  {
    status: 200,
    body: JSON.stringify({
      success: true,
      data: { id: '...', status: 'in_progress', is_claimed: true, assigned_to: 'inst-001' },
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_claim' },
    }, null, 2),
  },
  {
    status: 409,
    description: 'Task already claimed',
    body: JSON.stringify({
      success: false,
      error: { code: 'TSK_002', message: 'Task already claimed by inst-002' },
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_err' },
    }, null, 2),
  },
  {
    status: 400,
    description: 'Dependencies not completed',
    body: JSON.stringify({
      success: false,
      error: { code: 'TSK_003', message: 'Task dependencies not completed' },
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_dep' },
    }, null, 2),
  },
];

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

const releaseResponses = [
  {
    status: 200,
    body: JSON.stringify({
      success: true,
      data: { id: '...', status: 'pending', is_claimed: false, assigned_to: null },
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_rel' },
    }, null, 2),
  },
  {
    status: 400,
    description: 'Task is not claimed',
    body: JSON.stringify({
      success: false,
      error: { code: 'TSK_003', message: 'Task is not claimed' },
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_err' },
    }, null, 2),
  },
];

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

const completeResponses = [
  {
    status: 200,
    body: JSON.stringify({
      success: true,
      data: { id: '...', status: 'done', is_completed: true, completion_summary: '...' },
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_comp' },
    }, null, 2),
  },
  {
    status: 400,
    description: 'Task not claimed',
    body: JSON.stringify({
      success: false,
      error: { code: 'TSK_003', message: 'Task must be claimed before completion' },
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_err' },
    }, null, 2),
  },
];

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

const nextResponses = [
  {
    status: 200,
    description: 'Task available',
    body: JSON.stringify({
      success: true,
      data: {
        id: '550e8400-e29b-41d4-a716-446655440003',
        title: 'Implement user authentication',
        priority: 'high',
        status: 'pending',
      },
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_next' },
    }, null, 2),
  },
  {
    status: 200,
    description: 'No task available',
    body: JSON.stringify({
      success: true,
      data: null,
      meta: { timestamp: '2026-02-02T15:30:00Z', request_id: 'req_none' },
    }, null, 2),
  },
];

const dependenciesExample = ref(`{
  "title": "Add payment processing",
  "description": "Implement Stripe payment processing",
  "dependencies": [
    "550e8400-e29b-41d4-a716-446655440003",  // User auth task
    "550e8400-e29b-41d4-a716-446655440004"   // Database setup task
  ]
}`);

// Extended Task Object
const extendedTaskObject = ref(`{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "project_id": "550e8400-e29b-41d4-a716-446655440002",
  "title": "Integrate Stripe webhooks",
  "priority": "high",
  "status": "pending",
  "epic_id": "epic-550e8400-payment",
  "sprint_id": "sprint-2026-w15",
  "parent_id": null,
  "story_points": 5,
  "due_date": "2026-04-18T18:00:00Z",
  "sort_order": 2,
  "labels": ["backend", "stripe", "webhooks"],
  "has_subtasks": true,
  "subtasks_count": 3,
  "completed_subtasks_count": 1,
  "dependencies": [],
  "files": ["src/webhooks.ts"],
  "estimated_tokens": 4000,
  "created_at": "2026-04-10T10:00:00Z",
  "updated_at": "2026-04-12T09:30:00Z"
}`);

// Subtasks
const subtasksParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Parent task ID' },
  { name: 'status', type: 'enum', required: false, description: 'Filter by status', enum: ['pending', 'in_progress', 'done'] },
];

const subtasksCurl = `curl https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003/subtasks \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const subtasksJs = `const response = await fetch(
  'https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003/subtasks',
  { headers: { 'Authorization': 'Bearer YOUR_TOKEN' } }
);
const subtasks = await response.json();
console.log(subtasks.data);`;

const subtasksPhp = `<?php
$subtasks = Http::withToken($token)
    ->get('https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003/subtasks')['data'];`;

const subtasksResponses = [
  {
    status: 200,
    body: JSON.stringify({
      success: true,
      data: [
        { id: 'sub-001', title: 'Parse Stripe event payload', status: 'done', story_points: 1 },
        { id: 'sub-002', title: 'Persist payment intent updates', status: 'in_progress', story_points: 2 },
        { id: 'sub-003', title: 'Write webhook integration tests', status: 'pending', story_points: 2 },
      ],
      meta: { timestamp: '2026-04-12T10:00:00Z', request_id: 'req_sub' },
    }, null, 2),
  },
];

// Move Task
const moveParams = [
  { name: 'id', type: 'uuid', required: true, description: 'Task ID to move' },
  { name: 'epic_id', type: 'uuid', required: false, description: 'Target epic UUID (null to remove from epic)' },
  { name: 'sprint_id', type: 'string', required: false, description: 'Target sprint identifier (null to unschedule)' },
  { name: 'parent_id', type: 'uuid', required: false, description: 'New parent task UUID (null to make root-level)' },
  { name: 'sort_order', type: 'integer', required: false, description: 'Position within the target list' },
];

const moveCurl = `curl -X POST https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003/move \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sprint_id": "sprint-2026-w16",
    "sort_order": 1
  }'`;

const moveJs = `await fetch('https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003/move', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ sprint_id: 'sprint-2026-w16', sort_order: 1 }),
});`;

const movePhp = `<?php
Http::withToken($token)
    ->post('https://api.claudenest.io/api/tasks/550e8400-e29b-41d4-a716-446655440003/move', [
        'sprint_id' => 'sprint-2026-w16',
        'sort_order' => 1,
    ]);`;

const moveResponses = [
  {
    status: 200,
    body: JSON.stringify({
      success: true,
      data: {
        id: '550e8400-e29b-41d4-a716-446655440003',
        sprint_id: 'sprint-2026-w16',
        sort_order: 1,
        updated_at: '2026-04-12T10:05:00Z',
      },
      meta: { timestamp: '2026-04-12T10:05:00Z', request_id: 'req_move' },
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
