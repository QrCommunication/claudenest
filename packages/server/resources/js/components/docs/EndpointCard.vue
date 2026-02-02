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
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  margin-bottom: 2rem;
  overflow: hidden;
}

.endpoint-header {
  padding: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
  color: #ffffff;
}

.endpoint-path {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  color: #e2e8f0;
  background: none;
}

.endpoint-description {
  color: #a9b1d6;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

.endpoint-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.try-it-btn,
.copy-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #a9b1d6;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.try-it-btn:hover,
.copy-btn:hover {
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.3);
  color: #ffffff;
}

.try-it-btn svg,
.copy-btn svg {
  width: 16px;
  height: 16px;
}

.try-it-btn {
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.3);
  color: #a855f7;
}

.try-it-btn:hover {
  background: rgba(168, 85, 247, 0.2);
}

.try-it-panel {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.endpoint-section {
  padding: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.endpoint-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.params-table th {
  font-weight: 600;
  color: #64748b;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.params-table td {
  color: #a9b1d6;
}

.params-table code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: #e2e8f0;
}

.type-badge {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  background: rgba(34, 211, 238, 0.1);
  color: #22d3ee;
  border-radius: 4px;
  font-size: 0.75rem;
}

.required-badge {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  background: rgba(255, 255, 255, 0.05);
  color: #64748b;
  border-radius: 4px;
  font-size: 0.75rem;
}

.required-badge.required {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Error List */
.error-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.error-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.error-list li:last-child {
  border-bottom: none;
}

.error-list code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: #fca5a5;
}
</style>
