<template>
  <div class="response-example">
    <div class="response-tabs">
      <button 
        v-for="(_, status) in responses" 
        :key="status"
        class="response-tab"
        :class="{ active: selectedStatus === status, [getStatusClass(status)]: true }"
        @click="selectedStatus = status"
      >
        {{ status }}
      </button>
    </div>
    
    <div class="response-content">
      <CodeBlock 
        :code="currentResponse" 
        language="json"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CodeBlock from './CodeBlock.vue';

interface ResponseExamples {
  [statusCode: string]: any;
}

interface Props {
  responses: ResponseExamples;
}

const props = defineProps<Props>();

const selectedStatus = ref(Object.keys(props.responses)[0] || '200');

const currentResponse = computed(() => {
  const response = props.responses[selectedStatus.value];
  if (typeof response === 'string') {
    return response;
  }
  return JSON.stringify(response, null, 2);
});

const getStatusClass = (status: string): string => {
  const code = parseInt(status);
  if (code >= 200 && code < 300) return 'success';
  if (code >= 300 && code < 400) return 'redirect';
  if (code >= 400 && code < 500) return 'client-error';
  if (code >= 500) return 'server-error';
  return 'default';
};
</script>

<style scoped>
.response-example {
  margin: 1rem 0;
  border-radius: 12px;
  overflow: hidden;
  background: #0d1117;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.response-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  overflow-x: auto;
}

.response-tab {
  padding: 0.4rem 0.8rem;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.response-tab:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
}

.response-tab.active {
  color: #fff;
}

.response-tab.active.success {
  background: rgba(34, 197, 94, 0.2);
}

.response-tab.active.redirect {
  background: rgba(59, 130, 246, 0.2);
}

.response-tab.active.client-error {
  background: rgba(245, 158, 11, 0.2);
}

.response-tab.active.server-error {
  background: rgba(239, 68, 68, 0.2);
}

.response-tab.success {
  color: #4ade80;
}

.response-tab.redirect {
  color: #60a5fa;
}

.response-tab.client-error {
  color: #fbbf24;
}

.response-tab.server-error {
  color: #f87171;
}

.response-content :deep(.code-block) {
  margin: 0;
  border: none;
  border-radius: 0;
}

.response-content :deep(.code-header) {
  display: none;
}
</style>
