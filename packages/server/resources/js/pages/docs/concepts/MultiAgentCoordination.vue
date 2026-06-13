<template>
  <article class="doc-content">
    <header class="doc-header">
      <span class="badge">{{ $t('docDocsConceptsMultiagentcoordination.badge') }}</span>
      <h1>{{ $t('docDocsConceptsMultiagentcoordination.title') }}</h1>
      <p class="lead">
        {{ $t('docDocsConceptsMultiagentcoordination.lead') }}
      </p>
    </header>

    <!-- 1. Overview -->
    <section id="overview">
      <h2>{{ $t('docDocsConceptsMultiagentcoordination.overviewHeading') }}</h2>
      <p>
        {{ $t('docDocsConceptsMultiagentcoordination.overviewPara1') }}
      </p>
      <p>
        {{ $t('docDocsConceptsMultiagentcoordination.overviewPara2') }}
      </p>

      <div class="pillars-grid">
        <div class="pillar-card">
          <span class="pillar-icon task-icon">T</span>
          <h4>{{ $t('docDocsConceptsMultiagentcoordination.pillarTaskTitle') }}</h4>
          <p>{{ $t('docDocsConceptsMultiagentcoordination.pillarTaskDesc') }}</p>
        </div>
        <div class="pillar-card">
          <span class="pillar-icon lock-icon">L</span>
          <h4>{{ $t('docDocsConceptsMultiagentcoordination.pillarLockTitle') }}</h4>
          <p>{{ $t('docDocsConceptsMultiagentcoordination.pillarLockDesc') }}</p>
        </div>
        <div class="pillar-card">
          <span class="pillar-icon ctx-icon">C</span>
          <h4>{{ $t('docDocsConceptsMultiagentcoordination.pillarCtxTitle') }}</h4>
          <p>{{ $t('docDocsConceptsMultiagentcoordination.pillarCtxDesc') }}</p>
        </div>
      </div>

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>{{ $t('docDocsConceptsMultiagentcoordination.optionalTipTitle') }}</h4>
          <p>
            {{ $t('docDocsConceptsMultiagentcoordination.optionalTipDesc') }}
          </p>
        </div>
      </div>
    </section>

    <!-- 2. Shared Projects -->
    <section id="shared-projects">
      <h2>{{ $t('docDocsConceptsMultiagentcoordination.sharedProjectsHeading') }}</h2>
      <p v-html="$t('docDocsConceptsMultiagentcoordination.sharedProjectsPara1')"></p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.projectMetadataHeading') }}</h3>
      <div class="fields-table">
        <table>
          <thead>
            <tr>
              <th>{{ $t('docDocsConceptsMultiagentcoordination.thField') }}</th>
              <th>{{ $t('docDocsConceptsMultiagentcoordination.thDescription') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>summary</code></td>
              <td>{{ $t('docDocsConceptsMultiagentcoordination.metaSummary') }}</td>
            </tr>
            <tr>
              <td><code>architecture</code></td>
              <td>{{ $t('docDocsConceptsMultiagentcoordination.metaArchitecture') }}</td>
            </tr>
            <tr>
              <td><code>conventions</code></td>
              <td>{{ $t('docDocsConceptsMultiagentcoordination.metaConventions') }}</td>
            </tr>
            <tr>
              <td><code>current_focus</code></td>
              <td>{{ $t('docDocsConceptsMultiagentcoordination.metaCurrentFocus') }}</td>
            </tr>
            <tr>
              <td><code>recent_changes</code></td>
              <td>{{ $t('docDocsConceptsMultiagentcoordination.metaRecentChanges') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.creatingProjectHeading') }}</h3>
      <CodeBlock :code="createProjectCode" language="bash" filename="POST /api/machines/{id}/projects" />

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.updatingContextHeading') }}</h3>
      <p v-html="$t('docDocsConceptsMultiagentcoordination.updatingContextPara')"></p>
      <CodeBlock :code="updateProjectCode" language="bash" filename="PATCH /api/projects/{id}" />
    </section>

    <!-- 3. Claude Instances -->
    <section id="instances">
      <h2>{{ $t('docDocsConceptsMultiagentcoordination.instancesHeading') }}</h2>
      <p v-html="$t('docDocsConceptsMultiagentcoordination.instancesPara1')"></p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.statusLifecycleHeading') }}</h3>
      <div class="lifecycle-diagram">
        <div class="lifecycle-step active-step">
          <span class="step-label">active</span>
          <span class="step-desc">{{ $t('docDocsConceptsMultiagentcoordination.lifecycleActiveDesc') }}</span>
        </div>
        <div class="lifecycle-arrow">→</div>
        <div class="lifecycle-step busy-step">
          <span class="step-label">busy</span>
          <span class="step-desc">{{ $t('docDocsConceptsMultiagentcoordination.lifecycleBusyDesc') }}</span>
        </div>
        <div class="lifecycle-arrow">→</div>
        <div class="lifecycle-step idle-step">
          <span class="step-label">idle</span>
          <span class="step-desc">{{ $t('docDocsConceptsMultiagentcoordination.lifecycleIdleDesc') }}</span>
        </div>
        <div class="lifecycle-arrow">→</div>
        <div class="lifecycle-step disconnected-step">
          <span class="step-label">disconnected</span>
          <span class="step-desc">{{ $t('docDocsConceptsMultiagentcoordination.lifecycleDisconnectedDesc') }}</span>
        </div>
      </div>

      <p v-html="$t('docDocsConceptsMultiagentcoordination.instancesPara2')"></p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.listingInstancesHeading') }}</h3>
      <CodeBlock :code="listInstancesCode" language="bash" filename="GET /api/projects/{id}/instances" />
      <CodeBlock :code="listInstancesResponse" language="json" :filename="$t('docDocsConceptsMultiagentcoordination.filenameResponse')" />
    </section>

    <!-- 4. Task Coordination -->
    <section id="task-coordination">
      <h2>{{ $t('docDocsConceptsMultiagentcoordination.taskCoordinationHeading') }}</h2>
      <p>
        {{ $t('docDocsConceptsMultiagentcoordination.taskCoordinationPara1') }}
      </p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.creatingTasksHeading') }}</h3>
      <p>
        {{ $t('docDocsConceptsMultiagentcoordination.creatingTasksPara') }}
      </p>
      <CodeBlock :code="createTaskCode" language="bash" filename="POST /api/projects/{id}/tasks" />

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.priorityLevelsHeading') }}</h3>
      <div class="priority-list">
        <div class="priority-item critical">
          <span class="priority-badge">critical</span>
          <p>{{ $t('docDocsConceptsMultiagentcoordination.priorityCritical') }}</p>
        </div>
        <div class="priority-item high">
          <span class="priority-badge">high</span>
          <p>{{ $t('docDocsConceptsMultiagentcoordination.priorityHigh') }}</p>
        </div>
        <div class="priority-item medium">
          <span class="priority-badge">medium</span>
          <p>{{ $t('docDocsConceptsMultiagentcoordination.priorityMedium') }}</p>
        </div>
        <div class="priority-item low">
          <span class="priority-badge">low</span>
          <p>{{ $t('docDocsConceptsMultiagentcoordination.priorityLow') }}</p>
        </div>
      </div>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.atomicClaimingHeading') }}</h3>
      <p v-html="$t('docDocsConceptsMultiagentcoordination.atomicClaimingPara')"></p>
      <CodeBlock :code="claimTaskCode" language="bash" filename="POST /api/tasks/{id}/claim" />
      <CodeBlock :code="claimTaskResponse" language="json" :filename="$t('docDocsConceptsMultiagentcoordination.filenameResponseSuccess')" />

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.taskStatusLifecycleHeading') }}</h3>
      <div class="status-flow">
        <div class="status-node pending-node">pending</div>
        <div class="status-arrow">→</div>
        <div class="status-node inprogress-node">in_progress</div>
        <div class="status-arrow">→</div>
        <div class="status-node review-node">review</div>
        <div class="status-arrow">→</div>
        <div class="status-node done-node">done</div>
      </div>
      <div class="status-branch">
        <div class="branch-from">in_progress</div>
        <div class="branch-arrow">⤵</div>
        <div class="status-node blocked-node">blocked</div>
      </div>

      <p v-html="$t('docDocsConceptsMultiagentcoordination.taskStatusPara')"></p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.taskDependenciesHeading') }}</h3>
      <p v-html="$t('docDocsConceptsMultiagentcoordination.taskDependenciesPara')"></p>
      <CodeBlock :code="nextAvailableCode" language="bash" filename="GET /api/projects/{id}/tasks/next-available" />

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.completingTasksHeading') }}</h3>
      <CodeBlock :code="completeTaskCode" language="bash" filename="POST /api/tasks/{id}/complete" />
      <p>
        {{ $t('docDocsConceptsMultiagentcoordination.completingTasksPara') }}
      </p>
      <CodeBlock :code="releaseTaskCode" language="bash" filename="POST /api/tasks/{id}/release" />
    </section>

    <!-- 5. File Locking -->
    <section id="file-locking">
      <h2>{{ $t('docDocsConceptsMultiagentcoordination.fileLockingHeading') }}</h2>
      <p v-html="$t('docDocsConceptsMultiagentcoordination.fileLockingPara1')"></p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.acquiringLockHeading') }}</h3>
      <CodeBlock :code="lockFileCode" language="bash" filename="POST /api/projects/{id}/locks" />
      <CodeBlock :code="lockFileResponse" language="json" :filename="$t('docDocsConceptsMultiagentcoordination.filenameResponse')" />

      <p v-html="$t('docDocsConceptsMultiagentcoordination.lockExpiryPara')"></p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.checkingLockHeading') }}</h3>
      <CodeBlock :code="checkLockCode" language="bash" filename="POST /api/projects/{id}/locks/check" />

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.bulkLockingHeading') }}</h3>
      <p>
        {{ $t('docDocsConceptsMultiagentcoordination.bulkLockingPara') }}
      </p>
      <CodeBlock :code="bulkLockCode" language="bash" filename="POST /api/projects/{id}/locks/bulk" />

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.releasingLocksHeading') }}</h3>
      <p>
        {{ $t('docDocsConceptsMultiagentcoordination.releasingLocksPara') }}
      </p>
      <CodeBlock :code="releaseLockCode" language="bash" filename="POST /api/projects/{id}/locks/release" />

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.forceReleaseHeading') }}</h3>
      <p>
        {{ $t('docDocsConceptsMultiagentcoordination.forceReleasePara') }}
      </p>
      <CodeBlock :code="forceReleaseCode" language="bash" filename="POST /api/projects/{id}/locks/force-release" />

      <div class="tip tip-warning">
        <span class="tip-icon warning-icon">!</span>
        <div>
          <h4>{{ $t('docDocsConceptsMultiagentcoordination.lockTipTitle') }}</h4>
          <p v-html="$t('docDocsConceptsMultiagentcoordination.lockTipDesc')"></p>
        </div>
      </div>
    </section>

    <!-- 6. Context Sharing -->
    <section id="context-sharing">
      <h2>{{ $t('docDocsConceptsMultiagentcoordination.contextSharingHeading') }}</h2>
      <p v-html="$t('docDocsConceptsMultiagentcoordination.contextSharingPara1')"></p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.addingChunkHeading') }}</h3>
      <CodeBlock :code="addChunkCode" language="bash" filename="POST /api/projects/{id}/context/chunks" />

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.queryingContextHeading') }}</h3>
      <p>
        {{ $t('docDocsConceptsMultiagentcoordination.queryingContextPara') }}
      </p>
      <CodeBlock :code="queryContextCode" language="bash" filename="POST /api/projects/{id}/context/query" />
      <CodeBlock :code="queryContextResponse" language="json" :filename="$t('docDocsConceptsMultiagentcoordination.filenameResponse')" />

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.chunkTypesHeading') }}</h3>
      <div class="fields-table">
        <table>
          <thead>
            <tr>
              <th>{{ $t('docDocsConceptsMultiagentcoordination.thType') }}</th>
              <th>{{ $t('docDocsConceptsMultiagentcoordination.thWhenToUse') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>task_completion</code></td>
              <td>{{ $t('docDocsConceptsMultiagentcoordination.chunkTaskCompletion') }}</td>
            </tr>
            <tr>
              <td><code>decision</code></td>
              <td>{{ $t('docDocsConceptsMultiagentcoordination.chunkDecision') }}</td>
            </tr>
            <tr>
              <td><code>discovery</code></td>
              <td>{{ $t('docDocsConceptsMultiagentcoordination.chunkDiscovery') }}</td>
            </tr>
            <tr>
              <td><code>blocker</code></td>
              <td>{{ $t('docDocsConceptsMultiagentcoordination.chunkBlocker') }}</td>
            </tr>
            <tr>
              <td><code>note</code></td>
              <td>{{ $t('docDocsConceptsMultiagentcoordination.chunkNote') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>{{ $t('docDocsConceptsMultiagentcoordination.importanceTipTitle') }}</h4>
          <p v-html="$t('docDocsConceptsMultiagentcoordination.importanceTipDesc')"></p>
        </div>
      </div>
    </section>

    <!-- 7. Real-Time Communication -->
    <section id="realtime">
      <h2>{{ $t('docDocsConceptsMultiagentcoordination.realtimeHeading') }}</h2>
      <p v-html="$t('docDocsConceptsMultiagentcoordination.realtimePara1')"></p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.coordinationEventsHeading') }}</h3>
      <div class="events-list">
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">task.created</code>
            <span class="event-channel">projects.{id}</span>
          </div>
          <p v-html="$t('docDocsConceptsMultiagentcoordination.eventTaskCreated')"></p>
        </div>
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">task.claimed</code>
            <span class="event-channel">projects.{id}</span>
          </div>
          <p>{{ $t('docDocsConceptsMultiagentcoordination.eventTaskClaimed') }}</p>
        </div>
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">task.completed</code>
            <span class="event-channel">projects.{id}</span>
          </div>
          <p>{{ $t('docDocsConceptsMultiagentcoordination.eventTaskCompleted') }}</p>
        </div>
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">task.released</code>
            <span class="event-channel">projects.{id}</span>
          </div>
          <p v-html="$t('docDocsConceptsMultiagentcoordination.eventTaskReleased')"></p>
        </div>
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">file.locked</code>
            <span class="event-channel">projects.{id}</span>
          </div>
          <p v-html="$t('docDocsConceptsMultiagentcoordination.eventFileLocked')"></p>
        </div>
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">file.unlocked</code>
            <span class="event-channel">projects.{id}</span>
          </div>
          <p>{{ $t('docDocsConceptsMultiagentcoordination.eventFileUnlocked') }}</p>
        </div>
      </div>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.interAgentMessagingHeading') }}</h3>
      <p v-html="$t('docDocsConceptsMultiagentcoordination.interAgentMessagingPara')"></p>
      <CodeBlock :code="broadcastCode" language="bash" filename="POST /api/projects/{id}/broadcast" />

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.websocketSubscriptionHeading') }}</h3>
      <CodeBlock :code="subscribeCode" language="typescript" :filename="$t('docDocsConceptsMultiagentcoordination.filenameSubscribing')" />
    </section>

    <!-- 8. Coordination Patterns -->
    <section id="patterns">
      <h2>{{ $t('docDocsConceptsMultiagentcoordination.patternsHeading') }}</h2>
      <p>
        {{ $t('docDocsConceptsMultiagentcoordination.patternsPara1') }}
      </p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.leaderWorkerHeading') }}</h3>
      <p v-html="$t('docDocsConceptsMultiagentcoordination.leaderWorkerPara')"></p>
      <CodeBlock :code="leaderWorkerCode" language="typescript" :filename="$t('docDocsConceptsMultiagentcoordination.filenameLeaderBootstrap')" />

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.parallelTasksHeading') }}</h3>
      <p v-html="$t('docDocsConceptsMultiagentcoordination.parallelTasksPara')"></p>
      <CodeBlock :code="parallelLoopCode" language="typescript" :filename="$t('docDocsConceptsMultiagentcoordination.filenameWorkerLoop')" />

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.sequentialPipelineHeading') }}</h3>
      <p v-html="$t('docDocsConceptsMultiagentcoordination.sequentialPipelinePara')"></p>
      <CodeBlock :code="pipelineCode" language="bash" :filename="$t('docDocsConceptsMultiagentcoordination.filenameDependencyChain')" />
    </section>

    <!-- 9. Conflict Resolution -->
    <section id="conflict-resolution">
      <h2>{{ $t('docDocsConceptsMultiagentcoordination.conflictResolutionHeading') }}</h2>
      <p>
        {{ $t('docDocsConceptsMultiagentcoordination.conflictResolutionPara1') }}
      </p>

      <div class="conflict-list">
        <div class="conflict-card">
          <h4>{{ $t('docDocsConceptsMultiagentcoordination.conflict1Title') }}</h4>
          <p v-html="$t('docDocsConceptsMultiagentcoordination.conflict1Desc')"></p>
        </div>
        <div class="conflict-card">
          <h4>{{ $t('docDocsConceptsMultiagentcoordination.conflict2Title') }}</h4>
          <p v-html="$t('docDocsConceptsMultiagentcoordination.conflict2Desc')"></p>
        </div>
        <div class="conflict-card">
          <h4>{{ $t('docDocsConceptsMultiagentcoordination.conflict3Title') }}</h4>
          <p v-html="$t('docDocsConceptsMultiagentcoordination.conflict3Desc')"></p>
        </div>
        <div class="conflict-card">
          <h4>{{ $t('docDocsConceptsMultiagentcoordination.conflict4Title') }}</h4>
          <p v-html="$t('docDocsConceptsMultiagentcoordination.conflict4Desc')"></p>
        </div>
        <div class="conflict-card">
          <h4 v-html="$t('docDocsConceptsMultiagentcoordination.conflict5Title')"></h4>
          <p v-html="$t('docDocsConceptsMultiagentcoordination.conflict5Desc')"></p>
        </div>
      </div>

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>{{ $t('docDocsConceptsMultiagentcoordination.observabilityTipTitle') }}</h4>
          <p v-html="$t('docDocsConceptsMultiagentcoordination.observabilityTipDesc')"></p>
        </div>
      </div>

      <h2>{{ $t('docDocsConceptsMultiagentcoordination.autonomousHeading') }}</h2>
      <p>{{ $t('docDocsConceptsMultiagentcoordination.autonomousPara') }}</p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.sandboxHeading') }}</h3>
      <p v-html="$t('docDocsConceptsMultiagentcoordination.sandboxPara')"></p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.freshContextHeading') }}</h3>
      <p>{{ $t('docDocsConceptsMultiagentcoordination.freshContextPara') }}</p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.resilienceHeading') }}</h3>
      <p>{{ $t('docDocsConceptsMultiagentcoordination.resiliencePara') }}</p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.sprintPrHeading') }}</h3>
      <p>{{ $t('docDocsConceptsMultiagentcoordination.sprintPrPara') }}</p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.decompositionHeading') }}</h3>
      <p>{{ $t('docDocsConceptsMultiagentcoordination.decompositionPara') }}</p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.livingContextHeading') }}</h3>
      <p>{{ $t('docDocsConceptsMultiagentcoordination.livingContextPara') }}</p>

      <h3>{{ $t('docDocsConceptsMultiagentcoordination.gitTrackingHeading') }}</h3>
      <p v-html="$t('docDocsConceptsMultiagentcoordination.gitTrackingPara')"></p>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';

// ── Shared Projects ──────────────────────────────────────────────────────────

const createProjectCode = ref(`curl -X POST https://your-server/api/machines/{machineId}/projects \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "my-app",
    "project_path": "/home/dev/projects/my-app",
    "summary": "E-commerce platform built with Laravel and Vue.js",
    "architecture": "Monolithic Laravel app, Vue SPA served from same origin, PostgreSQL + Redis",
    "conventions": "PSR-12 PHP, Composition API Vue, UUID primary keys, snake_case columns",
    "current_focus": "Sprint 4 – checkout flow and payment integration"
  }'`);

const updateProjectCode = ref(`curl -X PATCH https://your-server/api/projects/{projectId} \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "current_focus": "Sprint 5 – notifications and email templates",
    "recent_changes": "Completed Stripe integration (PR #142), refactored CartService"
  }'`);

// ── Instances ────────────────────────────────────────────────────────────────

const listInstancesCode = ref(`curl https://your-server/api/projects/{projectId}/instances \\
  -H "Authorization: Bearer <token>"`);

const listInstancesResponse = ref(`{
  "success": true,
  "data": [
    {
      "id": "dev-macbook-12345",
      "status": "busy",
      "current_task_id": "550e8400-e29b-41d4-a716-446655440099",
      "context_tokens": 42800,
      "max_context_tokens": 200000,
      "tasks_completed": 3,
      "connected_at": "2026-02-17T09:00:00Z",
      "last_activity_at": "2026-02-17T10:15:33Z"
    },
    {
      "id": "ci-runner-67890",
      "status": "idle",
      "current_task_id": null,
      "context_tokens": 8200,
      "max_context_tokens": 200000,
      "tasks_completed": 5,
      "connected_at": "2026-02-17T09:05:00Z",
      "last_activity_at": "2026-02-17T10:14:01Z"
    }
  ]
}`);

// ── Task Coordination ────────────────────────────────────────────────────────

const createTaskCode = ref(`curl -X POST https://your-server/api/projects/{projectId}/tasks \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Implement payment webhook handler",
    "description": "Create a POST /webhooks/stripe endpoint that processes payment.succeeded and payment.failed events. Update order status accordingly. Write feature tests.",
    "priority": "high",
    "files": ["app/Http/Controllers/WebhookController.php", "routes/api.php"],
    "dependencies": ["550e8400-e29b-41d4-a716-446655440010"],
    "estimated_tokens": 30000
  }'`);

const claimTaskCode = ref(`curl -X POST https://your-server/api/tasks/{taskId}/claim \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "instance_id": "dev-macbook-12345"
  }'`);

const claimTaskResponse = ref(`{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440099",
    "title": "Implement payment webhook handler",
    "status": "in_progress",
    "assigned_to": "dev-macbook-12345",
    "claimed_at": "2026-02-17T10:15:00Z",
    "priority": "high",
    "files": ["app/Http/Controllers/WebhookController.php", "routes/api.php"]
  }
}`);

const nextAvailableCode = ref(`# Returns the highest-priority task with no unresolved dependencies
curl "https://your-server/api/projects/{projectId}/tasks/next-available?instance_id=dev-macbook-12345" \\
  -H "Authorization: Bearer <token>"`);

const completeTaskCode = ref(`curl -X POST https://your-server/api/tasks/{taskId}/complete \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "instance_id": "dev-macbook-12345",
    "completion_summary": "Implemented Stripe webhook handler. Handles payment.succeeded (sets order to paid) and payment.failed (sets order to failed). Added signature validation middleware. 12 feature tests passing.",
    "files_modified": [
      "app/Http/Controllers/WebhookController.php",
      "app/Http/Middleware/VerifyStripeSignature.php",
      "routes/api.php",
      "tests/Feature/WebhookTest.php"
    ]
  }'`);

const releaseTaskCode = ref(`curl -X POST https://your-server/api/tasks/{taskId}/release \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "instance_id": "dev-macbook-12345",
    "reason": "Context window exhausted after 180k tokens. Partial work committed to branch feat/webhooks."
  }'`);

// ── File Locking ─────────────────────────────────────────────────────────────

const lockFileCode = ref(`curl -X POST https://your-server/api/projects/{projectId}/locks \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "path": "app/Http/Controllers/WebhookController.php",
    "locked_by": "dev-macbook-12345",
    "reason": "Implementing Stripe webhook handler for task task-99",
    "expires_at": "2026-02-17T11:00:00Z"
  }'`);

const lockFileResponse = ref(`{
  "success": true,
  "data": {
    "id": "lock-abc-123",
    "path": "app/Http/Controllers/WebhookController.php",
    "locked_by": "dev-macbook-12345",
    "reason": "Implementing Stripe webhook handler for task task-99",
    "locked_at": "2026-02-17T10:15:01Z",
    "expires_at": "2026-02-17T11:00:00Z"
  }
}`);

const checkLockCode = ref(`curl -X POST https://your-server/api/projects/{projectId}/locks/check \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "path": "app/Http/Controllers/WebhookController.php"
  }'`);

const bulkLockCode = ref(`curl -X POST https://your-server/api/projects/{projectId}/locks/bulk \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "paths": [
      "app/Services/PaymentService.php",
      "app/Models/Order.php",
      "database/migrations/2026_02_17_add_payment_fields.php"
    ],
    "locked_by": "dev-macbook-12345",
    "reason": "Payment service refactor — touching model, service, and migration together"
  }'`);

const releaseLockCode = ref(`curl -X POST https://your-server/api/projects/{projectId}/locks/release \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "path": "app/Http/Controllers/WebhookController.php",
    "instance_id": "dev-macbook-12345"
  }'`);

const forceReleaseCode = ref(`# Only use when the holding instance is confirmed dead
curl -X POST https://your-server/api/projects/{projectId}/locks/force-release \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "path": "app/Http/Controllers/WebhookController.php"
  }'`);

// ── Context Sharing ──────────────────────────────────────────────────────────

const addChunkCode = ref(`curl -X POST https://your-server/api/projects/{projectId}/context/chunks \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Implemented Stripe webhook handler using signature-based validation via VerifyStripeSignature middleware. Order status transitions: payment.succeeded → paid, payment.failed → failed. Handler lives in WebhookController@handleStripe.",
    "type": "task_completion",
    "instance_id": "dev-macbook-12345",
    "task_id": "550e8400-e29b-41d4-a716-446655440099",
    "files": ["app/Http/Controllers/WebhookController.php", "app/Http/Middleware/VerifyStripeSignature.php"],
    "importance_score": 0.85,
    "expires_at": "2026-03-17T00:00:00Z"
  }'`);

const queryContextCode = ref(`curl -X POST https://your-server/api/projects/{projectId}/context/query \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "How does order status change after a Stripe payment event?",
    "limit": 5
  }'`);

const queryContextResponse = ref(`{
  "success": true,
  "data": {
    "chunks": [
      {
        "id": "chunk-xyz",
        "content": "Implemented Stripe webhook handler using signature-based validation...",
        "type": "task_completion",
        "similarity": 0.94,
        "instance_id": "dev-macbook-12345",
        "files": ["app/Http/Controllers/WebhookController.php"],
        "importance_score": 0.85,
        "created_at": "2026-02-17T10:45:00Z"
      }
    ],
    "query": "How does order status change after a Stripe payment event?",
    "total_found": 1
  }
}`);

// ── Real-Time ────────────────────────────────────────────────────────────────

const broadcastCode = ref(`curl -X POST https://your-server/api/projects/{projectId}/broadcast \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "orchestrator.tasks_ready",
    "payload": {
      "task_count": 8,
      "message": "Task board populated. All workers may begin claiming."
    }
  }'`);

const subscribeCode = ref(`import Echo from 'laravel-echo';

// All agents subscribe to the shared project channel
echo.private(\`projects.\${projectId}\`)
  .listen('.task.created', (event) => {
    console.log('New task available:', event.task_id);
    // Check if we can claim it
    claimNextAvailableTask();
  })
  .listen('.task.claimed', (event) => {
    console.log(\`Task \${event.task_id} claimed by \${event.instance_id}\`);
    // Remove from local task list
    removeFromLocalQueue(event.task_id);
  })
  .listen('.task.completed', (event) => {
    console.log(\`Task \${event.task_id} done by \${event.instance_id}\`);
    // Unblocked tasks may now be available
    claimNextAvailableTask();
  })
  .listen('.file.locked', (event) => {
    console.log(\`File locked: \${event.path} by \${event.locked_by}\`);
    lockedPaths.add(event.path);
  })
  .listen('.file.unlocked', (event) => {
    console.log(\`File unlocked: \${event.path}\`);
    lockedPaths.delete(event.path);
    // Retry any deferred work on this path
    retryDeferredWork(event.path);
  });`);

// ── Patterns ─────────────────────────────────────────────────────────────────

const leaderWorkerCode = ref(`// Leader instance: decompose goal, create tasks, then join as worker
async function runAsLeader(projectId: string, goal: string) {
  // 1. Analyse the goal and produce a task list
  const tasks = await decompose(goal);

  // 2. Push all tasks to the server in one pass
  const created = await Promise.all(
    tasks.map((t) =>
      api.post(\`/projects/\${projectId}/tasks\`, {
        title: t.title,
        description: t.description,
        priority: t.priority,
        dependencies: t.dependencies,
      })
    )
  );

  console.log(\`Created \${created.length} tasks. Switching to worker mode.\`);

  // 3. Leader becomes a worker
  await runAsWorker(projectId);
}

async function runAsWorker(projectId: string) {
  while (true) {
    const res = await api.get(
      \`/projects/\${projectId}/tasks/next-available?instance_id=\${instanceId}\`
    );
    const task = res.data.data;
    if (!task) break; // No more work

    await api.post(\`/tasks/\${task.id}/claim\`, { instance_id: instanceId });
    await executeTask(task);
    await api.post(\`/tasks/\${task.id}/complete\`, {
      instance_id: instanceId,
      completion_summary: generateSummary(task),
      files_modified: getModifiedFiles(),
    });
  }
}`);

const parallelLoopCode = ref(`// Each worker runs this loop independently — no coordination needed beyond the API
async function workerLoop(projectId: string, instanceId: string) {
  while (true) {
    // Ask the server for the next claimable task
    const res = await api.get(
      \`/projects/\${projectId}/tasks/next-available?instance_id=\${instanceId}\`
    );

    if (!res.data.data) {
      console.log('No tasks available, waiting for task.created event...');
      await waitForTaskCreatedEvent(projectId);
      continue;
    }

    const task = res.data.data;

    // Claim atomically — another worker may have beaten us to it
    try {
      await api.post(\`/tasks/\${task.id}/claim\`, { instance_id: instanceId });
    } catch (err: any) {
      if (err.response?.status === 409) continue; // Lost the race, try next
      throw err;
    }

    // Lock the files this task will touch
    await api.post(\`/projects/\${projectId}/locks/bulk\`, {
      paths: task.files,
      locked_by: instanceId,
      reason: \`Working on task \${task.id}\`,
    });

    await executeTask(task);

    // Release locks and complete task
    await api.post(\`/projects/\${projectId}/locks/release-by-instance\`, { instance_id: instanceId });
    await api.post(\`/tasks/\${task.id}/complete\`, {
      instance_id: instanceId,
      completion_summary: generateSummary(task),
      files_modified: getModifiedFiles(),
    });
  }
}`);

const pipelineCode = ref(`# Create a four-stage pipeline: design → implement → test → document

# Stage 1 — no dependencies
curl -X POST .../tasks -d '{
  "title": "Design API contract for notifications module",
  "priority": "high"
}' | jq -r '.data.id'   # → TASK_DESIGN_ID

# Stage 2 — depends on stage 1
curl -X POST .../tasks -d '{
  "title": "Implement NotificationService",
  "priority": "high",
  "dependencies": ["'"$TASK_DESIGN_ID"'"]
}' | jq -r '.data.id'   # → TASK_IMPL_ID

# Stage 3 — depends on stage 2
curl -X POST .../tasks -d '{
  "title": "Write feature tests for NotificationService",
  "priority": "medium",
  "dependencies": ["'"$TASK_IMPL_ID"'"]
}' | jq -r '.data.id'   # → TASK_TEST_ID

# Stage 4 — depends on stage 3
curl -X POST .../tasks -d '{
  "title": "Document notifications API in OpenAPI spec",
  "priority": "low",
  "dependencies": ["'"$TASK_TEST_ID"'"]
}'`);
</script>

<style scoped>
.doc-content {
  max-width: 768px;
}

/* ── Header ──────────────────────────────────────────────────────────────── */

.doc-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent-purple, #a855f7);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 25%, transparent);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  margin-bottom: 1rem;
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

/* ── Typography ──────────────────────────────────────────────────────────── */

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

h4 {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 0.4rem;
  color: var(--text-primary);
}

p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 1rem;
}

ol {
  color: var(--text-secondary);
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

strong {
  color: var(--text-primary);
}

em {
  color: var(--text-primary);
  font-style: italic;
}

a {
  color: var(--accent-purple, #a855f7);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875em;
  background: color-mix(in srgb, var(--text-primary) 8%, transparent);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
}

/* ── Pillars Grid ────────────────────────────────────────────────────────── */

.pillars-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.pillar-card {
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pillar-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
}

.task-icon {
  color: var(--accent-purple, #a855f7);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
}

.lock-icon {
  color: #f59e0b;
  background: color-mix(in srgb, #f59e0b 15%, transparent);
}

.ctx-icon {
  color: var(--accent-cyan, #22d3ee);
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 15%, transparent);
}

.pillar-card h4 {
  margin: 0;
  font-size: 0.95rem;
}

.pillar-card p {
  font-size: 0.875rem;
  margin: 0;
  color: var(--text-muted);
}

/* ── Tables ──────────────────────────────────────────────────────────────── */

.fields-table {
  margin: 1.25rem 0;
  overflow-x: auto;
}

.fields-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.fields-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  background: color-mix(in srgb, var(--text-primary) 4%, transparent);
  border-bottom: 2px solid var(--border-color, var(--border));
  color: var(--text-primary);
  font-weight: 600;
}

.fields-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color, var(--border));
  color: var(--text-secondary);
}

/* ── Instance Lifecycle Diagram ──────────────────────────────────────────── */

.lifecycle-diagram {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 1.25rem 0;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
}

.lifecycle-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  min-width: 110px;
  text-align: center;
}

.step-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 600;
}

.step-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.active-step {
  background: color-mix(in srgb, #22c55e 10%, transparent);
  border: 1px solid color-mix(in srgb, #22c55e 30%, transparent);
}
.active-step .step-label { color: #22c55e; }

.busy-step {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
}
.busy-step .step-label { color: var(--accent-purple, #a855f7); }

.idle-step {
  background: color-mix(in srgb, #f59e0b 10%, transparent);
  border: 1px solid color-mix(in srgb, #f59e0b 30%, transparent);
}
.idle-step .step-label { color: #f59e0b; }

.disconnected-step {
  background: color-mix(in srgb, var(--text-muted, #6b7280) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--text-muted, #6b7280) 30%, transparent);
}
.disconnected-step .step-label { color: var(--text-muted); }

.lifecycle-arrow {
  color: var(--text-muted);
  font-size: 1.1rem;
}

/* ── Priority List ───────────────────────────────────────────────────────── */

.priority-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
}

.priority-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  border-radius: 10px;
  border: 1px solid var(--border-color, var(--border));
}

.priority-item p {
  margin: 0;
  font-size: 0.9rem;
}

.priority-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  flex-shrink: 0;
  min-width: 70px;
  text-align: center;
}

.critical .priority-badge {
  color: #ef4444;
  background: color-mix(in srgb, #ef4444 15%, transparent);
}
.high .priority-badge {
  color: #f59e0b;
  background: color-mix(in srgb, #f59e0b 15%, transparent);
}
.medium .priority-badge {
  color: var(--accent-purple, #a855f7);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
}
.low .priority-badge {
  color: var(--text-muted);
  background: color-mix(in srgb, var(--text-muted, #6b7280) 15%, transparent);
}

/* ── Task Status Flow ────────────────────────────────────────────────────── */

.status-flow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 1.25rem 0 0.5rem;
}

.status-branch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  padding-left: 0.5rem;
}

.branch-from {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.branch-arrow {
  font-size: 1rem;
  color: var(--text-muted);
}

.status-node {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.8rem;
  border-radius: 6px;
  border: 1px solid var(--border-color, var(--border));
}

.status-arrow {
  color: var(--text-muted);
  font-size: 1.1rem;
}

.pending-node   { color: var(--text-muted); background: color-mix(in srgb, var(--text-muted, #6b7280) 10%, transparent); border-color: color-mix(in srgb, var(--text-muted, #6b7280) 25%, transparent); }
.inprogress-node { color: var(--accent-purple, #a855f7); background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent); border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 25%, transparent); }
.review-node    { color: #f59e0b; background: color-mix(in srgb, #f59e0b 10%, transparent); border-color: color-mix(in srgb, #f59e0b 25%, transparent); }
.done-node      { color: #22c55e; background: color-mix(in srgb, #22c55e 10%, transparent); border-color: color-mix(in srgb, #22c55e 25%, transparent); }
.blocked-node   { color: #ef4444; background: color-mix(in srgb, #ef4444 10%, transparent); border-color: color-mix(in srgb, #ef4444 25%, transparent); }

/* ── Events List ─────────────────────────────────────────────────────────── */

.events-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  margin: 1rem 0;
}

.event-card {
  padding: 1.1rem 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 10px;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.event-name {
  font-size: 0.9rem;
  font-weight: 600;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
  color: var(--accent-purple, #a855f7);
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
}

.event-channel {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
}

.event-card p {
  font-size: 0.9rem;
  margin: 0;
}

/* ── Conflict Cards ──────────────────────────────────────────────────────── */

.conflict-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem 0;
}

.conflict-card {
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
}

.conflict-card h4 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.conflict-card p {
  margin: 0;
  font-size: 0.9rem;
}

/* ── Tip Box ─────────────────────────────────────────────────────────────── */

.tip {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-radius: 12px;
  margin: 1.5rem 0;
}

.tip-warning {
  background: color-mix(in srgb, #f59e0b 5%, transparent);
  border-color: color-mix(in srgb, #f59e0b 25%, transparent);
}

.tip-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  color: var(--accent-purple, #a855f7);
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.warning-icon {
  background: color-mix(in srgb, #f59e0b 20%, transparent);
  color: #f59e0b;
}

.tip h4 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.tip p {
  margin: 0;
  font-size: 0.9rem;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }

  .pillars-grid {
    grid-template-columns: 1fr;
  }

  .lifecycle-diagram {
    flex-direction: column;
    align-items: flex-start;
  }

  .lifecycle-arrow {
    transform: rotate(90deg);
  }

  .status-flow {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
