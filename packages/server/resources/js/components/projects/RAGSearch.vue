<template>
  <div class="rag-search">
    <div class="search-input-wrapper">
      <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
      <input
        v-model="query"
        type="text"
        placeholder="Search context with RAG..."
        @keyup.enter="search"
      />
      <button 
        v-if="query"
        class="clear-btn"
        @click="clear"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
      <Button 
        variant="primary" 
        size="sm"
        :loading="contextStore.isQuerying"
        @click="search"
      >
        Search
      </Button>
    </div>

    <div v-if="contextStore.queryResults.length > 0" class="search-results-dropdown">
      <div class="results-header">
        <span>{{ contextStore.queryResults.length }} results found</span>
        <button @click="clear">Clear</button>
      </div>
      <div class="results-list">
        <div 
          v-for="result in contextStore.queryResults.slice(0, 5)" 
          :key="result.id"
          class="result-item"
          @click="selectResult(result)"
        >
          <div class="result-meta">
            <span class="result-type" :class="result.type">{{ result.type }}</span>
            <span v-if="result.similarity" class="result-score">
              {{ Math.round(result.similarity * 100) }}%
            </span>
          </div>
          <p class="result-text">{{ truncate(result.content, 120) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useContextStore } from '@/stores/context';
import Button from '@/components/common/Button.vue';
import type { ContextQueryResult } from '@/types';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  search: [results: ContextQueryResult[]];
  select: [result: ContextQueryResult];
}>();

const contextStore = useContextStore();

const query = ref('');

async function search() {
  if (!query.value.trim()) return;
  
  try {
    const results = await contextStore.queryContext(props.projectId, query.value, {
      limit: 10,
    });
    emit('search', results);
  } catch (err) {
    // Error handled by store
  }
}

function clear() {
  query.value = '';
  contextStore.clearQueryResults();
}

function selectResult(result: ContextQueryResult) {
  emit('select', result);
}

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}
</script>

<style scoped>
.rag-search {
  @apply relative flex-1 max-w-xl;
}

.search-input-wrapper {
  @apply flex items-center gap-2;
}

.search-icon {
  @apply absolute left-3 w-5 h-5 text-gray-400 pointer-events-none;
}

.search-input-wrapper input {
  @apply flex-1 pl-10 pr-10 py-2 bg-dark-2 border border-dark-4 rounded-lg text-white;
  @apply focus:outline-none focus:border-brand-purple;
}

.clear-btn {
  @apply absolute right-20 p-1 text-gray-400 hover:text-white transition-colors;
}

.clear-btn svg {
  @apply w-4 h-4;
}

.search-results-dropdown {
  @apply absolute top-full left-0 right-0 mt-2 bg-dark-2 rounded-xl border border-dark-4 shadow-xl z-50;
  @apply max-h-96 overflow-y-auto;
}

.results-header {
  @apply flex items-center justify-between px-4 py-2 border-b border-dark-4 text-sm;
}

.results-header span {
  @apply text-gray-400;
}

.results-header button {
  @apply text-brand-purple hover:underline;
}

.results-list {
  @apply p-2;
}

.result-item {
  @apply p-3 rounded-lg hover:bg-dark-3 cursor-pointer transition-colors;
}

.result-meta {
  @apply flex items-center gap-2 mb-1;
}

.result-type {
  @apply text-xs px-2 py-0.5 rounded font-medium;
}

.result-type.task_completion {
  @apply bg-green-500/10 text-green-400;
}

.result-type.context_update {
  @apply bg-blue-500/10 text-blue-400;
}

.result-type.file_change {
  @apply bg-orange-500/10 text-orange-400;
}

.result-type.decision {
  @apply bg-purple-500/10 text-purple-400;
}

.result-type.summary {
  @apply bg-brand-purple/10 text-brand-purple;
}

.result-type.broadcast {
  @apply bg-brand-cyan/10 text-brand-cyan;
}

.result-score {
  @apply text-xs text-gray-400;
}

.result-text {
  @apply text-sm text-gray-300 line-clamp-2;
}
</style>
