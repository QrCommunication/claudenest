<template>
  <Teleport to="body">
    <div class="api-tester-overlay" @click.self="$emit('close')">
      <div class="api-tester-modal">
        <header class="tester-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            API Tester
          </h2>
          <button class="close-btn" @click="$emit('close')">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </header>

        <div class="tester-body">
          <!-- Request Configuration -->
          <div class="request-section">
            <h3>Request</h3>
            
            <div class="request-line">
              <select v-model="method" class="method-select">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              
              <input 
                type="text" 
                v-model="url"
                class="url-input"
                placeholder="https://api.claudenest.io/api/..."
              />
              
              <button 
                class="send-btn" 
                :disabled="isLoading"
                @click="sendRequest"
              >
                <span v-if="isLoading" class="spinner"></span>
                <span v-else>Send</span>
              </button>
            </div>

            <!-- Auth Token -->
            <div class="input-group">
              <label>Authorization Token</label>
              <input 
                type="text" 
                v-model="authToken"
                placeholder="Bearer YOUR_TOKEN_HERE"
              />
            </div>

            <!-- Tabs for Headers/Body -->
            <div class="request-tabs">
              <button 
                class="tab-btn"
                :class="{ active: activeTab === 'headers' }"
                @click="activeTab = 'headers'"
              >
                Headers ({{ headersCount }})
              </button>
              <button 
                class="tab-btn"
                :class="{ active: activeTab === 'body' }"
                @click="activeTab = 'body'"
              >
                Body
              </button>
            </div>

            <!-- Headers -->
            <div v-if="activeTab === 'headers'" class="tab-panel">
              <div v-for="(header, index) in headers" :key="index" class="header-row">
                <input 
                  type="text" 
                  v-model="header.key"
                  placeholder="Header name"
                />
                <input 
                  type="text" 
                  v-model="header.value"
                  placeholder="Header value"
                />
                <button class="remove-btn" @click="removeHeader(index)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
              <button class="add-btn" @click="addHeader">
                + Add Header
              </button>
            </div>

            <!-- Body -->
            <div v-if="activeTab === 'body'" class="tab-panel">
              <textarea 
                v-model="requestBody"
                class="body-editor"
                placeholder='{"key": "value"}'
                rows="8"
              ></textarea>
              <div v-if="bodyError" class="body-error">{{ bodyError }}</div>
            </div>
          </div>

          <!-- Response Section -->
          <div class="response-section" v-if="response">
            <div class="response-header">
              <h3>Response</h3>
              <div class="response-meta">
                <span 
                  class="status-badge"
                  :class="getStatusClass(response.status)"
                >
                  {{ response.status }} {{ response.statusText }}
                </span>
                <span class="time-badge">{{ responseTime }}ms</span>
              </div>
            </div>

            <div class="response-tabs">
              <button 
                class="tab-btn"
                :class="{ active: responseTab === 'body' }"
                @click="responseTab = 'body'"
              >
                Body
              </button>
              <button 
                class="tab-btn"
                :class="{ active: responseTab === 'headers' }"
                @click="responseTab = 'headers'"
              >
                Headers
              </button>
            </div>

            <div v-if="responseTab === 'body'" class="tab-panel">
              <pre class="response-body"><code>{{ formatResponse(response.data) }}</code></pre>
            </div>

            <div v-if="responseTab === 'headers'" class="tab-panel">
              <table class="headers-table">
                <tbody>
                  <tr v-for="(value, key) in response.headers" :key="key">
                    <td class="header-name">{{ key }}</td>
                    <td class="header-value">{{ value }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Error Section -->
          <div class="error-section" v-if="error">
            <div class="error-box">
              <h4>Error</h4>
              <p>{{ error }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Header {
  key: string;
  value: string;
}

interface ApiResponse {
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
}

const emit = defineEmits<{
  close: [];
}>();

// Request state
const method = ref('GET');
const url = ref('https://api.claudenest.io/api/health');
const authToken = ref('');
const headers = ref<Header[]>([
  { key: 'Content-Type', value: 'application/json' },
  { key: 'Accept', value: 'application/json' },
]);
const requestBody = ref('');
const activeTab = ref<'headers' | 'body'>('headers');

// Response state
const response = ref<ApiResponse | null>(null);
const responseTab = ref<'body' | 'headers'>('body');
const responseTime = ref(0);
const error = ref('');
const isLoading = ref(false);
const bodyError = ref('');

const headersCount = computed(() => {
  return headers.value.filter(h => h.key.trim()).length;
});

const addHeader = () => {
  headers.value.push({ key: '', value: '' });
};

const removeHeader = (index: number) => {
  headers.value.splice(index, 1);
};

const getStatusClass = (status: number): string => {
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'redirect';
  if (status >= 400 && status < 500) return 'client-error';
  if (status >= 500) return 'server-error';
  return 'default';
};

const formatResponse = (data: any): string => {
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return data;
    }
  }
  return JSON.stringify(data, null, 2);
};

const validateBody = (): boolean => {
  if (!requestBody.value.trim()) return true;
  try {
    JSON.parse(requestBody.value);
    bodyError.value = '';
    return true;
  } catch (e) {
    bodyError.value = 'Invalid JSON format';
    return false;
  }
};

const sendRequest = async () => {
  if (!url.value) {
    error.value = 'Please enter a URL';
    return;
  }

  if (!validateBody()) {
    return;
  }

  isLoading.value = true;
  error.value = '';
  response.value = null;

  const startTime = performance.now();

  try {
    // Build headers
    const requestHeaders: Record<string, string> = {};
    
    headers.value.forEach(header => {
      if (header.key.trim()) {
        requestHeaders[header.key] = header.value;
      }
    });

    // Add auth token if provided
    if (authToken.value) {
      requestHeaders['Authorization'] = authToken.value.startsWith('Bearer ') 
        ? authToken.value 
        : `Bearer ${authToken.value}`;
    }

    // Make request
    const options: RequestInit = {
      method: method.value,
      headers: requestHeaders,
    };

    if (['POST', 'PUT', 'PATCH'].includes(method.value) && requestBody.value) {
      options.body = requestBody.value;
    }

    const res = await fetch(url.value, options);
    
    responseTime.value = Math.round(performance.now() - startTime);

    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    // Convert headers to plain object
    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    response.value = {
      status: res.status,
      statusText: res.statusText,
      data,
      headers: responseHeaders,
    };
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.api-tester-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.api-tester-modal {
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  background: #16162a;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tester-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.tester-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  color: #e2e8f0;
  margin: 0;
}

.tester-header h2 svg {
  width: 24px;
  height: 24px;
  color: #a855f7;
}

.close-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

.close-btn svg {
  width: 24px;
  height: 24px;
}

.tester-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.request-section,
.response-section {
  margin-bottom: 1.5rem;
}

.request-section h3,
.response-section h3 {
  font-size: 0.9rem;
  color: #94a3b8;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.request-line {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.method-select {
  padding: 0.6rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 0.9rem;
  cursor: pointer;
}

.url-input {
  flex: 1;
  padding: 0.6rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 0.9rem;
  font-family: 'JetBrains Mono', monospace;
}

.url-input::placeholder {
  color: #64748b;
}

.send-btn {
  padding: 0.6rem 1.5rem;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 80px;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
}

.send-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.input-group {
  margin-bottom: 1rem;
}

.input-group label {
  display: block;
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 0.4rem;
}

.input-group input {
  width: 100%;
  padding: 0.6rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 0.9rem;
  font-family: 'JetBrains Mono', monospace;
}

.request-tabs,
.response-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-btn {
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #64748b;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -1px;
}

.tab-btn:hover {
  color: #e2e8f0;
}

.tab-btn.active {
  color: #a855f7;
  border-bottom-color: #a855f7;
}

.tab-panel {
  padding: 0.5rem 0;
}

.header-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.header-row input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 0.85rem;
}

.remove-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.remove-btn svg {
  width: 18px;
  height: 18px;
}

.add-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #64748b;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border-style: solid;
}

.body-editor {
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  resize: vertical;
}

.body-error {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  color: #f87171;
  font-size: 0.85rem;
}

.response-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.response-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-badge {
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.success {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.status-badge.redirect {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.status-badge.client-error {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.status-badge.server-error {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.time-badge {
  padding: 0.3rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  font-size: 0.8rem;
  color: #94a3b8;
}

.response-body {
  background: #0d1117;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-break: break-word;
}

.headers-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.headers-table td {
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-name {
  color: #a855f7;
  font-weight: 500;
  width: 40%;
}

.header-value {
  color: #86efac;
  word-break: break-all;
}

.error-box {
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
}

.error-box h4 {
  margin: 0 0 0.5rem 0;
  color: #f87171;
}

.error-box p {
  margin: 0;
  color: #fca5a5;
}

@media (max-width: 640px) {
  .api-tester-modal {
    max-height: 95vh;
  }

  .request-line {
    flex-wrap: wrap;
  }

  .method-select {
    width: auto;
  }

  .url-input {
    flex: 1 1 100%;
    order: 3;
    margin-top: 0.5rem;
  }

  .send-btn {
    order: 2;
  }

  .tester-body {
    padding: 1rem;
  }
}
</style>
