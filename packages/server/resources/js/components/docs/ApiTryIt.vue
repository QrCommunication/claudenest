<template>
  <div class="api-try-it">
    <div class="try-it-header">
      <h4>Try It</h4>
      <div class="auth-input">
        <label>Authorization</label>
        <input
          v-model="authToken"
          type="text"
          placeholder="Bearer token..."
        />
      </div>
    </div>

    <!-- Request Builder -->
    <div class="request-builder">
      <!-- URL Display -->
      <div class="url-display">
        <span class="method" :style="{ color: methodColor }">{{ endpoint.method }}</span>
        <code class="url">{{ fullUrl }}</code>
      </div>

      <!-- Path Parameters -->
      <div v-if="pathParams.length" class="param-section">
        <h5>Path Parameters</h5>
        <div class="param-list">
          <div v-for="param in pathParams" :key="param.name" class="param-input">
            <label>{{ param.name }}</label>
            <input
              v-model="paramValues[param.name]"
              type="text"
              :placeholder="`Enter ${param.name}`"
            />
          </div>
        </div>
      </div>

      <!-- Query Parameters -->
      <div v-if="endpoint.query?.length" class="param-section">
        <h5>Query Parameters</h5>
        <div class="param-list">
          <div v-for="param in endpoint.query" :key="param.name" class="param-input">
            <label>
              {{ param.name }}
              <span v-if="param.required" class="required">*</span>
            </label>
            <input
              v-model="queryValues[param.name]"
              type="text"
              :placeholder="param.description"
            />
          </div>
        </div>
      </div>

      <!-- Request Body -->
      <div v-if="endpoint.body" class="param-section">
        <h5>Request Body</h5>
        <textarea
          v-model="requestBody"
          class="body-editor"
          spellcheck="false"
        />
        <div v-if="!isValidJson" class="json-error">Invalid JSON</div>
      </div>

      <!-- Execute Button -->
      <button 
        class="execute-btn" 
        :disabled="isLoading || !canExecute"
        @click="executeRequest"
      >
        <svg v-if="isLoading" class="spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="60" stroke-dashoffset="20"/>
        </svg>
        <span v-else>Send Request</span>
      </button>
    </div>

    <!-- Response -->
    <div v-if="response" class="response-section">
      <div class="response-header">
        <h5>Response</h5>
        <span 
          class="status-badge" 
          :class="{ success: isSuccess, error: !isSuccess }"
        >
          {{ responseStatus }}
        </span>
      </div>
      <pre class="response-body"><code>{{ formattedResponse }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDocs } from '@/composables/useDocs';
import type { ApiEndpoint } from '@/data/api-endpoints';

const props = defineProps<{
  endpoint: ApiEndpoint;
}>();

const { getMethodColor } = useDocs();

const authToken = ref(localStorage.getItem('docs_auth_token') || '');
const isLoading = ref(false);
const response = ref<any>(null);
const responseStatus = ref<number>(0);

// Path parameters extracted from the URL
const pathParams = computed(() => {
  const params: Array<{ name: string; value: string }> = [];
  const matches = props.endpoint.path.match(/\{(\w+)\}/g);
  if (matches) {
    matches.forEach(match => {
      const name = match.replace(/[{}]/g, '');
      params.push({ name, value: '' });
    });
  }
  return params;
});

const paramValues = ref<Record<string, string>>({});
const queryValues = ref<Record<string, string>>({});

const requestBody = ref(props.endpoint.body || '{}');

const methodColor = computed(() => getMethodColor(props.endpoint.method));

const baseUrl = computed(() => {
  // In production, this should come from config
  return window.location.origin + '/api';
});

const fullUrl = computed(() => {
  let url = props.endpoint.path;
  
  // Replace path parameters
  Object.entries(paramValues.value).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, encodeURIComponent(value));
  });
  
  // Add query parameters
  const queryParams = new URLSearchParams();
  Object.entries(queryValues.value).forEach(([key, value]) => {
    if (value) queryParams.append(key, value);
  });
  
  const queryString = queryParams.toString();
  if (queryString) {
    url += '?' + queryString;
  }
  
  return baseUrl.value + url;
});

const isValidJson = computed(() => {
  if (!props.endpoint.body) return true;
  try {
    JSON.parse(requestBody.value);
    return true;
  } catch {
    return false;
  }
});

const canExecute = computed(() => {
  if (!isValidJson.value) return false;
  // Check required path parameters
  return pathParams.value.every(p => paramValues.value[p.name]);
});

const isSuccess = computed(() => {
  return responseStatus.value >= 200 && responseStatus.value < 300;
});

const formattedResponse = computed(() => {
  if (!response.value) return '';
  return JSON.stringify(response.value, null, 2);
});

const executeRequest = async () => {
  if (!canExecute.value) return;
  
  isLoading.value = true;
  response.value = null;
  
  // Save auth token
  if (authToken.value) {
    localStorage.setItem('docs_auth_token', authToken.value);
  }
  
  try {
    const options: RequestInit = {
      method: props.endpoint.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };
    
    if (authToken.value) {
      options.headers = {
        ...options.headers,
        'Authorization': authToken.value.startsWith('Bearer') 
          ? authToken.value 
          : `Bearer ${authToken.value}`,
      };
    }
    
    if (props.endpoint.body && ['POST', 'PUT', 'PATCH'].includes(props.endpoint.method)) {
      options.body = requestBody.value;
    }
    
    const res = await fetch(fullUrl.value, options);
    responseStatus.value = res.status;
    
    const data = await res.json().catch(() => null);
    response.value = data || { status: res.statusText };
  } catch (error) {
    responseStatus.value = 0;
    response.value = { error: 'Network error or CORS issue' };
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.api-try-it {
  background: rgba(0, 0, 0, 0.2);
  padding: 1.25rem;
}

.try-it-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.try-it-header h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.auth-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.auth-input label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.auth-input input {
  width: 250px;
  padding: 0.375rem 0.625rem;
  background: color-mix(in srgb, var(--text-primary) 5%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.85rem;
  font-family: 'JetBrains Mono', monospace;
}

.auth-input input:focus {
  outline: none;
  border-color: var(--accent-purple, #a855f7);
}

/* Request Builder */
.request-builder {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.url-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 8px;
}

.method {
  font-weight: 700;
  font-size: 0.85rem;
}

.url {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--text-secondary);
  word-break: break-all;
}

/* Parameter Sections */
.param-section h5 {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin: 0 0 0.75rem;
}

.param-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.param-input {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.param-input label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.param-input label .required {
  color: #ef4444;
}

.param-input input {
  padding: 0.5rem 0.75rem;
  background: color-mix(in srgb, var(--text-primary) 5%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.param-input input:focus {
  outline: none;
  border-color: var(--accent-purple, #a855f7);
}

/* Body Editor */
.body-editor {
  width: 100%;
  min-height: 120px;
  padding: 0.75rem;
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 8px;
  color: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  resize: vertical;
}

.body-editor:focus {
  outline: none;
  border-color: var(--accent-purple, #a855f7);
}

.json-error {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

/* Execute Button */
.execute-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-indigo, #6366f1));
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.execute-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
}

.execute-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Response Section */
.response-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color, var(--border));
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.response-header h5 {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.status-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.success {
  background: color-mix(in srgb, var(--status-success, #22c55e) 20%, transparent);
  color: #4ade80;
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.response-body {
  margin: 0;
  padding: 1rem;
  background: var(--bg-primary, var(--surface-1));
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #86efac;
}
</style>
