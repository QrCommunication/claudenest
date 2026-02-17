<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>Multi-Agent Coordination</h1>
      <p class="lead">
        Run multiple Claude instances on the same project with shared context,
        task distribution, and file locking to prevent conflicts.
      </p>
    </header>

    <section id="overview">
      <h2>Overview</h2>
      <p>
        ClaudeNest's multi-agent system lets you run several Claude Code instances
        that collaborate on a single codebase. Each instance can claim tasks, share
        context, and lock files to avoid conflicting edits. The coordination happens
        through a central shared project that acts as the source of truth.
      </p>
      <p>
        A typical multi-agent workflow looks like this:
      </p>
      <ol>
        <li>Create a <strong>shared project</strong> on a machine</li>
        <li>Register Claude <strong>instances</strong> against the project</li>
        <li>Create <strong>tasks</strong> describing the work to do</li>
        <li>Each instance <strong>claims</strong> a task, locks the relevant files, and works</li>
        <li>On completion, context is stored for other instances to query</li>
      </ol>
      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        Multi-agent coordination is entirely optional. You can use ClaudeNest with a
        single session and no shared project at all.
      </p>
    </section>

    <section id="shared-projects">
      <h2>Shared Projects</h2>
      <p>
        A shared project is the central hub that links instances, tasks, context
        chunks, and file locks together. It stores high-level metadata such as a
        project summary, architecture notes, coding conventions, and the current
        development focus.
      </p>

      <h3>Creating a Shared Project</h3>
      <CodeTabs :tabs="createProjectTabs" />

      <p>
        The response includes the new project ID that you will use for all
        subsequent multi-agent operations.
      </p>

      <CodeBlock language="json" :code="createProjectResponse" filename="Response" />

      <h3>Updating Project Context</h3>
      <p>
        Keep the shared context up to date so every instance has the latest
        information about conventions, focus areas, and recent changes.
      </p>

      <CodeTabs :tabs="updateProjectTabs" />
    </section>

    <section id="instances">
      <h2>Claude Instances</h2>
      <p>
        A Claude instance represents one running Claude Code process that is
        connected to a shared project. Instances are registered automatically when
        an agent connects, but you can also list and inspect them via the API.
      </p>

      <h3>Listing Active Instances</h3>
      <CodeTabs :tabs="listInstancesTabs" />

      <CodeBlock language="json" :code="listInstancesResponse" filename="Response" />

      <p>
        Each instance exposes its current status (<code>active</code>,
        <code>idle</code>, <code>busy</code>, or <code>disconnected</code>),
        the task it is working on, and its token usage.
      </p>
    </section>

    <section id="coordination">
      <h2>Task Coordination</h2>
      <p>
        The task system is the primary mechanism for distributing work across
        instances. Tasks support priorities, dependencies, and atomic claiming to
        guarantee that no two instances work on the same task simultaneously.
      </p>

      <h3>Creating a Task</h3>
      <CodeTabs :tabs="createTaskTabs" />

      <h3>Claiming a Task</h3>
      <p>
        An instance claims a task atomically. If the task is already claimed or its
        dependencies are not met, the server returns an error.
      </p>
      <CodeTabs :tabs="claimTaskTabs" />

      <h3>Completing a Task</h3>
      <p>
        When the work is done, the instance marks the task as completed. A context
        chunk is automatically created from the completion summary so other
        instances can learn from it.
      </p>
      <CodeTabs :tabs="completeTaskTabs" />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        Use <code>GET /projects/{id}/tasks/next-available</code> to let the server
        pick the highest-priority task whose dependencies are all satisfied.
      </p>
    </section>

    <section id="next-steps">
      <h2>Next Steps</h2>
      <div class="next-steps">
        <router-link to="/docs/guides/rag-pipeline" class="next-step">
          <strong>RAG Pipeline</strong>
          <span>Learn how context is embedded and queried across instances &#8594;</span>
        </router-link>
        <router-link to="/docs/guides/file-locking" class="next-step">
          <strong>File Locking</strong>
          <span>Prevent file conflicts between concurrent agents &#8594;</span>
        </router-link>
        <router-link to="/docs/api/tasks" class="next-step">
          <strong>Tasks API Reference</strong>
          <span>Full endpoint documentation for task management &#8594;</span>
        </router-link>
        <router-link to="/docs/api/projects" class="next-step">
          <strong>Projects API Reference</strong>
          <span>Full endpoint documentation for shared projects &#8594;</span>
        </router-link>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

// -- Shared Projects ----------------------------------------------------------

const createProjectTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.claudenest.io/api/machines/{machine_id}/projects \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "E-commerce Platform",
    "project_path": "/home/dev/projects/ecommerce",
    "summary": "Next.js storefront with Stripe payments",
    "architecture": "Monorepo: apps/web, packages/ui, packages/api",
    "conventions": "TypeScript strict, ESLint, Vitest"
  }'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://api.claudenest.io/api/machines/{machine_id}/projects',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'E-commerce Platform',
      project_path: '/home/dev/projects/ecommerce',
      summary: 'Next.js storefront with Stripe payments',
      architecture: 'Monorepo: apps/web, packages/ui, packages/api',
      conventions: 'TypeScript strict, ESLint, Vitest',
    }),
  }
);
const project = await response.json();
console.log(project.data.id);`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$project = Http::withToken($token)
    ->post('https://api.claudenest.io/api/machines/{machine_id}/projects', [
        'name' => 'E-commerce Platform',
        'project_path' => '/home/dev/projects/ecommerce',
        'summary' => 'Next.js storefront with Stripe payments',
        'architecture' => 'Monorepo: apps/web, packages/ui, packages/api',
        'conventions' => 'TypeScript strict, ESLint, Vitest',
    ])['data'];`,
  },
]);

const createProjectResponse = ref(`{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "machine_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "E-commerce Platform",
    "project_path": "/home/dev/projects/ecommerce",
    "summary": "Next.js storefront with Stripe payments",
    "total_tokens": 0,
    "max_tokens": 100000,
    "token_usage_percent": 0,
    "active_instances_count": 0,
    "pending_tasks_count": 0,
    "created_at": "2026-02-15T10:00:00Z"
  }
}`);

const updateProjectTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X PATCH https://api.claudenest.io/api/projects/{project_id} \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "current_focus": "Implementing checkout flow with Stripe",
    "recent_changes": "Added product catalog and cart modules"
  }'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `await fetch('https://api.claudenest.io/api/projects/{project_id}', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    current_focus: 'Implementing checkout flow with Stripe',
    recent_changes: 'Added product catalog and cart modules',
  }),
});`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
Http::withToken($token)
    ->patch('https://api.claudenest.io/api/projects/{project_id}', [
        'current_focus' => 'Implementing checkout flow with Stripe',
        'recent_changes' => 'Added product catalog and cart modules',
    ]);`,
  },
]);

// -- Instances ----------------------------------------------------------------

const listInstancesTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl https://api.claudenest.io/api/projects/{project_id}/instances \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://api.claudenest.io/api/projects/{project_id}/instances',
  { headers: { 'Authorization': 'Bearer YOUR_TOKEN' } }
);
const instances = await response.json();
console.log(instances.data);`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$instances = Http::withToken($token)
    ->get('https://api.claudenest.io/api/projects/{project_id}/instances')['data'];`,
  },
]);

const listInstancesResponse = ref(`{
  "success": true,
  "data": [
    {
      "id": "inst-001",
      "status": "active",
      "is_connected": true,
      "context_tokens": 12000,
      "context_usage_percent": 12,
      "tasks_completed": 4,
      "current_task": {
        "id": "550e8400-...-440006",
        "title": "Implement payment API"
      },
      "connected_at": "2026-02-15T09:30:00Z",
      "last_activity_at": "2026-02-15T10:25:00Z"
    },
    {
      "id": "inst-002",
      "status": "idle",
      "is_connected": true,
      "context_tokens": 8500,
      "context_usage_percent": 8,
      "tasks_completed": 2,
      "current_task": null,
      "connected_at": "2026-02-15T09:45:00Z",
      "last_activity_at": "2026-02-15T10:20:00Z"
    }
  ]
}`);

// -- Task Coordination --------------------------------------------------------

const createTaskTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.claudenest.io/api/projects/{project_id}/tasks \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Implement Stripe checkout",
    "description": "Integrate Stripe Elements, create payment intent, handle webhooks",
    "priority": "high",
    "files": ["src/checkout.ts", "src/stripe.ts", "src/webhooks.ts"],
    "estimated_tokens": 6000,
    "dependencies": []
  }'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://api.claudenest.io/api/projects/{project_id}/tasks',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Implement Stripe checkout',
      description: 'Integrate Stripe Elements, create payment intent, handle webhooks',
      priority: 'high',
      files: ['src/checkout.ts', 'src/stripe.ts', 'src/webhooks.ts'],
      estimated_tokens: 6000,
      dependencies: [],
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
    ->post('https://api.claudenest.io/api/projects/{project_id}/tasks', [
        'title' => 'Implement Stripe checkout',
        'description' => 'Integrate Stripe Elements, create payment intent, handle webhooks',
        'priority' => 'high',
        'files' => ['src/checkout.ts', 'src/stripe.ts', 'src/webhooks.ts'],
        'estimated_tokens' => 6000,
        'dependencies' => [],
    ])['data'];`,
  },
]);

const claimTaskTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.claudenest.io/api/tasks/{task_id}/claim \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"instance_id": "inst-001"}'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://api.claudenest.io/api/tasks/{task_id}/claim',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ instance_id: 'inst-001' }),
  }
);
const claimed = await response.json();
// claimed.data.status === 'in_progress'`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$task = Http::withToken($token)
    ->post('https://api.claudenest.io/api/tasks/{task_id}/claim', [
        'instance_id' => 'inst-001',
    ])['data'];
// $task['status'] === 'in_progress'`,
  },
]);

const completeTaskTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.claudenest.io/api/tasks/{task_id}/complete \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "summary": "Integrated Stripe Elements for checkout, created server-side payment intents, added webhook handler for payment_intent.succeeded",
    "files_modified": ["src/checkout.ts", "src/stripe.ts", "src/webhooks.ts", "tests/stripe.test.ts"],
    "instance_id": "inst-001"
  }'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `await fetch('https://api.claudenest.io/api/tasks/{task_id}/complete', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    summary: 'Integrated Stripe Elements for checkout, created server-side payment intents, added webhook handler for payment_intent.succeeded',
    files_modified: ['src/checkout.ts', 'src/stripe.ts', 'src/webhooks.ts', 'tests/stripe.test.ts'],
    instance_id: 'inst-001',
  }),
});`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
Http::withToken($token)
    ->post('https://api.claudenest.io/api/tasks/{task_id}/complete', [
        'summary' => 'Integrated Stripe Elements for checkout...',
        'files_modified' => ['src/checkout.ts', 'src/stripe.ts', 'src/webhooks.ts', 'tests/stripe.test.ts'],
        'instance_id' => 'inst-001',
    ]);`,
  },
]);
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
