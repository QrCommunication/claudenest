<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>File Locking</h1>
      <p class="lead">
        Prevent conflicts when multiple agents edit the same files. File locks
        guarantee exclusive write access for a configurable duration.
      </p>
    </header>

    <section id="why-locking">
      <h2>Why File Locking?</h2>
      <p>
        When several Claude instances work on the same project simultaneously,
        two agents might try to modify the same file at the same time. Without
        coordination the result is merge conflicts, overwritten work, or
        inconsistent state.
      </p>
      <p>
        ClaudeNest's file locking system solves this by letting an instance
        acquire an exclusive lock on a file path before editing it. Other
        instances can check whether a file is locked and either wait or choose
        a different file to work on.
      </p>
      <p>Key characteristics of the locking system:</p>
      <ul>
        <li>Locks are <strong>per-project</strong> and <strong>per-path</strong></li>
        <li>Each lock has an <strong>expiration time</strong> (default 30 minutes) to prevent deadlocks</li>
        <li>Locks can be <strong>extended</strong> if the work takes longer than expected</li>
        <li>Project owners can <strong>force-release</strong> any lock</li>
        <li>Disconnected instances have their locks released automatically</li>
      </ul>
    </section>

    <section id="acquire-lock">
      <h2>Acquiring a Lock</h2>
      <p>
        Before editing a file, an instance requests a lock. The server grants
        the lock only if the file is not already locked by another instance.
      </p>

      <CodeTabs :tabs="acquireTabs" />

      <CodeBlock language="json" :code="acquireResponse" filename="Response (200)" />

      <p>
        If the file is already locked, the server returns a <code>409 Conflict</code>
        response with details about the current lock holder:
      </p>

      <CodeBlock language="json" :code="acquireConflict" filename="Response (409)" />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        Always check for a 409 response and implement a retry or fallback
        strategy in your agent logic.
      </p>
    </section>

    <section id="check-lock">
      <h2>Checking Lock Status</h2>
      <p>
        Before attempting to lock a file, you can check whether it is already
        locked. This is useful for planning which files to work on next.
      </p>

      <CodeTabs :tabs="checkTabs" />

      <CodeBlock language="json" :code="checkLockedResponse" filename="Response (locked)" />

      <CodeBlock language="json" :code="checkFreeResponse" filename="Response (free)" />
    </section>

    <section id="extend-lock">
      <h2>Extending a Lock</h2>
      <p>
        If the work is taking longer than the original expiration window, the
        lock holder can extend the lock duration. Only the instance that owns
        the lock can extend it.
      </p>

      <CodeTabs :tabs="extendTabs" />

      <CodeBlock language="json" :code="extendResponse" filename="Response" />
    </section>

    <section id="bulk-locking">
      <h2>Bulk Locking</h2>
      <p>
        When a task involves multiple files, you can lock them all in a single
        atomic request. Either all locks succeed or none are acquired, which
        prevents partial-lock scenarios.
      </p>

      <CodeTabs :tabs="bulkTabs" />

      <CodeBlock language="json" :code="bulkResponse" filename="Response" />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        Bulk locking is atomic: if any file is already locked by another
        instance, the entire request fails and no locks are created.
      </p>

      <h3>Releasing Locks</h3>
      <p>
        When the instance finishes editing, it should release the lock so other
        agents can work on the file. You can release a single lock or all locks
        held by an instance at once.
      </p>

      <CodeTabs :tabs="releaseTabs" />

      <h3>Force-Release</h3>
      <p>
        Project owners can force-release any lock, regardless of who holds it.
        This is useful when an instance has disconnected without cleaning up.
      </p>

      <CodeTabs :tabs="forceReleaseTabs" />
    </section>

    <section id="next-steps">
      <h2>Next Steps</h2>
      <div class="next-steps">
        <router-link to="/docs/guides/multi-agent" class="next-step">
          <strong>Multi-Agent Coordination</strong>
          <span>See how file locking fits into the full multi-agent workflow &#8594;</span>
        </router-link>
        <router-link to="/docs/guides/rag-pipeline" class="next-step">
          <strong>RAG Pipeline</strong>
          <span>Share knowledge between agents with vector-based context search &#8594;</span>
        </router-link>
        <router-link to="/docs/api/tasks" class="next-step">
          <strong>Tasks API Reference</strong>
          <span>Distribute and track work across instances &#8594;</span>
        </router-link>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

// -- Acquire Lock -------------------------------------------------------------

const acquireTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.claudenest.io/api/projects/{project_id}/locks \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "path": "src/checkout.ts",
    "instance_id": "inst-001",
    "reason": "Implementing Stripe checkout flow",
    "duration": 30
  }'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://api.claudenest.io/api/projects/{project_id}/locks',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: 'src/checkout.ts',
      instance_id: 'inst-001',
      reason: 'Implementing Stripe checkout flow',
      duration: 30, // minutes
    }),
  }
);

if (response.status === 409) {
  const conflict = await response.json();
  console.log('File locked by:', conflict.error.locked_by);
} else {
  const lock = await response.json();
  console.log('Lock acquired, expires:', lock.data.expires_at);
}`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$response = Http::withToken($token)
    ->post('https://api.claudenest.io/api/projects/{project_id}/locks', [
        'path' => 'src/checkout.ts',
        'instance_id' => 'inst-001',
        'reason' => 'Implementing Stripe checkout flow',
        'duration' => 30, // minutes
    ]);

if ($response->status() === 409) {
    $lockedBy = $response->json('error.locked_by');
} else {
    $lock = $response->json('data');
}`,
  },
]);

const acquireResponse = ref(`{
  "success": true,
  "data": {
    "id": "880c4500-d34e-5f6a-a0b1-334455667788",
    "project_id": "550e8400-e29b-41d4-a716-446655440002",
    "path": "src/checkout.ts",
    "locked_by": "inst-001",
    "reason": "Implementing Stripe checkout flow",
    "locked_at": "2026-02-15T10:00:00Z",
    "expires_at": "2026-02-15T10:30:00Z"
  }
}`);

const acquireConflict = ref(`{
  "success": false,
  "error": {
    "code": "LOCK_001",
    "message": "File is already locked",
    "locked_by": "inst-002",
    "expires_at": "2026-02-15T10:25:00Z"
  }
}`);

// -- Check Lock ---------------------------------------------------------------

const checkTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.claudenest.io/api/projects/{project_id}/locks/check \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"path": "src/checkout.ts"}'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://api.claudenest.io/api/projects/{project_id}/locks/check',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: 'src/checkout.ts' }),
  }
);
const result = await response.json();

if (result.data.is_locked) {
  console.log('Locked by', result.data.locked_by, 'until', result.data.expires_at);
} else {
  console.log('File is available');
}`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$result = Http::withToken($token)
    ->post('https://api.claudenest.io/api/projects/{project_id}/locks/check', [
        'path' => 'src/checkout.ts',
    ])['data'];

if ($result['is_locked']) {
    echo "Locked by {$result['locked_by']}";
}`,
  },
]);

const checkLockedResponse = ref(`{
  "success": true,
  "data": {
    "path": "src/checkout.ts",
    "is_locked": true,
    "locked_by": "inst-001",
    "reason": "Implementing Stripe checkout flow",
    "locked_at": "2026-02-15T10:00:00Z",
    "expires_at": "2026-02-15T10:30:00Z"
  }
}`);

const checkFreeResponse = ref(`{
  "success": true,
  "data": {
    "path": "src/checkout.ts",
    "is_locked": false
  }
}`);

// -- Extend Lock --------------------------------------------------------------

const extendTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.claudenest.io/api/projects/{project_id}/locks/extend \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "path": "src/checkout.ts",
    "instance_id": "inst-001",
    "duration": 15
  }'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `await fetch(
  'https://api.claudenest.io/api/projects/{project_id}/locks/extend',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: 'src/checkout.ts',
      instance_id: 'inst-001',
      duration: 15, // extend by 15 more minutes
    }),
  }
);`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
Http::withToken($token)
    ->post('https://api.claudenest.io/api/projects/{project_id}/locks/extend', [
        'path' => 'src/checkout.ts',
        'instance_id' => 'inst-001',
        'duration' => 15,
    ]);`,
  },
]);

const extendResponse = ref(`{
  "success": true,
  "data": {
    "path": "src/checkout.ts",
    "locked_by": "inst-001",
    "expires_at": "2026-02-15T10:45:00Z"
  }
}`);

// -- Bulk Lock ----------------------------------------------------------------

const bulkTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.claudenest.io/api/projects/{project_id}/locks/bulk \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "paths": [
      "src/checkout.ts",
      "src/stripe.ts",
      "src/webhooks.ts"
    ],
    "instance_id": "inst-001",
    "reason": "Stripe integration across multiple files",
    "duration": 30
  }'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://api.claudenest.io/api/projects/{project_id}/locks/bulk',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paths: ['src/checkout.ts', 'src/stripe.ts', 'src/webhooks.ts'],
      instance_id: 'inst-001',
      reason: 'Stripe integration across multiple files',
      duration: 30,
    }),
  }
);
const locks = await response.json();
console.log(locks.data.length, 'files locked');`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$locks = Http::withToken($token)
    ->post('https://api.claudenest.io/api/projects/{project_id}/locks/bulk', [
        'paths' => ['src/checkout.ts', 'src/stripe.ts', 'src/webhooks.ts'],
        'instance_id' => 'inst-001',
        'reason' => 'Stripe integration across multiple files',
        'duration' => 30,
    ])['data'];`,
  },
]);

const bulkResponse = ref(`{
  "success": true,
  "data": [
    {
      "path": "src/checkout.ts",
      "locked_by": "inst-001",
      "expires_at": "2026-02-15T10:30:00Z"
    },
    {
      "path": "src/stripe.ts",
      "locked_by": "inst-001",
      "expires_at": "2026-02-15T10:30:00Z"
    },
    {
      "path": "src/webhooks.ts",
      "locked_by": "inst-001",
      "expires_at": "2026-02-15T10:30:00Z"
    }
  ]
}`);

// -- Release Lock -------------------------------------------------------------

const releaseTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `# Release a single lock
curl -X POST https://api.claudenest.io/api/projects/{project_id}/locks/release \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "path": "src/checkout.ts",
    "instance_id": "inst-001"
  }'

# Release all locks held by an instance
curl -X POST https://api.claudenest.io/api/projects/{project_id}/locks/release-by-instance \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"instance_id": "inst-001"}'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `// Release a single lock
await fetch(
  'https://api.claudenest.io/api/projects/{project_id}/locks/release',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: 'src/checkout.ts',
      instance_id: 'inst-001',
    }),
  }
);

// Release all locks held by an instance
await fetch(
  'https://api.claudenest.io/api/projects/{project_id}/locks/release-by-instance',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ instance_id: 'inst-001' }),
  }
);`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
// Release a single lock
Http::withToken($token)
    ->post('https://api.claudenest.io/api/projects/{project_id}/locks/release', [
        'path' => 'src/checkout.ts',
        'instance_id' => 'inst-001',
    ]);

// Release all locks held by an instance
Http::withToken($token)
    ->post('https://api.claudenest.io/api/projects/{project_id}/locks/release-by-instance', [
        'instance_id' => 'inst-001',
    ]);`,
  },
]);

// -- Force Release ------------------------------------------------------------

const forceReleaseTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.claudenest.io/api/projects/{project_id}/locks/force-release \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"path": "src/checkout.ts"}'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `await fetch(
  'https://api.claudenest.io/api/projects/{project_id}/locks/force-release',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: 'src/checkout.ts' }),
  }
);`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
Http::withToken($token)
    ->post('https://api.claudenest.io/api/projects/{project_id}/locks/force-release', [
        'path' => 'src/checkout.ts',
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
