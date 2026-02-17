<template>
  <div :id="endpointId" class="endpoint-card">
    <!-- Header -->
    <div class="endpoint-header">
      <div class="endpoint-meta">
        <span class="method-badge" :style="{ backgroundColor: methodColor }">
          {{ endpoint.method }}
        </span>
        <code class="endpoint-path">{{ endpoint.path }}</code>
      </div>
      <p class="endpoint-description">{{ endpoint.description }}</p>
    </div>

    <!-- Try It Button -->
    <div class="endpoint-actions">
      <button class="try-it-btn" @click="showTryIt = !showTryIt">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
        {{ showTryIt ? 'Hide' : 'Try It' }}
      </button>
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

    <!-- Try It Panel -->
    <ApiTryIt
      v-if="showTryIt"
      :endpoint="endpoint"
      class="try-it-panel"
    />

    <!-- Parameters -->
    <div v-if="endpoint.params?.length" class="endpoint-section">
      <h4 class="section-title">Path Parameters</h4>
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
          <tr v-for="param in endpoint.params" :key="param.name">
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

    <!-- Query Parameters -->
    <div v-if="endpoint.query?.length" class="endpoint-section">
      <h4 class="section-title">Query Parameters</h4>
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
          <tr v-for="param in endpoint.query" :key="param.name">
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

    <!-- Request Body -->
    <div v-if="endpoint.body" class="endpoint-section">
      <h4 class="section-title">Request Body</h4>
      <CodeBlock 
        :code="endpoint.body" 
        language="json"
        :filename="'Request'"
      />
    </div>

    <!-- Response -->
    <div v-if="endpoint.response" class="endpoint-section">
      <h4 class="section-title">Response</h4>
      <CodeBlock 
        :code="endpoint.response" 
        language="json"
        :filename="'Response'"
      />
    </div>

    <!-- Errors -->
    <div v-if="endpoint.errors?.length" class="endpoint-section">
      <h4 class="section-title">Possible Errors</h4>
      <ul class="error-list">
        <li v-for="error in endpoint.errors" :key="error">
          <code>{{ error }}</code>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDocs } from '@/composables/useDocs';
import type { ApiEndpoint } from '@/data/api-endpoints';
import CodeBlock from './CodeBlock.vue';
import ApiTryIt from './ApiTryIt.vue';

const props = defineProps<{
  endpoint: ApiEndpoint;
}>();

const { getMethodColor, copyToClipboard } = useDocs();

const showTryIt = ref(false);
const copied = ref(false);

const methodColor = computed(() => getMethodColor(props.endpoint.method));

const endpointId = computed(() => {
  // Create a URL-friendly ID from the path
  return props.endpoint.path
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
});

const copyEndpoint = async () => {
  const text = `${props.endpoint.method} ${props.endpoint.path}`;
  const success = await copyToClipboard(text);
  if (success) {
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
};
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

.try-it-btn,
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

.try-it-btn:hover,
.copy-btn:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
  color: var(--text-primary);
}

.try-it-btn svg,
.copy-btn svg {
  width: 16px;
  height: 16px;
}

.try-it-btn {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
  color: var(--accent-purple, #a855f7);
}

.try-it-btn:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
}

.try-it-panel {
  border-bottom: 1px solid color-mix(in srgb, var(--text-primary) 8%, transparent);
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

/* Error List */
.error-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.error-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--text-primary) 5%, transparent);
}

.error-list li:last-child {
  border-bottom: none;
}

.error-list code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--status-error-light, #fca5a5);
}
</style>
