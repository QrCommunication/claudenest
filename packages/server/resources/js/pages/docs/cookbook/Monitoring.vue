<template>
  <article class="doc-content">
    <header class="doc-header">
      <span class="badge">Cookbook</span>
      <h1>Monitoring &amp; Observability</h1>
      <p class="lead">Monitor your ClaudeNest agents, sessions, and infrastructure performance in real time.</p>
    </header>

    <!-- Overview -->
    <section id="overview">
      <h2>Overview</h2>
      <p>
        A healthy ClaudeNest deployment requires visibility at four levels: machine connectivity,
        session lifecycle, task throughput, and infrastructure health (PostgreSQL, Redis, Reverb).
        This guide covers the tools, endpoints, and patterns needed to keep everything observable.
      </p>
      <div class="metric-grid">
        <div class="metric-card">
          <span class="metric-icon">&#9635;</span>
          <div>
            <strong>Machines</strong>
            <span>Online status, heartbeats, agent version drift</span>
          </div>
        </div>
        <div class="metric-card">
          <span class="metric-icon">&#9654;</span>
          <div>
            <strong>Sessions</strong>
            <span>Lifecycle state, token usage, cost tracking</span>
          </div>
        </div>
        <div class="metric-card">
          <span class="metric-icon">&#10003;</span>
          <div>
            <strong>Tasks</strong>
            <span>Claim rates, completion times, blocked tasks</span>
          </div>
        </div>
        <div class="metric-card">
          <span class="metric-icon">&#9889;</span>
          <div>
            <strong>Infrastructure</strong>
            <span>DB queries, Redis queues, WebSocket throughput</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Health Check Endpoint -->
    <section id="health-check">
      <h2>Health Check Endpoint</h2>
      <p>
        ClaudeNest exposes a <code>GET /api/health</code> endpoint that reports the status of all
        critical subsystems. Use it as the target for your load balancer or uptime monitor.
      </p>
      <CodeBlock
        :code="healthCheckResponseCode"
        language="json"
        filename="GET /api/health — 200 OK"
      />
      <p>
        A non-200 response, or a <code>status</code> of <code>"degraded"</code> or
        <code>"down"</code> for any subsystem, should trigger an alert. The endpoint never requires
        authentication so it is safe to expose on a public path behind rate limiting.
      </p>
      <CodeTabs
        :tabs="[
          { label: 'cURL', language: 'bash', code: healthCurlCode, filename: 'Terminal' },
          { label: 'JavaScript', language: 'javascript', code: healthJsCode, filename: 'health-check.js' },
          { label: 'Python', language: 'python', code: healthPyCode, filename: 'health_check.py' },
        ]"
      />
    </section>

    <!-- Machine Monitoring -->
    <section id="machine-monitoring">
      <h2>Machine Monitoring</h2>
      <p>
        Each agent pings the server every 30 seconds via the WebSocket heartbeat, updating the
        <code>last_seen_at</code> column on the <code>machines</code> table. A machine whose
        <code>last_seen_at</code> is older than 60 seconds should be considered offline.
      </p>

      <h3>Polling machine status via API</h3>
      <CodeBlock
        :code="machineStatusCode"
        language="bash"
        filename="Terminal"
      />

      <h3>Real-time status via WebSocket</h3>
      <p>
        Subscribe to the private <code>machines.{id}</code> channel to receive status change events
        without polling.
      </p>
      <CodeBlock
        :code="machineWsCode"
        language="javascript"
        filename="machine-monitor.js"
      />

      <div class="callout tip">
        <span class="callout-icon">i</span>
        <div>
          <strong>Agent version drift</strong>
          <p>
            The <code>agent_version</code> field returned by <code>GET /api/machines/{id}</code>
            lets you detect outdated agents. Alert when the running version is more than one minor
            version behind the server's expected version.
          </p>
        </div>
      </div>
    </section>

    <!-- Session Monitoring -->
    <section id="session-monitoring">
      <h2>Session Monitoring</h2>
      <p>
        Sessions move through a defined lifecycle. Track each transition to detect stuck or
        runaway sessions.
      </p>

      <div class="lifecycle-row">
        <span class="state">pending</span>
        <span class="arrow">&#8594;</span>
        <span class="state">starting</span>
        <span class="arrow">&#8594;</span>
        <span class="state">active</span>
        <span class="arrow">&#8594;</span>
        <span class="state active-state">completed</span>
        <span class="sep">/</span>
        <span class="state error-state">error</span>
        <span class="sep">/</span>
        <span class="state warn-state">terminated</span>
      </div>

      <h3>Token and cost tracking</h3>
      <p>
        Each session accumulates <code>total_tokens</code> and <code>total_cost</code>. Query the
        session endpoint to retrieve current values without subscribing to WebSocket events.
      </p>
      <CodeBlock
        :code="sessionMetricsCode"
        language="bash"
        filename="Terminal"
      />

      <h3>Session logs</h3>
      <p>
        Full PTY output is stored in <code>session_logs</code>. Retrieve paginated logs for a
        session at any time, even after completion.
      </p>
      <CodeBlock
        :code="sessionLogsCode"
        language="bash"
        filename="Terminal"
      />

      <div class="callout warning">
        <span class="callout-icon">!</span>
        <div>
          <strong>Long-running session cost</strong>
          <p>
            Set a <code>max_tokens</code> alert threshold. When <code>total_tokens</code> exceeds
            80 % of your budget, send an in-app notification or terminate the session gracefully
            via <code>DELETE /api/sessions/{id}</code>.
          </p>
        </div>
      </div>
    </section>

    <!-- Task Metrics -->
    <section id="task-metrics">
      <h2>Task Metrics</h2>
      <p>
        The multi-agent task system exposes completion rates, average claim duration, and blocked
        task counts through the project stats endpoint.
      </p>
      <CodeBlock
        :code="taskMetricsCode"
        language="bash"
        filename="Terminal"
      />
      <CodeBlock
        :code="taskStatsResponseCode"
        language="json"
        filename="GET /api/projects/{id}/stats — 200 OK"
      />

      <h3>Detecting blocked tasks</h3>
      <p>
        A task with <code>status: "blocked"</code> for more than a configurable threshold (e.g.
        15 minutes) should trigger an alert. Poll the task list filtered by status:
      </p>
      <CodeBlock
        :code="blockedTasksCode"
        language="bash"
        filename="Terminal"
      />
    </section>

    <!-- WebSocket Monitoring -->
    <section id="websocket-monitoring">
      <h2>WebSocket Monitoring</h2>
      <p>
        Laravel Reverb exposes metrics on active connections and message throughput. Check the
        Reverb status endpoint or instrument your agent to emit connection events.
      </p>

      <h3>Reverb server info</h3>
      <CodeBlock
        :code="reverbStatusCode"
        language="bash"
        filename="Terminal"
      />

      <h3>Monitoring connection counts</h3>
      <CodeBlock
        :code="reverbConnectionCode"
        language="php"
        filename="app/Console/Commands/MonitorReverb.php"
      />

      <div class="callout tip">
        <span class="callout-icon">i</span>
        <div>
          <strong>Message throughput</strong>
          <p>
            High throughput from terminal output events (<code>session.output</code>) is expected
            during active sessions. Alert if the connection count drops to zero outside of a
            maintenance window — this indicates all agents have disconnected.
          </p>
        </div>
      </div>
    </section>

    <!-- Database Monitoring -->
    <section id="database-monitoring">
      <h2>Database Monitoring</h2>
      <p>
        PostgreSQL performance directly impacts RAG query latency and task coordination.
        Monitor slow queries, index usage, and pgvector IVFFlat index health.
      </p>

      <h3>Slow query log</h3>
      <CodeBlock
        :code="pgSlowQueryCode"
        language="bash"
        filename="/etc/postgresql/16/main/postgresql.conf (excerpt)"
      />

      <h3>pgvector index health</h3>
      <CodeBlock
        :code="pgvectorHealthCode"
        language="bash"
        filename="Terminal — psql"
      />

      <h3>Laravel query log (development)</h3>
      <CodeBlock
        :code="laravelQueryLogCode"
        language="php"
        filename="app/Providers/AppServiceProvider.php"
      />

      <div class="callout warning">
        <span class="callout-icon">!</span>
        <div>
          <strong>IVFFlat reindex threshold</strong>
          <p>
            When the <code>context_chunks</code> table grows beyond 1 million rows, rebuild the
            IVFFlat index with a higher <code>lists</code> value (e.g. 200) to maintain sub-10 ms
            vector search latency:
            <code>REINDEX INDEX CONCURRENTLY idx_context_chunks_embedding;</code>
          </p>
        </div>
      </div>
    </section>

    <!-- Redis Monitoring -->
    <section id="redis-monitoring">
      <h2>Redis Monitoring</h2>
      <p>
        Redis backs the queue, cache, and session store. Monitor queue lengths and memory usage
        to catch bottlenecks before they impact agent throughput.
      </p>

      <h3>Queue length via Redis CLI</h3>
      <CodeBlock
        :code="redisQueueCode"
        language="bash"
        filename="Terminal"
      />

      <h3>Cache hit rate</h3>
      <CodeBlock
        :code="redisCacheHitCode"
        language="bash"
        filename="Terminal"
      />

      <h3>Laravel Horizon (optional)</h3>
      <p>
        If you use Laravel Horizon for queue supervision, it provides a built-in dashboard with
        queue depth, throughput, and failure rate metrics.
      </p>
      <CodeBlock
        :code="horizonCode"
        language="bash"
        filename="Terminal"
      />
    </section>

    <!-- Log Management -->
    <section id="log-management">
      <h2>Log Management</h2>
      <p>
        ClaudeNest uses Laravel's structured logging. Configure the log channel to suit your
        stack — local file, Slack, or a log aggregator like Loki or Datadog.
      </p>

      <h3>Log channel configuration</h3>
      <CodeBlock
        :code="logConfigCode"
        language="php"
        filename="config/logging.php (excerpt)"
      />

      <h3>Log rotation (systemd/logrotate)</h3>
      <CodeBlock
        :code="logRotateCode"
        language="bash"
        filename="/etc/logrotate.d/claudenest"
      />

      <h3>Structured log query (jq)</h3>
      <CodeBlock
        :code="logJqCode"
        language="bash"
        filename="Terminal"
      />

      <div class="callout tip">
        <span class="callout-icon">i</span>
        <div>
          <strong>Agent structured logging</strong>
          <p>
            The Node.js agent uses <strong>pino</strong> for structured JSON logs. Ship agent
            logs to the same aggregator as server logs and correlate them with the
            <code>session_id</code> field present in every agent log line.
          </p>
        </div>
      </div>
    </section>

    <!-- Alerting -->
    <section id="alerting">
      <h2>Alerting</h2>
      <p>
        Use Laravel's notification system to fire alerts when key thresholds are breached.
        The example below sends a webhook notification when a machine goes offline.
      </p>

      <h3>Machine disconnect alert</h3>
      <CodeBlock
        :code="alertingCode"
        language="php"
        filename="app/Listeners/AlertOnMachineDisconnect.php"
      />

      <h3>Register the listener</h3>
      <CodeBlock
        :code="alertingListenerCode"
        language="php"
        filename="app/Providers/EventServiceProvider.php (excerpt)"
      />

      <h3>Webhook payload example</h3>
      <CodeBlock
        :code="alertingWebhookPayloadCode"
        language="json"
        filename="Webhook POST body"
      />
    </section>

    <!-- Dashboard Integration -->
    <section id="dashboard-integration">
      <h2>Dashboard Integration</h2>
      <p>
        The ClaudeNest web dashboard provides real-time visibility into machines, sessions, and
        tasks. No additional setup is required — data is pushed via Reverb WebSocket events and
        displayed automatically.
      </p>
      <ul>
        <li>
          <strong>Machines view</strong> — live online/offline status, last seen timestamp,
          active session count per machine.
        </li>
        <li>
          <strong>Session view</strong> — in-progress terminal output, token counter, elapsed
          time, and cost estimate updated every 5 seconds.
        </li>
        <li>
          <strong>Multi-agent view</strong> — task board with claim status, file lock map, and
          per-instance context token usage.
        </li>
        <li>
          <strong>Activity log</strong> — chronological feed of all project events (context
          updates, task claims, file locks) queryable by instance or event type.
        </li>
      </ul>

      <h3>Embedding the activity feed in external tools</h3>
      <CodeTabs
        :tabs="[
          { label: 'cURL', language: 'bash', code: activityCurlCode, filename: 'Terminal' },
          { label: 'JavaScript', language: 'javascript', code: activityJsCode, filename: 'activity-feed.js' },
          { label: 'Python', language: 'python', code: activityPyCode, filename: 'activity_feed.py' },
        ]"
      />
    </section>

    <!-- Production Checklist -->
    <section id="production-checklist">
      <h2>Production Checklist</h2>
      <div class="checklist">
        <label class="checklist-item">
          <input type="checkbox" disabled />
          <span><code>GET /api/health</code> wired to uptime monitor (e.g. UptimeRobot, Betterstack)</span>
        </label>
        <label class="checklist-item">
          <input type="checkbox" disabled />
          <span>Machine heartbeat alert: fire if <code>last_seen_at</code> &gt; 60 s</span>
        </label>
        <label class="checklist-item">
          <input type="checkbox" disabled />
          <span>Session token budget alert at 80 % of per-session limit</span>
        </label>
        <label class="checklist-item">
          <input type="checkbox" disabled />
          <span>Blocked task alert after 15-minute threshold</span>
        </label>
        <label class="checklist-item">
          <input type="checkbox" disabled />
          <span>PostgreSQL slow query log enabled (<code>log_min_duration_statement = 500</code>)</span>
        </label>
        <label class="checklist-item">
          <input type="checkbox" disabled />
          <span>pgvector IVFFlat index scheduled rebuild on table growth &gt; 1 M rows</span>
        </label>
        <label class="checklist-item">
          <input type="checkbox" disabled />
          <span>Redis memory limit set and eviction policy configured (<code>allkeys-lru</code>)</span>
        </label>
        <label class="checklist-item">
          <input type="checkbox" disabled />
          <span>Log rotation configured for <code>storage/logs/</code> and agent pino logs</span>
        </label>
        <label class="checklist-item">
          <input type="checkbox" disabled />
          <span>Webhook or Slack alert on machine disconnect event</span>
        </label>
        <label class="checklist-item">
          <input type="checkbox" disabled />
          <span>Reverb WebSocket zero-connection alert outside maintenance windows</span>
        </label>
        <label class="checklist-item">
          <input type="checkbox" disabled />
          <span>Agent version drift alert when running version is &gt; 1 minor version behind</span>
        </label>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

// ── Health Check ──────────────────────────────────────────────────────────────

const healthCheckResponseCode = ref(`{
  "status": "ok",
  "timestamp": "2026-02-17T10:00:00.000Z",
  "version": "1.1.0",
  "services": {
    "database": { "status": "ok", "latency_ms": 3 },
    "redis":    { "status": "ok", "latency_ms": 1 },
    "reverb":   { "status": "ok", "connections": 42 },
    "ollama":   { "status": "ok", "model": "bge-small-en-v1.5" }
  }
}`);

const healthCurlCode = ref(`# Basic health check
curl -s https://claudenest.example.com/api/health | jq .

# Exit with non-zero on degraded status
STATUS=$(curl -s https://claudenest.example.com/api/health | jq -r '.status')
if [ "$STATUS" != "ok" ]; then
  echo "ClaudeNest health check FAILED: $STATUS"
  exit 1
fi`);

const healthJsCode = ref(`async function checkHealth(baseUrl) {
  const response = await fetch(\`\${baseUrl}/api/health\`);
  const data = await response.json();

  if (!response.ok || data.status !== 'ok') {
    console.error('Health check failed:', data);
    return false;
  }

  for (const [service, info] of Object.entries(data.services)) {
    if (info.status !== 'ok') {
      console.warn(\`Service \${service} is \${info.status}\`);
    }
  }

  return true;
}

// Poll every 30 seconds
setInterval(() => checkHealth('https://claudenest.example.com'), 30_000);`);

const healthPyCode = ref(`import requests
import time

BASE_URL = "https://claudenest.example.com"

def check_health():
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=5)
        data = r.json()
        if data.get("status") != "ok":
            print(f"WARN: health status={data.get('status')}")
            return False
        for svc, info in data.get("services", {}).items():
            if info.get("status") != "ok":
                print(f"WARN: service {svc} is {info.get('status')}")
        return True
    except Exception as e:
        print(f"ERROR: health check failed: {e}")
        return False

while True:
    check_health()
    time.sleep(30)`);

// ── Machine Monitoring ────────────────────────────────────────────────────────

const machineStatusCode = ref(`# List machines with status
curl -s https://claudenest.example.com/api/machines \\
  -H "Authorization: Bearer $TOKEN" | \\
  jq '.data[] | {id, name, status, last_seen_at}'

# Check a specific machine
curl -s https://claudenest.example.com/api/machines/$MACHINE_ID \\
  -H "Authorization: Bearer $TOKEN" | \\
  jq '{status, last_seen_at, agent_version, active_sessions_count}'`);

const machineWsCode = ref(`import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT,
  forceTLS: false,
});

// Subscribe to a specific machine's private channel
echo.private(\`machines.\${machineId}\`)
  .listen('.machine.status', (event) => {
    console.log('Machine status changed:', event.status);
    // event.status: 'online' | 'offline' | 'connecting'
    // event.last_seen_at: ISO 8601 timestamp
  })
  .listen('.machine.disconnected', (event) => {
    console.warn('Machine disconnected:', event.machine_id);
    triggerAlert(event);
  });`);

// ── Session Monitoring ────────────────────────────────────────────────────────

const sessionMetricsCode = ref(`# Get session details including token/cost tracking
curl -s https://claudenest.example.com/api/sessions/$SESSION_ID \\
  -H "Authorization: Bearer $TOKEN" | \\
  jq '{
    id,
    status,
    total_tokens,
    total_cost,
    started_at,
    completed_at
  }'

# List all active sessions across all machines
curl -s "https://claudenest.example.com/api/sessions?status=active" \\
  -H "Authorization: Bearer $TOKEN" | \\
  jq '.data[] | {id, status, total_tokens, total_cost}'`);

const sessionLogsCode = ref(`# Retrieve the last 100 lines of session output
curl -s "https://claudenest.example.com/api/sessions/$SESSION_ID/logs?per_page=100" \\
  -H "Authorization: Bearer $TOKEN" | \\
  jq '.data[] | .content'`);

// ── Task Metrics ──────────────────────────────────────────────────────────────

const taskMetricsCode = ref(`# Get project statistics including task metrics
curl -s https://claudenest.example.com/api/projects/$PROJECT_ID/stats \\
  -H "Authorization: Bearer $TOKEN" | jq .`);

const taskStatsResponseCode = ref(`{
  "success": true,
  "data": {
    "tasks": {
      "total": 42,
      "pending": 8,
      "in_progress": 3,
      "blocked": 1,
      "review": 2,
      "done": 28
    },
    "completion_rate": 0.667,
    "avg_claim_duration_minutes": 12.4,
    "instances_active": 3,
    "context_chunks": 184,
    "file_locks_active": 5
  },
  "meta": {
    "timestamp": "2026-02-17T10:05:00.000Z"
  }
}`);

const blockedTasksCode = ref(`# List tasks with 'blocked' status for a project
curl -s "https://claudenest.example.com/api/projects/$PROJECT_ID/tasks?status=blocked" \\
  -H "Authorization: Bearer $TOKEN" | \\
  jq '.data[] | {id, title, blocked_by, claimed_at}'`);

// ── WebSocket Monitoring ──────────────────────────────────────────────────────

const reverbStatusCode = ref(`# Check Reverb server status (requires Reverb management access)
curl -s http://127.0.0.1:8080/api/connections \\
  -H "Authorization: Bearer $REVERB_APP_SECRET"

# From the server host: view Reverb service logs
sudo journalctl -u claudenest-reverb -f --since "5 minutes ago"`);

const reverbConnectionCode = ref(`<?php

namespace App\\Console\\Commands;

use Illuminate\\Console\\Command;
use Illuminate\\Support\\Facades\\Redis;

class MonitorReverb extends Command
{
    protected $signature = 'reverb:monitor';
    protected $description = 'Report Reverb WebSocket connection stats';

    public function handle(): void
    {
        // Reverb stores channel subscriptions in Redis
        $keys = Redis::keys('reverb:channels:*');
        $totalConnections = 0;

        foreach ($keys as $key) {
            $count = Redis::scard($key);
            $totalConnections += $count;
            $this->line(sprintf('%s: %d subscriber(s)', $key, $count));
        }

        $this->info("Total active subscriptions: {$totalConnections}");

        if ($totalConnections === 0) {
            $this->warn('No active WebSocket connections — all agents may be offline.');
        }
    }
}`);

// ── Database Monitoring ───────────────────────────────────────────────────────

const pgSlowQueryCode = ref(`# Enable slow query logging (threshold: 500 ms)
log_min_duration_statement = 500
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Apply without restart
sudo -u postgres psql -c "SELECT pg_reload_conf();"`);

const pgvectorHealthCode = ref(`-- Check IVFFlat index size and usage
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan   AS scans,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE indexname = 'idx_context_chunks_embedding';

-- Check number of rows vs recommended lists
SELECT
    relname AS table_name,
    reltuples::bigint AS approx_rows,
    CASE
        WHEN reltuples > 1000000 THEN 'Consider increasing IVFFlat lists to 200'
        WHEN reltuples > 100000  THEN 'IVFFlat lists = 100 is appropriate'
        ELSE                          'IVFFlat lists = 50 is sufficient'
    END AS recommendation
FROM pg_class
WHERE relname = 'context_chunks';`);

const laravelQueryLogCode = ref(`<?php

namespace App\\Providers;

use Illuminate\\Support\\ServiceProvider;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Facades\\Log;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if (config('app.debug')) {
            DB::listen(function ($query) {
                if ($query->time > 100) { // ms
                    Log::warning('Slow query detected', [
                        'sql'      => $query->sql,
                        'bindings' => $query->bindings,
                        'time_ms'  => $query->time,
                    ]);
                }
            });
        }
    }
}`);

// ── Redis Monitoring ──────────────────────────────────────────────────────────

const redisQueueCode = ref(`# Check queue lengths for each queue
redis-cli llen queues:default
redis-cli llen queues:high
redis-cli llen queues:low

# One-liner: all queues matching the Laravel pattern
redis-cli --scan --pattern 'queues:*' | while read q; do
  echo "$q: $(redis-cli llen "$q") jobs"
done

# Check for failed jobs
redis-cli llen queues:failed`);

const redisCacheHitCode = ref(`# View Redis INFO stats (keyspace hits vs misses)
redis-cli INFO stats | grep -E "keyspace_(hits|misses)"

# Calculate hit rate (hits / (hits + misses))
redis-cli INFO stats | awk '
  /keyspace_hits/   { hits=$2 }
  /keyspace_misses/ { misses=$2 }
  END {
    total = hits + misses
    if (total > 0) printf "Cache hit rate: %.1f%%\\n", (hits/total)*100
    else           print  "No cache activity recorded"
  }
'

# Memory usage
redis-cli INFO memory | grep -E "used_memory_human|maxmemory_human"`);

const horizonCode = ref(`# Install Laravel Horizon (optional queue dashboard)
cd /opt/claudenest/packages/server
composer require laravel/horizon

# Publish config and assets
php artisan horizon:install

# Start Horizon supervisor
php artisan horizon

# Access dashboard at:
# https://claudenest.example.com/horizon`);

// ── Log Management ────────────────────────────────────────────────────────────

const logConfigCode = ref(`<?php
// config/logging.php (excerpt)
return [
    'default' => env('LOG_CHANNEL', 'stack'),

    'channels' => [
        'stack' => [
            'driver'   => 'stack',
            'channels' => ['daily', 'slack'],
        ],

        'daily' => [
            'driver' => 'daily',
            'path'   => storage_path('logs/claudenest.log'),
            'level'  => env('LOG_LEVEL', 'info'),
            'days'   => 14,
        ],

        'slack' => [
            'driver'   => 'slack',
            'url'      => env('LOG_SLACK_WEBHOOK_URL'),
            'username' => 'ClaudeNest',
            'emoji'    => ':boom:',
            'level'    => 'critical',
        ],

        // JSON output for log aggregators (Loki, Datadog)
        'json' => [
            'driver'    => 'daily',
            'path'      => storage_path('logs/claudenest-json.log'),
            'level'     => 'debug',
            'formatter' => Monolog\\Formatter\\JsonFormatter::class,
            'days'      => 7,
        ],
    ],
];`);

const logRotateCode = ref(`/opt/claudenest/packages/server/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        # Reload PHP-FPM so it re-opens log file handles
        systemctl reload php8.3-fpm > /dev/null 2>&1 || true
    endscript
}

# Agent pino logs
/var/log/claudenest-agent/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
}`);

const logJqCode = ref(`# Tail JSON logs and filter errors
tail -f /opt/claudenest/packages/server/storage/logs/claudenest-json.log | \\
  jq 'select(.level >= 400)'

# Count errors in the last hour
jq -r 'select(.level >= 400) | .message' \\
  /opt/claudenest/packages/server/storage/logs/claudenest-json.log | \\
  wc -l

# Find logs by session_id
jq --arg sid "$SESSION_ID" 'select(.context.session_id == $sid)' \\
  /opt/claudenest/packages/server/storage/logs/claudenest-json.log`);

// ── Alerting ──────────────────────────────────────────────────────────────────

const alertingCode = ref(`<?php

namespace App\\Listeners;

use App\\Events\\SessionTerminated;
use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Facades\\Log;

class AlertOnMachineDisconnect
{
    public function handle(SessionTerminated $event): void
    {
        $machine = $event->session->machine;

        if ($machine->status === 'offline') {
            $webhookUrl = config('claudenest.alerting.webhook_url');

            if (! $webhookUrl) {
                return;
            }

            try {
                Http::post($webhookUrl, [
                    'event'      => 'machine.disconnected',
                    'machine_id' => $machine->id,
                    'name'       => $machine->display_name ?? $machine->name,
                    'platform'   => $machine->platform,
                    'last_seen'  => $machine->last_seen_at?->toIso8601String(),
                    'timestamp'  => now()->toIso8601String(),
                ]);
            } catch (\\Throwable $e) {
                Log::error('Failed to send machine disconnect alert', [
                    'machine_id' => $machine->id,
                    'error'      => $e->getMessage(),
                ]);
            }
        }
    }
}`);

const alertingListenerCode = ref(`<?php
// app/Providers/EventServiceProvider.php

use App\\Events\\SessionTerminated;
use App\\Listeners\\AlertOnMachineDisconnect;

protected $listen = [
    SessionTerminated::class => [
        AlertOnMachineDisconnect::class,
    ],
];`);

const alertingWebhookPayloadCode = ref(`{
  "event":      "machine.disconnected",
  "machine_id": "550e8400-e29b-41d4-a716-446655440000",
  "name":       "dev-macbook-pro",
  "platform":   "darwin",
  "last_seen":  "2026-02-17T10:03:47.000Z",
  "timestamp":  "2026-02-17T10:04:17.000Z"
}`);

// ── Dashboard Integration ─────────────────────────────────────────────────────

const activityCurlCode = ref(`# Get the last 50 activity log entries for a project
curl -s "https://claudenest.example.com/api/projects/$PROJECT_ID/activity?per_page=50" \\
  -H "Authorization: Bearer $TOKEN" | \\
  jq '.data[] | {type, instance_id, details, created_at}'`);

const activityJsCode = ref(`const response = await fetch(
  \`https://claudenest.example.com/api/projects/\${projectId}/activity?per_page=50\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

const { data } = await response.json();

// Group by event type
const grouped = data.reduce((acc, entry) => {
  const key = entry.type;
  acc[key] = (acc[key] ?? []);
  acc[key].push(entry);
  return acc;
}, {});

console.log('Activity summary:', Object.entries(grouped).map(([k, v]) => ({
  type: k,
  count: v.length,
})));`);

const activityPyCode = ref(`import requests

BASE_URL = "https://claudenest.example.com"
TOKEN = "your-api-token"
PROJECT_ID = "your-project-id"

def get_activity(per_page=50):
    r = requests.get(
        f"{BASE_URL}/api/projects/{PROJECT_ID}/activity",
        params={"per_page": per_page},
        headers={"Authorization": f"Bearer {TOKEN}"},
        timeout=10,
    )
    r.raise_for_status()
    return r.json()["data"]

activity = get_activity()
for entry in activity:
    print(f"[{entry['created_at']}] {entry['type']} — {entry['instance_id']}")`);
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

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
  border-radius: 999px;
  color: var(--accent-purple, #a855f7);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.doc-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0.5rem 0 1rem;
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-cyan, #22d3ee));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 1.2rem;
  color: var(--text-secondary);
  line-height: 1.65;
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
  font-size: 1.2rem;
  font-weight: 600;
  margin: 1.75rem 0 0.75rem;
  color: var(--text-primary);
}

p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 1rem;
}

ul {
  color: var(--text-secondary);
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.6rem;
  line-height: 1.65;
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875em;
  background: color-mix(in srgb, var(--text-primary) 6%, transparent);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
}

/* ── Metric overview grid ─────────────────────────── */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1rem 1.1rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 10px;
}

.metric-icon {
  width: 32px;
  height: 32px;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 12%, transparent);
  color: var(--accent-purple, #a855f7);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.metric-card div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.metric-card strong {
  color: var(--text-primary);
  font-size: 0.95rem;
}

.metric-card span {
  color: var(--text-secondary);
  font-size: 0.8rem;
  line-height: 1.4;
}

/* ── Session lifecycle row ────────────────────────── */
.lifecycle-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 10px;
  margin: 1rem 0 1.5rem;
  font-size: 0.875rem;
}

.state {
  padding: 0.25rem 0.6rem;
  background: color-mix(in srgb, var(--text-primary) 6%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 6px;
  color: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
}

.state.active-state {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.25);
  color: #4ade80;
}

.state.error-state {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.25);
  color: #f87171;
}

.state.warn-state {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.25);
  color: #fbbf24;
}

.arrow {
  color: var(--text-secondary);
  font-size: 1rem;
}

.sep {
  color: var(--text-secondary);
  padding: 0 0.1rem;
}

/* ── Callout boxes ────────────────────────────────── */
.callout {
  display: flex;
  gap: 0.9rem;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  margin: 1.5rem 0;
}

.callout.tip {
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-cyan, #22d3ee) 20%, transparent);
}

.callout.warning {
  background: rgba(251, 191, 36, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.22);
}

.callout-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.callout.tip .callout-icon {
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 20%, transparent);
  color: var(--accent-cyan, #22d3ee);
}

.callout.warning .callout-icon {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.callout strong {
  display: block;
  color: var(--text-primary);
  margin-bottom: 0.3rem;
  font-size: 0.95rem;
}

.callout p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* ── Production checklist ─────────────────────────── */
.checklist {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1rem;
}

.checklist-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.65rem 1rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 8px;
  cursor: default;
}

.checklist-item input[type="checkbox"] {
  margin-top: 0.15rem;
  flex-shrink: 0;
  accent-color: var(--accent-purple, #a855f7);
}

.checklist-item span {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

/* ── Responsive ───────────────────────────────────── */
@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .lifecycle-row {
    font-size: 0.8rem;
  }
}
</style>
