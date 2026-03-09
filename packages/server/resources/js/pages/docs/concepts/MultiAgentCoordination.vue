<template>
  <article class="doc-content">
    <header class="doc-header">
      <span class="badge">Concepts</span>
      <h1>Multi-Agent Coordination</h1>
      <p class="lead">
        How multiple Claude Code instances collaborate on shared projects through ClaudeNest's
        task distribution, file locking, and vector-powered context sharing.
      </p>
    </header>

    <!-- 1. Overview -->
    <section id="overview">
      <h2>Why Multi-Agent?</h2>
      <p>
        Complex software projects benefit from parallelism. Rather than a single Claude Code
        instance working through a long queue of tasks sequentially, ClaudeNest lets you run
        several instances simultaneously — each focused on an independent slice of work.
      </p>
      <p>
        Concurrency introduces coordination problems: two agents must not edit the same file
        at the same time, and each agent needs to understand what the others have already done.
        ClaudeNest solves both problems with a centralized coordination layer built on three
        pillars:
      </p>

      <div class="pillars-grid">
        <div class="pillar-card">
          <span class="pillar-icon task-icon">T</span>
          <h4>Task Coordination</h4>
          <p>Atomic task claiming ensures every unit of work is picked up by exactly one agent.</p>
        </div>
        <div class="pillar-card">
          <span class="pillar-icon lock-icon">L</span>
          <h4>File Locking</h4>
          <p>Pessimistic locking prevents simultaneous edits to the same file or directory.</p>
        </div>
        <div class="pillar-card">
          <span class="pillar-icon ctx-icon">C</span>
          <h4>Context Sharing</h4>
          <p>RAG-powered context chunks let every instance learn from what others have done.</p>
        </div>
      </div>

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>Fully Optional</h4>
          <p>
            Multi-agent coordination is a layer on top of ClaudeNest's core session management.
            A single agent with no shared project works perfectly for everyday use.
          </p>
        </div>
      </div>
    </section>

    <!-- 2. Shared Projects -->
    <section id="shared-projects">
      <h2>Shared Projects</h2>
      <p>
        A <strong>shared project</strong> is the central record that links all coordination
        primitives together: instances, tasks, context chunks, and file locks all belong to a
        project. It also stores high-level metadata that every agent can read before starting work.
      </p>

      <h3>Project Metadata</h3>
      <div class="fields-table">
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>summary</code></td>
              <td>One-paragraph plain-English description of the codebase</td>
            </tr>
            <tr>
              <td><code>architecture</code></td>
              <td>Key architectural decisions, patterns, and component relationships</td>
            </tr>
            <tr>
              <td><code>conventions</code></td>
              <td>Coding style, naming conventions, and mandatory patterns</td>
            </tr>
            <tr>
              <td><code>current_focus</code></td>
              <td>The active sprint or goal (updated by team leads or orchestrators)</td>
            </tr>
            <tr>
              <td><code>recent_changes</code></td>
              <td>Summary of the last significant changes made to the codebase</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Creating a Project</h3>
      <CodeBlock :code="createProjectCode" language="bash" filename="POST /api/machines/{id}/projects" />

      <h3>Updating the Shared Context</h3>
      <p>
        Keep the project metadata current so new instances start with accurate information.
        Agents should update <code>current_focus</code> and <code>recent_changes</code> after
        completing significant work.
      </p>
      <CodeBlock :code="updateProjectCode" language="bash" filename="PATCH /api/projects/{id}" />
    </section>

    <!-- 3. Claude Instances -->
    <section id="instances">
      <h2>Claude Instances</h2>
      <p>
        Each running Claude Code process that connects to a shared project is registered as a
        <strong>Claude instance</strong>. Instances are identified by a string ID (typically
        <code>machine-hostname-pid</code>) and expose their status, current task, and token
        consumption via the API.
      </p>

      <h3>Status Lifecycle</h3>
      <div class="lifecycle-diagram">
        <div class="lifecycle-step active-step">
          <span class="step-label">active</span>
          <span class="step-desc">Connected and ready</span>
        </div>
        <div class="lifecycle-arrow">→</div>
        <div class="lifecycle-step busy-step">
          <span class="step-label">busy</span>
          <span class="step-desc">Working on a task</span>
        </div>
        <div class="lifecycle-arrow">→</div>
        <div class="lifecycle-step idle-step">
          <span class="step-label">idle</span>
          <span class="step-desc">Task done, waiting</span>
        </div>
        <div class="lifecycle-arrow">→</div>
        <div class="lifecycle-step disconnected-step">
          <span class="step-label">disconnected</span>
          <span class="step-desc">WebSocket closed</span>
        </div>
      </div>

      <p>
        The server tracks <code>last_activity_at</code> for each instance. When an agent
        disconnects, the server automatically releases all file locks held by that instance
        and marks claimed tasks as <code>pending</code> again so other instances can pick them up.
      </p>

      <h3>Listing Instances on a Project</h3>
      <CodeBlock :code="listInstancesCode" language="bash" filename="GET /api/projects/{id}/instances" />
      <CodeBlock :code="listInstancesResponse" language="json" filename="Response" />
    </section>

    <!-- 4. Task Coordination -->
    <section id="task-coordination">
      <h2>Task Coordination</h2>
      <p>
        Tasks are the primary unit of work in a multi-agent project. They describe a discrete,
        completable piece of work that a single agent can execute independently. The claiming
        mechanism is atomic — only one instance can ever hold a given task at the same time.
      </p>

      <h3>Creating Tasks</h3>
      <p>
        Tasks are created with a priority level and an optional list of dependencies on other
        task IDs. An agent (or an orchestrating script) typically creates all tasks upfront
        before any instances start claiming work.
      </p>
      <CodeBlock :code="createTaskCode" language="bash" filename="POST /api/projects/{id}/tasks" />

      <h3>Priority Levels</h3>
      <div class="priority-list">
        <div class="priority-item critical">
          <span class="priority-badge">critical</span>
          <p>Blocking tasks — must be resolved before any other work can proceed.</p>
        </div>
        <div class="priority-item high">
          <span class="priority-badge">high</span>
          <p>Important tasks that unblock multiple downstream items.</p>
        </div>
        <div class="priority-item medium">
          <span class="priority-badge">medium</span>
          <p>Standard implementation tasks with no special urgency.</p>
        </div>
        <div class="priority-item low">
          <span class="priority-badge">low</span>
          <p>Nice-to-have improvements, docs, or minor refactors.</p>
        </div>
      </div>

      <h3>Atomic Claiming — Preventing Race Conditions</h3>
      <p>
        When two agents call <code>POST /api/tasks/{id}/claim</code> simultaneously, the server
        uses a database-level atomic update (compare-and-swap on <code>status</code>) to guarantee
        only one succeeds. The losing agent receives a <code>409 Conflict</code> and should
        request the next available task instead.
      </p>
      <CodeBlock :code="claimTaskCode" language="bash" filename="POST /api/tasks/{id}/claim" />
      <CodeBlock :code="claimTaskResponse" language="json" filename="Response — success" />

      <h3>Task Status Lifecycle</h3>
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

      <p>
        Tasks transition from <code>pending</code> to <code>in_progress</code> on claim, then to
        <code>review</code> or <code>done</code> on completion. A task can be moved to
        <code>blocked</code> at any point if the agent discovers an unresolvable dependency, with
        a <code>blocked_by</code> reason attached for the human or orchestrator to resolve.
      </p>

      <h3>Task Dependencies</h3>
      <p>
        The <code>dependencies</code> array contains task IDs that must reach <code>done</code>
        status before this task becomes claimable. The <code>next-available</code> endpoint
        automatically filters out tasks with unresolved dependencies, so agents never need to
        check this manually.
      </p>
      <CodeBlock :code="nextAvailableCode" language="bash" filename="GET /api/projects/{id}/tasks/next-available" />

      <h3>Completing and Releasing Tasks</h3>
      <CodeBlock :code="completeTaskCode" language="bash" filename="POST /api/tasks/{id}/complete" />
      <p>
        If an agent cannot finish a task it has claimed (context window exhausted, blocked
        dependency discovered), it should release the task so another instance can attempt it:
      </p>
      <CodeBlock :code="releaseTaskCode" language="bash" filename="POST /api/tasks/{id}/release" />
    </section>

    <!-- 5. File Locking -->
    <section id="file-locking">
      <h2>File Locking</h2>
      <p>
        File locks use <strong>pessimistic locking</strong>: an agent acquires a lock before
        touching a file and holds it for the duration of its edits. Other agents that receive a
        <code>file.locked</code> event know to skip or defer any work on that path.
      </p>

      <h3>Acquiring a Lock</h3>
      <CodeBlock :code="lockFileCode" language="bash" filename="POST /api/projects/{id}/locks" />
      <CodeBlock :code="lockFileResponse" language="json" filename="Response" />

      <p>
        Locks expire after <strong>30 minutes</strong> by default. If an agent anticipates
        longer work, it should extend the lock before it expires to avoid another agent
        claiming the same file.
      </p>

      <h3>Checking Lock Status</h3>
      <CodeBlock :code="checkLockCode" language="bash" filename="POST /api/projects/{id}/locks/check" />

      <h3>Bulk Locking</h3>
      <p>
        For operations that span multiple files (e.g., a refactor touching several modules),
        request all locks in a single atomic call. The server either grants all requested
        locks or returns an error listing which paths are already held.
      </p>
      <CodeBlock :code="bulkLockCode" language="bash" filename="POST /api/projects/{id}/locks/bulk" />

      <h3>Releasing Locks</h3>
      <p>
        Always release locks explicitly when done. On agent disconnect, the server automatically
        releases all locks held by that instance's ID.
      </p>
      <CodeBlock :code="releaseLockCode" language="bash" filename="POST /api/projects/{id}/locks/release" />

      <h3>Force Release (Stuck Locks)</h3>
      <p>
        If an agent crashes and its lock has not expired yet, a project owner can force-release
        a lock. Use with caution — only do this when you are certain the holding instance is
        no longer running.
      </p>
      <CodeBlock :code="forceReleaseCode" language="bash" filename="POST /api/projects/{id}/locks/force-release" />

      <div class="tip tip-warning">
        <span class="tip-icon warning-icon">!</span>
        <div>
          <h4>Lock Expiration vs. Force Release</h4>
          <p>
            Prefer waiting for natural expiration (30 min) over force-releasing. If you need
            shorter expiry periods, set <code>expires_at</code> explicitly when creating the lock.
          </p>
        </div>
      </div>
    </section>

    <!-- 6. Context Sharing -->
    <section id="context-sharing">
      <h2>Context Sharing</h2>
      <p>
        As each instance completes work, it contributes <strong>context chunks</strong> to the
        project's shared knowledge base. Chunks are embedded using
        <code>bge-small-en-v1.5</code> (384-dimensional vectors) and stored in PostgreSQL
        with the <code>pgvector</code> extension. Any instance can then query the knowledge
        base using natural language and receive the most semantically relevant results.
      </p>

      <h3>Adding a Context Chunk</h3>
      <CodeBlock :code="addChunkCode" language="bash" filename="POST /api/projects/{id}/context/chunks" />

      <h3>Querying Shared Context</h3>
      <p>
        Before starting work on a task, an instance should query the shared context to avoid
        duplicating effort or making decisions that contradict prior work.
      </p>
      <CodeBlock :code="queryContextCode" language="bash" filename="POST /api/projects/{id}/context/query" />
      <CodeBlock :code="queryContextResponse" language="json" filename="Response" />

      <h3>Context Chunk Types</h3>
      <div class="fields-table">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>When to Use</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>task_completion</code></td>
              <td>Summary of what was done when a task is marked complete</td>
            </tr>
            <tr>
              <td><code>decision</code></td>
              <td>Architectural or design decisions made during the session</td>
            </tr>
            <tr>
              <td><code>discovery</code></td>
              <td>Findings about existing code structure or behaviour</td>
            </tr>
            <tr>
              <td><code>blocker</code></td>
              <td>Known problems or blockers that other agents should be aware of</td>
            </tr>
            <tr>
              <td><code>note</code></td>
              <td>General observations not tied to a specific task</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>Importance Score</h4>
          <p>
            Set <code>importance_score</code> between <code>0.0</code> and <code>1.0</code>.
            High-importance chunks (decisions, blockers) float to the top of search results
            when relevance scores are close. Default is <code>0.5</code>.
          </p>
        </div>
      </div>
    </section>

    <!-- 7. Real-Time Communication -->
    <section id="realtime">
      <h2>Real-Time Communication</h2>
      <p>
        All coordination events are broadcast over WebSocket to every agent and dashboard client
        subscribed to the <code>projects.{id}</code> private channel. This means agents learn
        about task claims, lock acquisitions, and peer completions within milliseconds — no
        polling required.
      </p>

      <h3>Coordination Events</h3>
      <div class="events-list">
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">task.created</code>
            <span class="event-channel">projects.{id}</span>
          </div>
          <p>A new task was added to the board. Idle agents should call <code>next-available</code> to check if they can claim it.</p>
        </div>
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">task.claimed</code>
            <span class="event-channel">projects.{id}</span>
          </div>
          <p>An instance claimed a task. Other agents can mark that task as unavailable in their local view.</p>
        </div>
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">task.completed</code>
            <span class="event-channel">projects.{id}</span>
          </div>
          <p>A task was completed. Any tasks that depended on it are now eligible for claiming.</p>
        </div>
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">task.released</code>
            <span class="event-channel">projects.{id}</span>
          </div>
          <p>An instance released a task back to the pool. Other instances should check <code>next-available</code> again.</p>
        </div>
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">file.locked</code>
            <span class="event-channel">projects.{id}</span>
          </div>
          <p>A file was locked by an instance. Agents should defer any work on that path until a corresponding <code>file.unlocked</code> event arrives.</p>
        </div>
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">file.unlocked</code>
            <span class="event-channel">projects.{id}</span>
          </div>
          <p>A lock was released. Waiting agents can now acquire the lock and proceed.</p>
        </div>
      </div>

      <h3>Inter-Agent Messaging</h3>
      <p>
        Agents can broadcast arbitrary messages to all other instances on the same project
        using the <code>project.broadcast</code> endpoint. This is useful for a leader agent
        to announce task decomposition results, or for any instance to signal an urgent blocker.
      </p>
      <CodeBlock :code="broadcastCode" language="bash" filename="POST /api/projects/{id}/broadcast" />

      <h3>WebSocket Subscription</h3>
      <CodeBlock :code="subscribeCode" language="typescript" filename="Subscribing to project events" />
    </section>

    <!-- 8. Coordination Patterns -->
    <section id="patterns">
      <h2>Coordination Patterns</h2>
      <p>
        There is no single correct way to orchestrate agents. Choose the pattern that matches
        your project's dependency structure and the number of instances available.
      </p>

      <h3>Leader / Worker</h3>
      <p>
        One dedicated <em>leader</em> instance decomposes the goal into tasks, creates them
        all upfront, then transitions to a worker role itself. Other instances connect and
        immediately start claiming from the shared task board.
      </p>
      <CodeBlock :code="leaderWorkerCode" language="typescript" filename="Leader instance bootstrap" />

      <h3>Parallel Independent Tasks</h3>
      <p>
        The simplest pattern: all tasks are independent (no dependencies), all instances are
        equivalent. Each instance calls <code>next-available</code> in a loop, claims, works,
        completes, and repeats. The server automatically distributes load.
      </p>
      <CodeBlock :code="parallelLoopCode" language="typescript" filename="Worker loop" />

      <h3>Sequential Pipeline</h3>
      <p>
        For workflows with strict ordering (e.g., design → implementation → tests → docs),
        create tasks with dependency chains. Instances running the later stages will block on
        <code>next-available</code> until upstream tasks complete.
      </p>
      <CodeBlock :code="pipelineCode" language="bash" filename="Creating a dependency chain" />
    </section>

    <!-- 9. Conflict Resolution -->
    <section id="conflict-resolution">
      <h2>Conflict Resolution</h2>
      <p>
        Even with file locking and atomic task claiming, some conflict scenarios can arise.
        Here is how ClaudeNest handles each one.
      </p>

      <div class="conflict-list">
        <div class="conflict-card">
          <h4>Two agents claim the same task simultaneously</h4>
          <p>
            The server performs an atomic compare-and-swap: only the first request succeeds.
            The second agent receives <code>409 Conflict</code> and must call
            <code>next-available</code> to find a different task. No manual intervention required.
          </p>
        </div>
        <div class="conflict-card">
          <h4>Two agents request a lock on the same file</h4>
          <p>
            The first request succeeds and creates the lock record. The second request returns
            <code>423 Locked</code> with the lock details (holder instance ID, expiry time).
            The blocked agent should wait for the <code>file.unlocked</code> WebSocket event
            before retrying.
          </p>
        </div>
        <div class="conflict-card">
          <h4>An agent crashes while holding locks and a task</h4>
          <p>
            The server detects the WebSocket disconnect and automatically releases all file
            locks held by that instance ID and resets any claimed tasks back to
            <code>pending</code>. Other instances will pick them up on their next
            <code>next-available</code> poll.
          </p>
        </div>
        <div class="conflict-card">
          <h4>Context chunks from two instances contradict each other</h4>
          <p>
            Context is append-only: contradicting chunks co-exist in the vector store. The
            most recent chunk for the same file path will generally surface higher in search
            results due to the <code>importance_score</code> and recency weighting. A human or
            orchestrator can delete stale chunks via
            <code>DELETE /api/projects/{id}/context/chunks/{chunkId}</code>.
          </p>
        </div>
        <div class="conflict-card">
          <h4>A task's dependency is stuck in <code>in_progress</code></h4>
          <p>
            If the holding instance has disconnected, the server resets the task to
            <code>pending</code>. If the instance is still running but slow, the orchestrator
            can move the dependency to <code>blocked</code> or <code>done</code> via
            <code>PATCH /api/tasks/{id}</code>, unblocking downstream work.
          </p>
        </div>
      </div>

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>Observability</h4>
          <p>
            The project activity log (<code>GET /api/projects/{id}/activity</code>) records
            every coordination event — claims, releases, lock acquisitions, context additions —
            with timestamps and instance IDs. Use it to debug unexpected states.
          </p>
        </div>
      </div>
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
