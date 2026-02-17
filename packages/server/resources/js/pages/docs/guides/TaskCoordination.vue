<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>Task Coordination</h1>
      <p class="lead">
        Distribute and coordinate work between Claude instances. Tasks provide an atomic
        claiming system that prevents conflicts and ensures each unit of work is handled
        by exactly one agent at a time.
      </p>
    </header>

    <section id="task-lifecycle">
      <h2>Task Lifecycle</h2>
      <p>
        Every task follows a well-defined lifecycle from creation to completion.
        Understanding these states is key to building reliable multi-agent workflows.
      </p>

      <div class="lifecycle-diagram">
        <div class="lifecycle-step" data-status="pending">
          <span class="status-dot pending"></span>
          <div>
            <strong>pending</strong>
            <span>Waiting to be claimed</span>
          </div>
        </div>
        <div class="lifecycle-arrow">&#8594;</div>
        <div class="lifecycle-step" data-status="in_progress">
          <span class="status-dot in-progress"></span>
          <div>
            <strong>in_progress</strong>
            <span>Claimed by an instance</span>
          </div>
        </div>
        <div class="lifecycle-arrow">&#8594;</div>
        <div class="lifecycle-step" data-status="review">
          <span class="status-dot review"></span>
          <div>
            <strong>review</strong>
            <span>Work completed, under review</span>
          </div>
        </div>
        <div class="lifecycle-arrow">&#8594;</div>
        <div class="lifecycle-step" data-status="done">
          <span class="status-dot done"></span>
          <div>
            <strong>done</strong>
            <span>Finished and recorded</span>
          </div>
        </div>
      </div>

      <p>
        A task can also enter the <code>blocked</code> state if it depends on other tasks
        that have not yet been completed. Blocked tasks cannot be claimed until all
        dependencies are resolved.
      </p>

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        If an instance cannot finish a task, it can release it back to <code>pending</code>
        so another instance can pick it up.
      </p>
    </section>

    <section id="creating-tasks">
      <h2>Creating Tasks</h2>
      <p>
        Create tasks within a shared project. Each task includes a title, optional
        description, priority level, and an estimate of the token budget required.
      </p>

      <CodeTabs :tabs="createTaskTabs" />

      <p>The response returns the newly created task with its <code>pending</code> status:</p>

      <CodeBlock
        :code="createTaskResponse"
        language="json"
        filename="Response"
      />

      <h3>Priority Levels</h3>
      <ul>
        <li><code>low</code> &mdash; Can be done later, non-urgent</li>
        <li><code>medium</code> &mdash; Normal priority (default)</li>
        <li><code>high</code> &mdash; Should be addressed soon</li>
        <li><code>critical</code> &mdash; Needs immediate attention</li>
      </ul>
    </section>

    <section id="claiming">
      <h2>Claiming Tasks</h2>
      <p>
        Claiming is an <strong>atomic operation</strong>: only one instance can claim a
        given task. If two instances try to claim the same task simultaneously, only one
        succeeds and the other receives a <code>409 Conflict</code> response.
      </p>

      <CodeTabs :tabs="claimTaskTabs" />

      <p>On success the task status changes to <code>in_progress</code>:</p>

      <CodeBlock
        :code="claimTaskResponse"
        language="json"
        filename="Response (200)"
      />

      <p>If the task is already taken:</p>

      <CodeBlock
        :code="claimConflictResponse"
        language="json"
        filename="Response (409)"
      />

      <h3>Automatic Next-Task Selection</h3>
      <p>
        Instead of choosing a specific task, an instance can request the next available
        task whose dependencies are satisfied:
      </p>

      <CodeBlock
        :code="nextAvailableCode"
        language="bash"
        filename="Request"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        The server picks the highest-priority, oldest-pending task whose dependencies are
        all in <code>done</code> status.
      </p>
    </section>

    <section id="completing">
      <h2>Completing Tasks</h2>
      <p>
        When an instance finishes its work it marks the task as <code>done</code> and
        provides a summary. The server automatically creates a context chunk from the
        completion summary so other instances can benefit from the result via RAG.
      </p>

      <CodeTabs :tabs="completeTaskTabs" />

      <p>The response confirms the task is done:</p>

      <CodeBlock
        :code="completeTaskResponse"
        language="json"
        filename="Response"
      />

      <h3>Releasing a Task</h3>
      <p>
        If an instance cannot finish its work, it should release the task so others can
        pick it up. Provide an optional reason to help the next claimant understand the
        context:
      </p>

      <CodeBlock
        :code="releaseTaskCode"
        language="bash"
        filename="Request"
      />
    </section>

    <section id="dependencies">
      <h2>Task Dependencies</h2>
      <p>
        Tasks can declare dependencies on other tasks. A dependent task cannot be claimed
        until every task it depends on has reached the <code>done</code> status.
      </p>

      <CodeTabs :tabs="dependencyTabs" />

      <p>
        The dependency graph is validated at claim time. If a dependency is still pending
        or in progress, the server returns a <code>400</code> error:
      </p>

      <CodeBlock
        :code="dependencyErrorResponse"
        language="json"
        filename="Response (400)"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        Keep dependency chains short. Deep chains slow down parallel execution because
        later tasks must wait for all predecessors to complete sequentially.
      </p>
    </section>

    <section id="next-steps">
      <h2>Next Steps</h2>
      <div class="next-steps">
        <router-link to="/docs/api/tasks" class="next-step">
          <strong>Tasks API Reference</strong>
          <span>Full endpoint documentation for tasks &#8594;</span>
        </router-link>
        <router-link to="/docs/api/projects" class="next-step">
          <strong>Projects API</strong>
          <span>Manage shared projects and context &#8594;</span>
        </router-link>
        <router-link to="/docs/guides/agent-setup" class="next-step">
          <strong>Agent Setup</strong>
          <span>Install and configure the ClaudeNest agent &#8594;</span>
        </router-link>
        <router-link to="/docs/websocket" class="next-step">
          <strong>WebSocket Events</strong>
          <span>Real-time task events via WebSocket &#8594;</span>
        </router-link>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

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
