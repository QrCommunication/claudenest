<template>
  <DocsLayout>
    <div class="docs-page">
      <h1>Error Reference</h1>
      
      <p class="lead">
        Complete reference of error codes and troubleshooting guidance for the ClaudeNest API.
      </p>

      <div class="section">
        <h2>{{ $t('docDocsErrors.errorFormatTitle') }}</h2>
        <p>
          All API errors follow a consistent format:
        </p>
        <CodeBlock language="json" :code="errorFormat" />
        <p>
          Error codes follow the pattern <code>XXX_NNN</code> where:
        </p>
        <ul>
          <li><code>XXX</code> - Category prefix (3 letters)</li>
          <li><code>NNN</code> - Numeric code (3 digits)</li>
        </ul>
      </div>

      <div class="section">
        <h2>{{ $t('docDocsErrors.categoriesTitle') }}</h2>
        <div class="category-grid">
          <div class="category-card">
            <h4>AUTH</h4>
            <p>Authentication errors</p>
          </div>
          <div class="category-card">
            <h4>MCH</h4>
            <p>{{ $t('docDocsErrors.catMch') }}</p>
          </div>
          <div class="category-card">
            <h4>SES</h4>
            <p>Session errors</p>
          </div>
          <div class="category-card">
            <h4>CTX</h4>
            <p>Project/Context errors</p>
          </div>
          <div class="category-card">
            <h4>TSK</h4>
            <p>Task-related errors</p>
          </div>
          <div class="category-card">
            <h4>LCK</h4>
            <p>File lock errors</p>
          </div>
          <div class="category-card">
            <h4>VAL</h4>
            <p>Validation errors</p>
          </div>
          <div class="category-card">
            <h4>RTE</h4>
            <p>{{ $t('docDocsErrors.catRte') }}</p>
          </div>
          <div class="category-card">
            <h4>GEN</h4>
            <p>General errors</p>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>{{ $t('docDocsErrors.authErrorsTitle') }}</h2>
        <ParamTable :params="authErrors" :showRequired="false" />
      </div>

      <div class="section">
        <h2>{{ $t('docDocsErrors.machineErrorsTitle') }}</h2>
        <ParamTable :params="machineErrors" :showRequired="false" />
      </div>

      <div class="section">
        <h2>{{ $t('docDocsErrors.sessionErrorsTitle') }}</h2>
        <ParamTable :params="sessionErrors" :showRequired="false" />
      </div>

      <div class="section">
        <h2>Project/Context Errors (CTX)</h2>
        <ParamTable :params="contextErrors" :showRequired="false" />
      </div>

      <div class="section">
        <h2>{{ $t('docDocsErrors.taskErrorsTitle') }}</h2>
        <ParamTable :params="taskErrors" :showRequired="false" />
      </div>

      <div class="section">
        <h2>File Lock Errors (LCK)</h2>
        <ParamTable :params="lockErrors" :showRequired="false" />
      </div>

      <div class="section">
        <h2>{{ $t('docDocsErrors.validationErrorsTitle') }}</h2>
        <ParamTable :params="validationErrors" :showRequired="false" />
      </div>

      <div class="section">
        <h2>{{ $t('docDocsErrors.rateLimitErrorsTitle') }}</h2>
        <ParamTable :params="rateLimitErrors" :showRequired="false" />
      </div>

      <div class="section">
        <h2>{{ $t('docDocsErrors.httpStatusTitle') }}</h2>
        <table class="status-table">
          <thead>
            <tr>
              <th>{{ $t('docDocsErrors.thStatus') }}</th>
              <th>{{ $t('docDocsErrors.thMeaning') }}</th>
              <th>{{ $t('docDocsErrors.thCommonCauses') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="status in httpStatuses" :key="status.code">
              <td>
                <span class="status-badge" :class="status.class">{{ status.code }}</span>
              </td>
              <td>{{ status.meaning }}</td>
              <td>{{ status.causes }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Troubleshooting Guide</h2>
        
        <div class="troubleshooting-item">
          <h4>401 Unauthorized</h4>
          <p><strong>{{ $t('docDocsErrors.problemLabel') }}</strong> Your API token is invalid or expired.</p>
          <p><strong>{{ $t('docDocsErrors.solutionsLabel') }}</strong></p>
          <ul>
            <li>Check that you're including the token in the Authorization header</li>
            <li>Verify the token format: <code>Bearer YOUR_TOKEN</code></li>
            <li>Try refreshing the token using <code>/auth/refresh</code></li>
            <li>If expired, login again to get a new token</li>
          </ul>
        </div>

        <div class="troubleshooting-item">
          <h4>429 Too Many Requests</h4>
          <p><strong>{{ $t('docDocsErrors.problemLabel') }}</strong> You've exceeded the rate limit.</p>
          <p><strong>{{ $t('docDocsErrors.solutionsLabel') }}</strong></p>
          <ul>
            <li>Check the <code>X-RateLimit-Reset</code> header for when limits reset</li>
            <li>Implement exponential backoff in your client</li>
            <li>Consider reducing request frequency</li>
            <li>Contact support if you need higher limits</li>
          </ul>
        </div>

        <div class="troubleshooting-item">
          <h4>500 Internal Server Error</h4>
          <p><strong>{{ $t('docDocsErrors.problemLabel') }}</strong> Something went wrong on our end.</p>
          <p><strong>{{ $t('docDocsErrors.solutionsLabel') }}</strong></p>
          <ul>
            <li>Retry the request after a few seconds</li>
            <li>Check the <a href="https://status.claudenest.io" target="_blank">status page</a></li>
            <li>Contact support with the request_id from the error</li>
          </ul>
        </div>

        <div class="troubleshooting-item">
          <h4>{{ $t('docDocsErrors.tsWsTitle') }}</h4>
          <p><strong>{{ $t('docDocsErrors.problemLabel') }}</strong> Can't establish WebSocket connection.</p>
          <p><strong>{{ $t('docDocsErrors.solutionsLabel') }}</strong></p>
          <ul>
            <li>Ensure you're using <code>wss://</code> (secure WebSocket)</li>
            <li>Check that the session is running before connecting</li>
            <li>Verify your WebSocket token hasn't expired (valid for 60 seconds)</li>
            <li>Check firewall/proxy settings</li>
          </ul>
        </div>
      </div>

      <div class="section">
        <h2>{{ $t('docDocsErrors.gettingHelpTitle') }}</h2>
        <p>
          If you're still experiencing issues:
        </p>
        <ul>
          <li>Include the <code>request_id</code> from error responses when contacting support</li>
          <li>Check our <a href="https://github.com/claudenest/claudenest/issues" target="_blank">GitHub Issues</a></li>
          <li>Join our <a href="https://discord.gg/claudenest" target="_blank">Discord community</a></li>
          <li>Email <a href="mailto:support@claudenest.io">support@claudenest.io</a></li>
        </ul>
      </div>
    </div>
  </DocsLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import DocsLayout from '@/layouts/DocsLayout.vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import ParamTable from '@/components/docs/ParamTable.vue';

const { t } = useI18n();

const errorFormat = ref(`{
  "success": false,
  "error": {
    "code": "AUTH_002",
    "message": "Invalid credentials"
  },
  "meta": {
    "timestamp": "2026-02-02T15:30:00Z",
    "request_id": "req_abc123xyz"
  }
}`);

const authErrors = computed(() => [
  { name: 'AUTH_001', type: 'string', description: 'Invalid provider (OAuth) or token not found' },
  { name: 'AUTH_002', type: 'string', description: 'Invalid credentials (email/password)' },
  { name: 'AUTH_003', type: 'string', description: 'Unable to send password reset link' },
  { name: 'AUTH_004', type: 'string', description: 'Invalid or expired reset token' },
  { name: 'AUTH_005', type: 'string', description: t('docDocsErrors.errAuth003') },
  { name: 'AUTH_006', type: 'string', description: t('docDocsErrors.errAuth005') },
]);

const machineErrors = computed(() => [
  { name: 'MCH_001', type: 'string', description: t('docDocsErrors.errMch001') },
  { name: 'MCH_002', type: 'string', description: t('docDocsErrors.errMch002') },
  { name: 'MCH_003', type: 'string', description: 'Machine does not support Wake-on-LAN' },
  { name: 'MCH_004', type: 'string', description: 'Machine is already online' },
  { name: 'MCH_005', type: 'string', description: 'Maximum sessions reached for this machine' },
]);

const sessionErrors = ref([
  { name: 'SES_001', type: 'string', description: 'Session not found or not running' },
  { name: 'SES_002', type: 'string', description: 'Session creation failed' },
  { name: 'SES_003', type: 'string', description: 'Session already terminated' },
  { name: 'SES_004', type: 'string', description: 'Invalid PTY size parameters' },
  { name: 'SES_005', type: 'string', description: 'WebSocket token expired' },
]);

const contextErrors = computed(() => [
  { name: 'CTX_001', type: 'string', description: t('docDocsErrors.errCtx001') },
  { name: 'CTX_002', type: 'string', description: t('docDocsErrors.errCtx002') },
  { name: 'CTX_003', type: 'string', description: 'Token limit exceeded' },
  { name: 'CTX_004', type: 'string', description: t('docDocsErrors.errCtx003') },
  { name: 'CTX_005', type: 'string', description: 'Invalid context update' },
]);

const taskErrors = computed(() => [
  { name: 'TSK_001', type: 'string', description: t('docDocsErrors.errTsk001') },
  { name: 'TSK_002', type: 'string', description: 'Task already claimed by another instance' },
  { name: 'TSK_003', type: 'string', description: 'Task dependencies not completed or task not claimed' },
  { name: 'TSK_004', type: 'string', description: 'Invalid task status transition' },
  { name: 'TSK_005', type: 'string', description: 'Task is blocked by dependencies' },
]);

const lockErrors = ref([
  { name: 'LCK_001', type: 'string', description: 'File already locked by another instance' },
  { name: 'LCK_002', type: 'string', description: 'Lock not found or already expired' },
  { name: 'LCK_003', type: 'string', description: 'Failed to acquire lock' },
  { name: 'LCK_004', type: 'string', description: 'Lock extension failed' },
]);

const validationErrors = ref([
  { name: 'VAL_001', type: 'string', description: 'Validation failed - check request parameters' },
  { name: 'VAL_002', type: 'string', description: 'Resource already exists' },
  { name: 'VAL_003', type: 'string', description: 'Invalid UUID format' },
  { name: 'VAL_004', type: 'string', description: 'Required field missing' },
]);

const rateLimitErrors = computed(() => [
  { name: 'RTE_001', type: 'string', description: 'Rate limit exceeded - too many requests' },
  { name: 'RTE_002', type: 'string', description: 'Concurrent connection limit exceeded' },
  { name: 'RTE_003', type: 'string', description: t('docDocsErrors.errRte003') },
]);

const httpStatuses = computed(() => [
  { code: '200', class: 'success', meaning: 'OK', causes: t('docDocsErrors.httpCauses200') },
  { code: '201', class: 'success', meaning: t('docDocsErrors.httpMeaning201'), causes: t('docDocsErrors.httpCauses201') },
  { code: '204', class: 'success', meaning: t('docDocsErrors.httpMeaning204'), causes: 'Success with no response body' },
  { code: '400', class: 'client-error', meaning: t('docDocsErrors.httpMeaning400'), causes: 'Invalid parameters or JSON' },
  { code: '401', class: 'client-error', meaning: t('docDocsErrors.httpMeaning401'), causes: 'Missing or invalid token' },
  { code: '403', class: 'client-error', meaning: t('docDocsErrors.httpMeaning403'), causes: t('docDocsErrors.httpCauses403') },
  { code: '404', class: 'client-error', meaning: t('docDocsErrors.httpMeaning404'), causes: t('docDocsErrors.httpCauses404') },
  { code: '409', class: 'client-error', meaning: t('docDocsErrors.httpMeaning409'), causes: 'Resource conflict (e.g., lock)' },
  { code: '422', class: 'client-error', meaning: t('docDocsErrors.httpMeaning422'), causes: t('docDocsErrors.httpCauses422') },
  { code: '429', class: 'client-error', meaning: t('docDocsErrors.httpMeaning429'), causes: t('docDocsErrors.httpCauses429') },
  { code: '500', class: 'server-error', meaning: t('docDocsErrors.httpMeaning500'), causes: 'Server error occurred' },
  { code: '502', class: 'server-error', meaning: t('docDocsErrors.httpMeaning502'), causes: 'Upstream server error' },
  { code: '503', class: 'server-error', meaning: t('docDocsErrors.httpMeaning503'), causes: 'Service temporarily down' },
]);
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

h4 {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
}

p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1rem;
}

ul {
  color: var(--text-secondary);
  line-height: 1.8;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

li {
  margin-bottom: 0.5rem;
}

a {
  color: var(--accent-purple-light, #c084fc);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

:deep(code) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  color: var(--accent-purple-light, #c084fc);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.category-card {
  padding: 1rem;
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 8px;
  text-align: center;
}

.category-card h4 {
  font-family: 'JetBrains Mono', monospace;
  color: var(--accent-purple, #a855f7);
  margin: 0 0 0.25rem 0;
}

.category-card p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.status-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.status-table th {
  text-align: left;
  padding: 0.75rem;
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.status-table td {
  padding: 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  color: var(--text-secondary);
}

.status-table tr:hover td {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}

.status-badge.success {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.status-badge.client-error {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.status-badge.server-error {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.troubleshooting-item {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
}

.troubleshooting-item h4 {
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.troubleshooting-item p {
  margin-bottom: 0.75rem;
}

.troubleshooting-item ul {
  margin-bottom: 0;
}

@media (max-width: 640px) {
  h1 {
    font-size: 1.75rem;
  }

  .category-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
