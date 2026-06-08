<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ t('docDocsGuidesTaskcoordination.pageTitle') }}</h1>
      <p class="lead">
        {{ t('docDocsGuidesTaskcoordination.lead') }}
      </p>
    </header>

    <section id="task-lifecycle">
      <h2>{{ t('docDocsGuidesTaskcoordination.lifecycleTitle') }}</h2>
      <p>
        {{ t('docDocsGuidesTaskcoordination.lifecyclePara1') }}
      </p>

      <div class="lifecycle-diagram">
        <div class="lifecycle-step" data-status="pending">
          <span class="status-dot pending"></span>
          <div>
            <strong>pending</strong>
            <span>{{ t('docDocsGuidesTaskcoordination.lifecyclePendingDesc') }}</span>
          </div>
        </div>
        <div class="lifecycle-arrow">&#8594;</div>
        <div class="lifecycle-step" data-status="in_progress">
          <span class="status-dot in-progress"></span>
          <div>
            <strong>in_progress</strong>
            <span>{{ t('docDocsGuidesTaskcoordination.lifecycleInProgressDesc') }}</span>
          </div>
        </div>
        <div class="lifecycle-arrow">&#8594;</div>
        <div class="lifecycle-step" data-status="review">
          <span class="status-dot review"></span>
          <div>
            <strong>review</strong>
            <span>{{ t('docDocsGuidesTaskcoordination.lifecycleReviewDesc') }}</span>
          </div>
        </div>
        <div class="lifecycle-arrow">&#8594;</div>
        <div class="lifecycle-step" data-status="done">
          <span class="status-dot done"></span>
          <div>
            <strong>done</strong>
            <span>{{ t('docDocsGuidesTaskcoordination.lifecycleDoneDesc') }}</span>
          </div>
        </div>
      </div>

      <p>
        <i18n-t keypath="docDocsGuidesTaskcoordination.lifecycleBlocked" tag="span">
          <template #blocked><code>blocked</code></template>
        </i18n-t>
      </p>

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        <i18n-t keypath="docDocsGuidesTaskcoordination.lifecycleTip" tag="span">
          <template #pending><code>pending</code></template>
        </i18n-t>
      </p>
    </section>

    <section id="creating-tasks">
      <h2>{{ t('docDocsGuidesTaskcoordination.creatingTitle') }}</h2>
      <p>
        {{ t('docDocsGuidesTaskcoordination.creatingPara1') }}
      </p>

      <CodeTabs :tabs="createTaskTabs" />

      <p>
        <i18n-t keypath="docDocsGuidesTaskcoordination.creatingResponseIntro" tag="span">
          <template #pending><code>pending</code></template>
        </i18n-t>
      </p>

      <CodeBlock
        :code="createTaskResponse"
        language="json"
        :filename="t('docDocsGuidesTaskcoordination.filenameResponse')"
      />

      <h3>{{ t('docDocsGuidesTaskcoordination.priorityLevelsTitle') }}</h3>
      <ul>
        <li><code>low</code> &mdash; {{ t('docDocsGuidesTaskcoordination.priorityLow') }}</li>
        <li><code>medium</code> &mdash; {{ t('docDocsGuidesTaskcoordination.priorityMedium') }}</li>
        <li><code>high</code> &mdash; {{ t('docDocsGuidesTaskcoordination.priorityHigh') }}</li>
        <li><code>critical</code> &mdash; {{ t('docDocsGuidesTaskcoordination.priorityCritical') }}</li>
      </ul>
    </section>

    <section id="claiming">
      <h2>{{ t('docDocsGuidesTaskcoordination.claimingTitle') }}</h2>
      <p>
        <i18n-t keypath="docDocsGuidesTaskcoordination.claimingPara1" tag="span">
          <template #atomic><strong>{{ t('docDocsGuidesTaskcoordination.claimingAtomicOperation') }}</strong></template>
          <template #conflict><code>409 Conflict</code></template>
        </i18n-t>
      </p>

      <CodeTabs :tabs="claimTaskTabs" />

      <p>
        <i18n-t keypath="docDocsGuidesTaskcoordination.claimingSuccessIntro" tag="span">
          <template #inProgress><code>in_progress</code></template>
        </i18n-t>
      </p>

      <CodeBlock
        :code="claimTaskResponse"
        language="json"
        :filename="t('docDocsGuidesTaskcoordination.filenameResponse200')"
      />

      <p>{{ t('docDocsGuidesTaskcoordination.claimingTakenIntro') }}</p>

      <CodeBlock
        :code="claimConflictResponse"
        language="json"
        :filename="t('docDocsGuidesTaskcoordination.filenameResponse409')"
      />

      <h3>{{ t('docDocsGuidesTaskcoordination.nextTaskTitle') }}</h3>
      <p>
        {{ t('docDocsGuidesTaskcoordination.nextTaskPara1') }}
      </p>

      <CodeBlock
        :code="nextAvailableCode"
        language="bash"
        :filename="t('docDocsGuidesTaskcoordination.filenameRequest')"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        <i18n-t keypath="docDocsGuidesTaskcoordination.nextTaskTip" tag="span">
          <template #done><code>done</code></template>
        </i18n-t>
      </p>
    </section>

    <section id="completing">
      <h2>{{ t('docDocsGuidesTaskcoordination.completingTitle') }}</h2>
      <p>
        <i18n-t keypath="docDocsGuidesTaskcoordination.completingPara1" tag="span">
          <template #done><code>done</code></template>
        </i18n-t>
      </p>

      <CodeTabs :tabs="completeTaskTabs" />

      <p>{{ t('docDocsGuidesTaskcoordination.completingResponseIntro') }}</p>

      <CodeBlock
        :code="completeTaskResponse"
        language="json"
        :filename="t('docDocsGuidesTaskcoordination.filenameResponse')"
      />

      <h3>{{ t('docDocsGuidesTaskcoordination.releasingTitle') }}</h3>
      <p>
        {{ t('docDocsGuidesTaskcoordination.releasingPara1') }}
      </p>

      <CodeBlock
        :code="releaseTaskCode"
        language="bash"
        :filename="t('docDocsGuidesTaskcoordination.filenameRequest')"
      />
    </section>

    <section id="dependencies">
      <h2>{{ t('docDocsGuidesTaskcoordination.dependenciesTitle') }}</h2>
      <p>
        <i18n-t keypath="docDocsGuidesTaskcoordination.dependenciesPara1" tag="span">
          <template #done><code>done</code></template>
        </i18n-t>
      </p>

      <CodeTabs :tabs="dependencyTabs" />

      <p>
        <i18n-t keypath="docDocsGuidesTaskcoordination.dependenciesPara2" tag="span">
          <template #error400><code>400</code></template>
        </i18n-t>
      </p>

      <CodeBlock
        :code="dependencyErrorResponse"
        language="json"
        :filename="t('docDocsGuidesTaskcoordination.filenameResponse400')"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        {{ t('docDocsGuidesTaskcoordination.dependenciesTip') }}
      </p>
    </section>

    <section id="epics-sprints">
      <h2>{{ t('docDocsGuidesTaskcoordination.epicsSprintsTitle') }}</h2>
      <p>
        {{ t('docDocsGuidesTaskcoordination.epicsSprintsIntro') }}
      </p>

      <h3>{{ t('docDocsGuidesTaskcoordination.epicsTitle') }}</h3>
      <p>
        <i18n-t keypath="docDocsGuidesTaskcoordination.epicsPara1" tag="span">
          <template #epic><strong>{{ t('docDocsGuidesTaskcoordination.epicWord') }}</strong></template>
          <template #epicId><code>epic_id</code></template>
        </i18n-t>
      </p>

      <CodeBlock
        :code="epicExample"
        language="json"
        :filename="t('docDocsGuidesTaskcoordination.filenameTaskWithEpic')"
      />

      <p>
        <i18n-t keypath="docDocsGuidesTaskcoordination.epicsPara2" tag="span">
          <template #epicIdFilter><code>?epic_id=</code></template>
          <template #epicsEndpoint><code>GET /projects/{id}/epics</code></template>
        </i18n-t>
      </p>

      <h3>{{ t('docDocsGuidesTaskcoordination.sprintsTitle') }}</h3>
      <p>
        <i18n-t keypath="docDocsGuidesTaskcoordination.sprintsPara1" tag="span">
          <template #sprint><strong>{{ t('docDocsGuidesTaskcoordination.sprintWord') }}</strong></template>
          <template #sprintId><code>sprint_id</code></template>
        </i18n-t>
      </p>

      <CodeBlock
        :code="sprintExample"
        language="json"
        :filename="t('docDocsGuidesTaskcoordination.filenameTaskWithSprint')"
      />

      <p>
        <i18n-t keypath="docDocsGuidesTaskcoordination.sprintsPara2" tag="span">
          <template #sprintsEndpoint><code>GET /projects/{id}/sprints</code></template>
          <template #startsAt><code>starts_at</code></template>
          <template #endsAt><code>ends_at</code></template>
        </i18n-t>
      </p>

      <h3>{{ t('docDocsGuidesTaskcoordination.subtasksTitle') }}</h3>
      <p>
        <i18n-t keypath="docDocsGuidesTaskcoordination.subtasksPara1" tag="span">
          <template #parentId><code>parent_id</code></template>
        </i18n-t>
      </p>

      <CodeBlock
        :code="subtaskExample"
        language="json"
        :filename="t('docDocsGuidesTaskcoordination.filenameSubtask')"
      />

      <p>
        <i18n-t keypath="docDocsGuidesTaskcoordination.subtasksPara2" tag="span">
          <template #subtasksEndpoint><code>GET /tasks/{id}/subtasks</code></template>
          <template #rootOnly><code>?root_only=true</code></template>
          <template #hasSubtasks><code>has_subtasks</code></template>
          <template #subtasksCount><code>subtasks_count</code></template>
          <template #completedSubtasksCount><code>completed_subtasks_count</code></template>
        </i18n-t>
      </p>

      <h3>{{ t('docDocsGuidesTaskcoordination.storyPointsTitle') }}</h3>
      <p>
        <i18n-t keypath="docDocsGuidesTaskcoordination.storyPointsPara1" tag="span">
          <template #storyPoints><code>story_points</code></template>
        </i18n-t>
      </p>

      <CodeBlock
        :code="storyPointsExample"
        language="json"
        :filename="t('docDocsGuidesTaskcoordination.filenameTaskWithStoryPoints')"
      />

      <h3>{{ t('docDocsGuidesTaskcoordination.agentsTitle') }}</h3>
      <p>
        {{ t('docDocsGuidesTaskcoordination.agentsIntro') }}
      </p>
      <ul>
        <li>
          <i18n-t keypath="docDocsGuidesTaskcoordination.planningAgentItem" tag="span">
            <template #planningAgent><strong>{{ t('docDocsGuidesTaskcoordination.planningAgentName') }}</strong></template>
            <template #contextEndpoint><code>GET /projects/{id}/planning/context</code></template>
            <template #executeEndpoint><code>POST /projects/{id}/planning/execute</code></template>
          </i18n-t>
        </li>
        <li>
          <i18n-t keypath="docDocsGuidesTaskcoordination.runnerAgentItem" tag="span">
            <template #runnerAgent><strong>{{ t('docDocsGuidesTaskcoordination.runnerAgentName') }}</strong></template>
            <template #healthEndpoint><code>GET /projects/{id}/runner/health</code></template>
            <template #autoUpdateEndpoint><code>POST /projects/{id}/runner/auto-update</code></template>
            <template #progressEndpoint><code>GET /projects/{id}/runner/progress</code></template>
          </i18n-t>
        </li>
      </ul>

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        <i18n-t keypath="docDocsGuidesTaskcoordination.agentsTip" tag="span">
          <template #nextAvailable><code>next-available</code></template>
        </i18n-t>
      </p>
    </section>

    <section id="next-steps">
      <h2>{{ t('docDocsGuidesTaskcoordination.nextStepsTitle') }}</h2>
      <div class="next-steps">
        <router-link to="/docs/api/tasks" class="next-step">
          <strong>{{ t('docDocsGuidesTaskcoordination.nextStepTasksApiTitle') }}</strong>
          <span>{{ t('docDocsGuidesTaskcoordination.nextStepTasksApiDesc') }} &#8594;</span>
        </router-link>
        <router-link to="/docs/api/projects" class="next-step">
          <strong>{{ t('docDocsGuidesTaskcoordination.nextStepProjectsApiTitle') }}</strong>
          <span>{{ t('docDocsGuidesTaskcoordination.nextStepProjectsApiDesc') }} &#8594;</span>
        </router-link>
        <router-link to="/docs/guides/agent-setup" class="next-step">
          <strong>{{ t('docDocsGuidesTaskcoordination.nextStepAgentSetupTitle') }}</strong>
          <span>{{ t('docDocsGuidesTaskcoordination.nextStepAgentSetupDesc') }} &#8594;</span>
        </router-link>
        <router-link to="/docs/websocket" class="next-step">
          <strong>{{ t('docDocsGuidesTaskcoordination.nextStepWebsocketTitle') }}</strong>
          <span>{{ t('docDocsGuidesTaskcoordination.nextStepWebsocketDesc') }} &#8594;</span>
        </router-link>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const { t } = useI18n();

// --- Creating Tasks ---

const createTaskTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://claudenest.yourdomain.com/api/projects/PROJECT_ID/tasks \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "title": "Implement user authentication",
    "description": "Add JWT-based login/logout with refresh tokens",
    "priority": "high",
    "files": ["src/auth.ts", "src/middleware.ts"],
    "estimated_tokens": 5000
  }'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://claudenest.yourdomain.com/api/projects/PROJECT_ID/tasks',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Implement user authentication',
      description: 'Add JWT-based login/logout with refresh tokens',
      priority: 'high',
      files: ['src/auth.ts', 'src/middleware.ts'],
      estimated_tokens: 5000,
    }),
  }
);
const task = await response.json();
console.log(task.data.id);`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$task = Http::withToken($token)
    ->post('https://claudenest.yourdomain.com/api/projects/PROJECT_ID/tasks', [
        'title' => 'Implement user authentication',
        'description' => 'Add JWT-based login/logout with refresh tokens',
        'priority' => 'high',
        'files' => ['src/auth.ts', 'src/middleware.ts'],
        'estimated_tokens' => 5000,
    ])['data'];`,
  },
]);

const createTaskResponse = ref(`{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440006",
    "project_id": "PROJECT_ID",
    "title": "Implement user authentication",
    "description": "Add JWT-based login/logout with refresh tokens",
    "priority": "high",
    "status": "pending",
    "is_claimed": false,
    "files": ["src/auth.ts", "src/middleware.ts"],
    "estimated_tokens": 5000,
    "dependencies": [],
    "created_at": "2026-02-17T10:00:00Z"
  },
  "meta": {
    "timestamp": "2026-02-17T10:00:00Z",
    "request_id": "req_create_01"
  }
}`);

// --- Claiming Tasks ---

const claimTaskTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://claudenest.yourdomain.com/api/tasks/TASK_ID/claim \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{"instance_id": "inst-001"}'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://claudenest.yourdomain.com/api/tasks/TASK_ID/claim',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ instance_id: 'inst-001' }),
  }
);
const result = await response.json();
console.log(result.data.status); // 'in_progress'`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$task = Http::withToken($token)
    ->post('https://claudenest.yourdomain.com/api/tasks/TASK_ID/claim', [
        'instance_id' => 'inst-001',
    ])['data'];

// $task['status'] === 'in_progress'`,
  },
]);

const claimTaskResponse = ref(`{
  "success": true,
  "data": {
    "id": "TASK_ID",
    "status": "in_progress",
    "is_claimed": true,
    "assigned_to": "inst-001",
    "claimed_at": "2026-02-17T10:05:00Z"
  },
  "meta": {
    "timestamp": "2026-02-17T10:05:00Z",
    "request_id": "req_claim_01"
  }
}`);

const claimConflictResponse = ref(`{
  "success": false,
  "error": {
    "code": "TSK_002",
    "message": "Task already claimed by inst-002"
  },
  "meta": {
    "timestamp": "2026-02-17T10:05:01Z",
    "request_id": "req_claim_02"
  }
}`);

const nextAvailableCode = ref(`curl https://claudenest.yourdomain.com/api/projects/PROJECT_ID/tasks/next-available \\
  -H 'Authorization: Bearer YOUR_TOKEN'`);

// --- Completing Tasks ---

const completeTaskTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://claudenest.yourdomain.com/api/tasks/TASK_ID/complete \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "summary": "Implemented JWT auth with login/logout endpoints and refresh token rotation",
    "files_modified": ["src/auth.ts", "src/middleware.ts", "tests/auth.test.ts"],
    "instance_id": "inst-001"
  }'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://claudenest.yourdomain.com/api/tasks/TASK_ID/complete',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: 'Implemented JWT auth with login/logout endpoints and refresh token rotation',
      files_modified: ['src/auth.ts', 'src/middleware.ts', 'tests/auth.test.ts'],
      instance_id: 'inst-001',
    }),
  }
);
const result = await response.json();
console.log(result.data.status); // 'done'`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$task = Http::withToken($token)
    ->post('https://claudenest.yourdomain.com/api/tasks/TASK_ID/complete', [
        'summary' => 'Implemented JWT auth with login/logout endpoints and refresh token rotation',
        'files_modified' => ['src/auth.ts', 'src/middleware.ts', 'tests/auth.test.ts'],
        'instance_id' => 'inst-001',
    ])['data'];`,
  },
]);

const completeTaskResponse = ref(`{
  "success": true,
  "data": {
    "id": "TASK_ID",
    "status": "done",
    "is_completed": true,
    "completion_summary": "Implemented JWT auth with login/logout endpoints and refresh token rotation",
    "files_modified": ["src/auth.ts", "src/middleware.ts", "tests/auth.test.ts"],
    "completed_at": "2026-02-17T11:30:00Z"
  },
  "meta": {
    "timestamp": "2026-02-17T11:30:00Z",
    "request_id": "req_complete_01"
  }
}`);

const releaseTaskCode = ref(`curl -X POST https://claudenest.yourdomain.com/api/tasks/TASK_ID/release \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{"reason": "Blocked by missing database migration, need DBA input"}'`);

// --- Dependencies ---

const dependencyTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://claudenest.yourdomain.com/api/projects/PROJECT_ID/tasks \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "title": "Add payment processing",
    "description": "Integrate Stripe for subscription billing",
    "priority": "high",
    "dependencies": [
      "550e8400-e29b-41d4-a716-446655440006",
      "550e8400-e29b-41d4-a716-446655440007"
    ]
  }'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://claudenest.yourdomain.com/api/projects/PROJECT_ID/tasks',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Add payment processing',
      description: 'Integrate Stripe for subscription billing',
      priority: 'high',
      dependencies: [
        '550e8400-e29b-41d4-a716-446655440006',
        '550e8400-e29b-41d4-a716-446655440007',
      ],
    }),
  }
);`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$task = Http::withToken($token)
    ->post('https://claudenest.yourdomain.com/api/projects/PROJECT_ID/tasks', [
        'title' => 'Add payment processing',
        'description' => 'Integrate Stripe for subscription billing',
        'priority' => 'high',
        'dependencies' => [
            '550e8400-e29b-41d4-a716-446655440006',
            '550e8400-e29b-41d4-a716-446655440007',
        ],
    ])['data'];`,
  },
]);

const dependencyErrorResponse = ref(`{
  "success": false,
  "error": {
    "code": "TSK_003",
    "message": "Task dependencies not completed"
  },
  "meta": {
    "timestamp": "2026-02-17T12:00:00Z",
    "request_id": "req_dep_err"
  }
}`);

// --- Epics, Sprints & Subtasks ---

const epicExample = ref(`{
  "title": "Implement checkout flow",
  "description": "End-to-end checkout: cart, payment, confirmation",
  "priority": "high",
  "epic_id": "epic-550e8400-payment",
  "story_points": 8
}`);

const sprintExample = ref(`{
  "title": "Add shipping address validation",
  "priority": "medium",
  "epic_id": "epic-550e8400-payment",
  "sprint_id": "sprint-2026-w15",
  "story_points": 3,
  "due_date": "2026-04-18T18:00:00Z"
}`);

const subtaskExample = ref(`{
  "title": "Write unit tests for address validator",
  "priority": "medium",
  "parent_id": "550e8400-e29b-41d4-a716-446655440010",
  "story_points": 1
}

// Parent task response includes:
// "has_subtasks": true,
// "subtasks_count": 3,
// "completed_subtasks_count": 1`);

const storyPointsExample = ref(`{
  "title": "Integrate Stripe webhooks",
  "priority": "high",
  "epic_id": "epic-550e8400-payment",
  "sprint_id": "sprint-2026-w15",
  "story_points": 5,
  "labels": ["backend", "stripe", "webhooks"],
  "sort_order": 2
}`);
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

ul, ol {
  color: var(--text-secondary);
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

/* Lifecycle Diagram */
.lifecycle-diagram {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
  margin: 1.5rem 0;
  flex-wrap: wrap;
}

.lifecycle-step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  border-radius: 8px;
}

.lifecycle-step div {
  display: flex;
  flex-direction: column;
}

.lifecycle-step strong {
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: 'JetBrains Mono', monospace;
}

.lifecycle-step span {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.pending { background: #fbbf24; }
.status-dot.in-progress { background: #3b82f6; }
.status-dot.review { background: #a855f7; }
.status-dot.done { background: #22c55e; }

.lifecycle-arrow {
  color: var(--text-muted);
  font-size: 1.5rem;
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

  .lifecycle-diagram {
    flex-direction: column;
  }

  .lifecycle-arrow {
    transform: rotate(90deg);
  }
}
</style>
