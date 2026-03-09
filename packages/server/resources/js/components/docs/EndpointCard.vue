<template>
  <div :id="endpointId" class="endpoint-card">
    <!-- Header -->
    <div class="endpoint-header">
      <div class="endpoint-meta">
        <span class="method-badge" :style="{ backgroundColor: methodColor }">
          {{ method }}
        </span>
        <code class="endpoint-path">{{ path }}</code>
      </div>
      <p class="endpoint-description">{{ description }}</p>
    </div>

    <!-- Actions -->
    <div class="endpoint-actions">
      <button class="copy-btn" @click="copyEndpoint">
        <svg v-if="!copied" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
    </div>

    <!-- Parameters -->
    <div v-if="params?.length" class="endpoint-section">
      <h4 class="section-title">Parameters</h4>
      <table class="params-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="param in params" :key="param.name">
            <td><code>{{ param.name }}</code></td>
            <td><span class="type-badge">{{ param.type }}</span></td>
            <td>
              <span class="required-badge" :class="{ required: param.required }">
                {{ param.required ? 'Yes' : 'No' }}
              </span>
            </td>
            <td>{{ param.description }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Code Examples -->
    <div v-if="codeExamples.length" class="endpoint-section">
      <h4 class="section-title">Examples</h4>
      <CodeTabs :tabs="codeExamples" />
    </div>

    <!-- Responses -->
    <div v-if="responses?.length" class="endpoint-section">
      <h4 class="section-title">Responses</h4>
      <div v-for="(resp, i) in responses" :key="i" class="response-block">
        <div class="response-header">
          <span class="http-status" :class="String(resp.status).startsWith('2') ? 'status-ok' : 'status-err'">
            {{ resp.status }}
          </span>
          <span v-if="resp.description" class="response-desc">{{ resp.description }}</span>
        </div>
        <CodeBlock :code="resp.body" language="json" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDocs } from '@/composables/useDocs';
import CodeBlock from './CodeBlock.vue';
import CodeTabs from './CodeTabs.vue';

interface Param {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

interface ResponseExample {
  status: number | string;
  description?: string;
  body: string;
}

const props = defineProps<{
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  params?: Param[];
  curlExample?: string;
  jsExample?: string;
  phpExample?: string;
  responses?: ResponseExample[];
}>();

const { getMethodColor, copyToClipboard } = useDocs();

const copied = ref(false);

const methodColor = computed(() => getMethodColor(props.method));

const endpointId = computed(() => {
  return props.path
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
});

const copyEndpoint = async () => {
  const text = `${props.method} ${props.path}`;
  const success = await copyToClipboard(text);
  if (success) {
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
};

const codeExamples = computed(() => {
  const tabs: Array<{ label: string; language: string; code: string }> = [];
  if (props.curlExample) tabs.push({ label: 'cURL', language: 'bash', code: props.curlExample });
  if (props.jsExample) tabs.push({ label: 'JavaScript', language: 'javascript', code: props.jsExample });
  if (props.phpExample) tabs.push({ label: 'PHP', language: 'php', code: props.phpExample });
  return tabs;
});
</script>

<style scoped>
.endpoint-card {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--text-primary) 8%, transparent);
  border-radius: 12px;
  margin-bottom: 2rem;
  overflow: hidden;
}

.endpoint-header {
  padding: 1.25rem;
  border-bottom: 1px solid color-mix(in srgb, var(--text-primary) 8%, transparent);
}

.endpoint-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.method-badge {
  padding: 0.375rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-primary);
}

.endpoint-path {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  color: var(--text-primary);
  background: none;
}

.endpoint-description {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

.endpoint-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid color-mix(in srgb, var(--text-primary) 8%, transparent);
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: color-mix(in srgb, var(--text-primary) 5%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
  color: var(--text-primary);
}

.copy-btn svg {
  width: 16px;
  height: 16px;
}

.endpoint-section {
  padding: 1.25rem;
  border-bottom: 1px solid color-mix(in srgb, var(--text-primary) 8%, transparent);
}

.endpoint-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem;
}

/* Parameters Table */
.params-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.params-table th,
.params-table td {
  padding: 0.625rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid color-mix(in srgb, var(--text-primary) 5%, transparent);
}

.params-table th {
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.params-table td {
  color: var(--text-secondary);
}

.params-table code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: var(--text-primary);
}

.type-badge {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 10%, transparent);
  color: var(--accent-cyan, #22d3ee);
  border-radius: 4px;
  font-size: 0.75rem;
}

.required-badge {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  background: color-mix(in srgb, var(--text-primary) 5%, transparent);
  color: var(--text-muted);
  border-radius: 4px;
  font-size: 0.75rem;
}

.required-badge.required {
  background: color-mix(in srgb, var(--status-error, #ef4444) 10%, transparent);
  color: var(--status-error, #ef4444);
}

.response-block {
  margin-bottom: 1rem;
}

.response-block:last-child {
  margin-bottom: 0;
}

.response-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.http-status {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}

.status-ok {
  background: color-mix(in srgb, #22c55e 10%, transparent);
  color: #22c55e;
}

.status-err {
  background: color-mix(in srgb, var(--status-error, #ef4444) 10%, transparent);
  color: var(--status-error, #ef4444);
}

.response-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
}
</style>
