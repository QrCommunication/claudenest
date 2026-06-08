<template>
  <div :id="endpointId" class="endpoint-card" :class="{ 'is-expanded': expanded }">
    <!-- Clickable Header -->
    <button
      class="endpoint-header"
      @click="expanded = !expanded"
      :aria-expanded="expanded"
      type="button"
    >
      <div class="endpoint-header-left">
        <span class="method-badge" :class="method.toLowerCase()">{{ method }}</span>
        <code class="endpoint-path">{{ path }}</code>
      </div>
      <span class="endpoint-desc">{{ description }}</span>
      <div class="endpoint-header-right">
        <button
          class="copy-path-btn"
          @click.stop="copyEndpoint"
          :aria-label="copied ? t('docsEndpointcard.copied') : t('docsEndpointcard.copyEndpoint')"
          type="button"
        >
          <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
        <svg
          class="chevron-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </button>

    <!-- Expandable Body -->
    <div v-if="expanded" class="endpoint-body">
      <!-- Parameters -->
      <div v-if="params?.length" class="endpoint-section">
        <h4 class="section-title">{{ t('docsEndpointcard.parameters') }}</h4>
        <table class="params-table">
          <thead>
            <tr>
              <th>{{ t('docsEndpointcard.name') }}</th>
              <th>{{ t('docsEndpointcard.type') }}</th>
              <th>{{ t('docsEndpointcard.required') }}</th>
              <th>{{ t('docsEndpointcard.description') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="param in params" :key="param.name">
              <td><code>{{ param.name }}</code></td>
              <td><span class="type-badge">{{ param.type }}</span></td>
              <td>
                <span class="required-badge" :class="{ required: param.required }">
                  {{ param.required ? t('docsEndpointcard.yes') : t('docsEndpointcard.no') }}
                </span>
              </td>
              <td>{{ param.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Code Examples -->
      <div v-if="codeExamples.length" class="endpoint-section">
        <h4 class="section-title">{{ t('docsEndpointcard.examples') }}</h4>
        <CodeTabs :tabs="codeExamples" />
      </div>

      <!-- Responses -->
      <div v-if="responses?.length" class="endpoint-section">
        <h4 class="section-title">{{ t('docsEndpointcard.responses') }}</h4>
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

      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
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

const { t } = useI18n();
const { copyToClipboard } = useDocs();

const expanded = ref(false);
const copied = ref(false);

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
  border-bottom: 1px solid var(--border-color);
}

.endpoint-card:last-child {
  border-bottom: none;
}

/* Header */
.endpoint-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
  text-align: left;
  transition: opacity 0.15s ease;
}

.endpoint-header:hover {
  opacity: 0.85;
}

.endpoint-header-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.method-badge {
  display: inline-block;
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  line-height: 1;
}

.method-badge.get {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.method-badge.post {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.method-badge.put {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.method-badge.patch {
  color: #eab308;
  background: rgba(234, 179, 8, 0.1);
}

.method-badge.delete {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.endpoint-path {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--text-primary);
  background: none;
  padding: 0;
  border: none;
}

.endpoint-desc {
  flex: 1;
  font-size: 0.82rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.endpoint-header-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.copy-path-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.endpoint-header:hover .copy-path-btn {
  opacity: 1;
}

.copy-path-btn:hover {
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.06);
}

.copy-path-btn svg {
  width: 14px;
  height: 14px;
}

.chevron-icon {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1);
  flex-shrink: 0;
}

.is-expanded .chevron-icon {
  transform: rotate(90deg);
}

/* Body */
.endpoint-body {
  padding: 0 0 1.25rem 0;
}

.endpoint-section {
  padding: 0.75rem 0;
}

.section-title {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  margin: 0 0 0.75rem;
}

/* Parameters Table */
.params-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.params-table th,
.params-table td {
  padding: 0.5rem 0.65rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.params-table th {
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.params-table td {
  color: var(--text-secondary);
}

.params-table code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text-primary);
  background: none;
  padding: 0;
  border: none;
}

.type-badge {
  display: inline-block;
  padding: 0.1rem 0.35rem;
  background: rgba(59, 130, 246, 0.08);
  color: #60a5fa;
  border-radius: 3px;
  font-size: 0.72rem;
  font-family: 'JetBrains Mono', monospace;
}

.required-badge {
  display: inline-block;
  padding: 0.1rem 0.35rem;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  border-radius: 3px;
  font-size: 0.72rem;
}

.required-badge.required {
  background: rgba(239, 68, 68, 0.08);
  color: #f87171;
}

/* Responses */
.response-block {
  margin-bottom: 0.75rem;
}

.response-block:last-child {
  margin-bottom: 0;
}

.response-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.4rem;
}

.http-status {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}

.status-ok {
  background: rgba(34, 197, 94, 0.08);
  color: #4ade80;
}

.status-err {
  background: rgba(239, 68, 68, 0.08);
  color: #f87171;
}

.response-desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

/* Mobile */
@media (max-width: 640px) {
  .endpoint-desc {
    display: none;
  }

  .endpoint-header {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .params-table {
    font-size: 0.75rem;
  }
}

/* ============ REDUCED MOTION ============ */
@media (prefers-reduced-motion: reduce) {
  .chevron-icon,
  .copy-path-btn {
    transition: none;
  }
}
</style>
