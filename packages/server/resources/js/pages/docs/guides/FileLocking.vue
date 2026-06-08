<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ t('docDocsGuidesFilelocking.title') }}</h1>
      <p class="lead">
        {{ t('docDocsGuidesFilelocking.lead') }}
      </p>
    </header>

    <section id="why-locking">
      <h2>{{ t('docDocsGuidesFilelocking.whyHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesFilelocking.whyPara1') }}
      </p>
      <p>
        {{ t('docDocsGuidesFilelocking.whyPara2') }}
      </p>
      <p>{{ t('docDocsGuidesFilelocking.keyCharacteristics') }}</p>
      <ul>
        <li><span v-html="t('docDocsGuidesFilelocking.keyItem1')"></span></li>
        <li><span v-html="t('docDocsGuidesFilelocking.keyItem2')"></span></li>
        <li><span v-html="t('docDocsGuidesFilelocking.keyItem3')"></span></li>
        <li><span v-html="t('docDocsGuidesFilelocking.keyItem4')"></span></li>
        <li>{{ t('docDocsGuidesFilelocking.keyItem5') }}</li>
      </ul>
    </section>

    <section id="acquire-lock">
      <h2>{{ t('docDocsGuidesFilelocking.acquireHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesFilelocking.acquirePara1') }}
      </p>

      <CodeTabs :tabs="acquireTabs" />

      <CodeBlock language="json" :code="acquireResponse" :filename="t('docDocsGuidesFilelocking.responseFilename200')" />

      <p>
        {{ t('docDocsGuidesFilelocking.acquireConflictIntro') }} <code>409 Conflict</code>
        {{ t('docDocsGuidesFilelocking.acquireConflictIntroSuffix') }}
      </p>

      <CodeBlock language="json" :code="acquireConflict" :filename="t('docDocsGuidesFilelocking.responseFilename409')" />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        {{ t('docDocsGuidesFilelocking.acquireTip') }}
      </p>
    </section>

    <section id="check-lock">
      <h2>{{ t('docDocsGuidesFilelocking.checkHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesFilelocking.checkPara1') }}
      </p>

      <CodeTabs :tabs="checkTabs" />

      <CodeBlock language="json" :code="checkLockedResponse" :filename="t('docDocsGuidesFilelocking.responseFilenameLocked')" />

      <CodeBlock language="json" :code="checkFreeResponse" :filename="t('docDocsGuidesFilelocking.responseFilenameFree')" />
    </section>

    <section id="extend-lock">
      <h2>{{ t('docDocsGuidesFilelocking.extendHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesFilelocking.extendPara1') }}
      </p>

      <CodeTabs :tabs="extendTabs" />

      <CodeBlock language="json" :code="extendResponse" :filename="t('docDocsGuidesFilelocking.responseFilename')" />
    </section>

    <section id="atomic-acquisition">
      <h2>{{ t('docDocsGuidesFilelocking.atomicHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesFilelocking.atomicPara1a') }} <code>lockForUpdate</code> {{ t('docDocsGuidesFilelocking.atomicPara1b') }}
        <code>409 Conflict</code> {{ t('docDocsGuidesFilelocking.atomicPara1c') }}
      </p>
      <p>
        {{ t('docDocsGuidesFilelocking.atomicPara2') }}
      </p>
    </section>

    <section id="task-lock-integration">
      <h2>{{ t('docDocsGuidesFilelocking.taskLockHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesFilelocking.taskLockPara1a') }} <code>POST /tasks/{id}/claim</code>{{ t('docDocsGuidesFilelocking.taskLockPara1b') }} <code>files</code> {{ t('docDocsGuidesFilelocking.taskLockPara1c') }}
      </p>
      <p>
        {{ t('docDocsGuidesFilelocking.taskLockPara2a') }} <code>POST /tasks/{id}/complete</code>{{ t('docDocsGuidesFilelocking.taskLockPara2b') }} <code>POST /tasks/{id}/release</code>{{ t('docDocsGuidesFilelocking.taskLockPara2c') }}
      </p>

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        {{ t('docDocsGuidesFilelocking.taskLockTipA') }} <code>files</code> {{ t('docDocsGuidesFilelocking.taskLockTipB') }} <code>POST /locks</code>{{ t('docDocsGuidesFilelocking.taskLockTipC') }}
      </p>
    </section>

    <section id="heartbeat-extend">
      <h2>{{ t('docDocsGuidesFilelocking.heartbeatHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesFilelocking.heartbeatPara1') }}
      </p>
      <p>
        {{ t('docDocsGuidesFilelocking.heartbeatPara2a') }} <code>POST /locks/extend</code> {{ t('docDocsGuidesFilelocking.heartbeatPara2b') }}
      </p>
    </section>

    <section id="conflicts-batch">
      <h2>{{ t('docDocsGuidesFilelocking.conflictsHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesFilelocking.conflictsPara1') }}
      </p>

      <CodeTabs :tabs="conflictsTabs" />

      <CodeBlock language="json" :code="conflictsResponse" :filename="t('docDocsGuidesFilelocking.responseFilename')" />
    </section>

    <section id="bulk-locking">
      <h2>{{ t('docDocsGuidesFilelocking.bulkHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesFilelocking.bulkPara1') }}
      </p>

      <CodeTabs :tabs="bulkTabs" />

      <CodeBlock language="json" :code="bulkResponse" :filename="t('docDocsGuidesFilelocking.responseFilename')" />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        {{ t('docDocsGuidesFilelocking.bulkTip') }}
      </p>

      <h3>{{ t('docDocsGuidesFilelocking.releaseHeading') }}</h3>
      <p>
        {{ t('docDocsGuidesFilelocking.releasePara1') }}
      </p>

      <CodeTabs :tabs="releaseTabs" />

      <h3>{{ t('docDocsGuidesFilelocking.forceReleaseHeading') }}</h3>
      <p>
        {{ t('docDocsGuidesFilelocking.forceReleasePara1') }}
      </p>

      <CodeTabs :tabs="forceReleaseTabs" />
    </section>

    <section id="next-steps">
      <h2>{{ t('docDocsGuidesFilelocking.nextStepsHeading') }}</h2>
      <div class="next-steps">
        <router-link to="/docs/guides/multi-agent" class="next-step">
          <strong>{{ t('docDocsGuidesFilelocking.nextMultiAgentTitle') }}</strong>
          <span>{{ t('docDocsGuidesFilelocking.nextMultiAgentDesc') }} &#8594;</span>
        </router-link>
        <router-link to="/docs/guides/rag-pipeline" class="next-step">
          <strong>{{ t('docDocsGuidesFilelocking.nextRagTitle') }}</strong>
          <span>{{ t('docDocsGuidesFilelocking.nextRagDesc') }} &#8594;</span>
        </router-link>
        <router-link to="/docs/api/tasks" class="next-step">
          <strong>{{ t('docDocsGuidesFilelocking.nextTasksTitle') }}</strong>
          <span>{{ t('docDocsGuidesFilelocking.nextTasksDesc') }} &#8594;</span>
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

// -- Conflicts Batch Check ----------------------------------------------------

const conflictsTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.claudenest.io/api/projects/{project_id}/locks/conflicts \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "paths": [
      "src/checkout.ts",
      "src/stripe.ts",
      "src/cart.ts",
      "src/webhooks.ts"
    ]
  }'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://api.claudenest.io/api/projects/{project_id}/locks/conflicts',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paths: ['src/checkout.ts', 'src/stripe.ts', 'src/cart.ts', 'src/webhooks.ts'],
    }),
  }
);

const { data } = await response.json();
const lockedPaths = data.filter(f => f.is_locked).map(f => f.path);
const availablePaths = data.filter(f => !f.is_locked).map(f => f.path);
console.log('Locked:', lockedPaths);
console.log('Available:', availablePaths);`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$results = Http::withToken($token)
    ->post('https://api.claudenest.io/api/projects/{project_id}/locks/conflicts', [
        'paths' => ['src/checkout.ts', 'src/stripe.ts', 'src/cart.ts', 'src/webhooks.ts'],
    ])['data'];

$locked = array_filter($results, fn($f) => $f['is_locked']);
$available = array_filter($results, fn($f) => !$f['is_locked']);`,
  },
]);

const conflictsResponse = ref(`{
  "success": true,
  "data": [
    {
      "path": "src/checkout.ts",
      "is_locked": true,
      "locked_by": "inst-002",
      "expires_at": "2026-02-15T10:25:00Z"
    },
    {
      "path": "src/stripe.ts",
      "is_locked": false
    },
    {
      "path": "src/cart.ts",
      "is_locked": false
    },
    {
      "path": "src/webhooks.ts",
      "is_locked": true,
      "locked_by": "inst-003",
      "expires_at": "2026-02-15T10:40:00Z"
    }
  ]
}`);

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
