<template>
  <div class="context-viewer-page">
    <div class="context-header">
      <RAGSearch :project-id="projectId" @search="onSearch" />
      <Button 
        variant="secondary" 
        @click="summarizeContext"
        :loading="contextStore.isSummarizing"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
        Summarize
      </Button>
    </div>

    <!-- Search Results -->
    <div v-if="contextStore.queryResults.length > 0" class="search-results">
      <div class="results-header">
        <h3>Search Results</h3>
        <button class="close-btn" @click="contextStore.clearQueryResults">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      <div class="results-list">
        <div 
          v-for="result in contextStore.queryResults" 
          :key="result.id"
          class="result-item"
        >
          <div class="result-header">
            <span class="result-type" :class="result.type">{{ result.type }}</span>
            <span class="result-score" v-if="result.similarity">
              {{ Math.round(result.similarity * 100) }}% match
            </span>
          </div>
          <p class="result-content">{{ result.content }}</p>
          <div class="result-meta">
            <span v-if="result.files?.length">{{ result.files.length }} files</span>
            <span>{{ formatRelativeTime(result.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Context Editor -->
    <div class="context-layout">
      <div class="context-main">
        <Card title="Project Context" class="context-card">
          <div class="context-sections">
            <!-- Summary -->
            <div class="context-section">
              <div class="section-header">
                <h4>Summary</h4>
                <button 
                  class="edit-btn"
                  @click="toggleEdit('summary')"
                >
                  {{ editing.summary ? 'Done' : 'Edit' }}
                </button>
              </div>
              <ContextEditor
                v-model="contextForm.summary"
                :editable="editing.summary"
                placeholder="Project summary..."
              />
            </div>

            <!-- Architecture -->
            <div class="context-section">
              <div class="section-header">
                <h4>Architecture</h4>
                <button 
                  class="edit-btn"
                  @click="toggleEdit('architecture')"
                >
                  {{ editing.architecture ? 'Done' : 'Edit' }}
                </button>
              </div>
              <ContextEditor
                v-model="contextForm.architecture"
                :editable="editing.architecture"
                placeholder="System architecture..."
              />
            </div>

            <!-- Conventions -->
            <div class="context-section">
              <div class="section-header">
                <h4>Conventions</h4>
                <button 
                  class="edit-btn"
                  @click="toggleEdit('conventions')"
                >
                  {{ editing.conventions ? 'Done' : 'Edit' }}
                </button>
              </div>
              <ContextEditor
                v-model="contextForm.conventions"
                :editable="editing.conventions"
                placeholder="Coding conventions..."
              />
            </div>

            <!-- Current Focus -->
            <div class="context-section">
              <div class="section-header">
                <h4>Current Focus</h4>
                <button 
                  class="edit-btn"
                  @click="toggleEdit('current_focus')"
                >
                  {{ editing.current_focus ? 'Done' : 'Edit' }}
                </button>
              </div>
              <ContextEditor
                v-model="contextForm.current_focus"
                :editable="editing.current_focus"
                placeholder="What the team is currently working on..."
              />
            </div>

            <!-- Recent Changes -->
            <div class="context-section">
              <div class="section-header">
                <h4>Recent Changes</h4>
                <button 
                  class="edit-btn"
                  @click="toggleEdit('recent_changes')"
                >
                  {{ editing.recent_changes ? 'Done' : 'Edit' }}
                </button>
              </div>
              <ContextEditor
                v-model="contextForm.recent_changes"
                :editable="editing.recent_changes"
                placeholder="Recent updates and changes..."
              />
            </div>
          </div>

          <div class="context-actions">
            <Button 
              variant="primary"
              :loading="contextStore.isLoading"
              @click="saveContext"
            >
              Save Changes
            </Button>
          </div>
        </Card>
      </div>

      <div class="context-sidebar">
        <!-- Token Usage -->
        <Card title="Token Usage" class="token-card">
          <div class="token-display">
            <div class="token-circle">
              <svg viewBox="0 0 36 36">
                <path
                  class="token-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  class="token-progress"
                  :stroke-dasharray="`${tokenUsage}, 100`"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div class="token-percent">{{ Math.round(tokenUsage) }}%</div>
            </div>
            <div class="token-stats">
              <div class="token-stat">
                <span class="token-value">{{ contextStore.projectContext?.total_tokens?.toLocaleString() ?? 0 }}</span>
                <span class="token-label">Used</span>
              </div>
              <div class="token-stat">
                <span class="token-value">{{ contextStore.projectContext?.max_tokens?.toLocaleString() ?? 0 }}</span>
                <span class="token-label">Max</span>
              </div>
            </div>
          </div>
        </Card>

        <!-- Recent Chunks -->
        <Card title="Recent Context Chunks" class="chunks-card">
          <div v-if="contextStore.isLoading" class="loading-small">
            <div class="spinner-small" />
          </div>
          <div v-else-if="contextStore.contextChunks.length === 0" class="empty-chunks">
            No context chunks yet
          </div>
          <div v-else class="chunks-list">
            <div 
              v-for="chunk in contextStore.recentChunks" 
              :key="chunk.id"
              class="chunk-item"
            >
              <div class="chunk-header">
                <span class="chunk-type" :class="chunk.type">{{ chunk.type }}</span>
                <span class="chunk-score">{{ Math.round((chunk.importance_score ?? 0.5) * 100) }}%</span>
              </div>
              <p class="chunk-preview">{{ truncate(chunk.content, 100) }}</p>
              <div class="chunk-meta">
                <span v-if="chunk.files?.length">{{ chunk.files.length }} files</span>
                <span>{{ formatRelativeTime(chunk.created_at) }}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useContextStore } from '@/stores/context';
import { useToast } from '@/composables/useToast';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import RAGSearch from '@/components/projects/RAGSearch.vue';
import ContextEditor from '@/components/projects/ContextEditor.vue';

const props = defineProps<{
  projectId?: string;
}>();

const route = useRoute();
const contextStore = useContextStore();
const toast = useToast();

const projectId = computed(() => props.projectId || route.params.id as string);

const editing = ref({
  summary: false,
  architecture: false,
  conventions: false,
  current_focus: false,
  recent_changes: false,
});

const contextForm = ref({
  summary: '',
  architecture: '',
  conventions: '',
  current_focus: '',
  recent_changes: '',
});

const tokenUsage = computed(() => 
  contextStore.tokenUsagePercent
);

onMounted(async () => {
  await loadContext();
});

watch(projectId, async () => {
  await loadContext();
});

watch(() => contextStore.projectContext, (context) => {
  if (context) {
    contextForm.value = {
      summary: context.summary || '',
      architecture: context.architecture || '',
      conventions: context.conventions || '',
      current_focus: context.current_focus || '',
      recent_changes: context.recent_changes || '',
    };
  }
}, { immediate: true });

async function loadContext() {
  if (!projectId.value) return;
  
  try {
    await Promise.all([
      contextStore.fetchContext(projectId.value),
      contextStore.fetchChunks(projectId.value, { limit: 10 }),
    ]);
  } catch (err) {
    toast.error('Failed to load context');
  }
}

function toggleEdit(field: keyof typeof editing.value) {
  editing.value[field] = !editing.value[field];
}

async function saveContext() {
  if (!projectId.value) return;
  
  try {
    await contextStore.updateContext(projectId.value, contextForm.value);
    
    // Disable all editing modes
    Object.keys(editing.value).forEach(key => {
      editing.value[key as keyof typeof editing.value] = false;
    });
    
    toast.success('Context updated successfully');
  } catch (err) {
    toast.error('Failed to update context');
  }
}

async function summarizeContext() {
  if (!projectId.value) return;
  
  try {
    await contextStore.summarizeContext(projectId.value);
    toast.success('Context summarized successfully');
  } catch (err) {
    toast.error('Failed to summarize context');
  }
}

function onSearch(results: any[]) {
  // Results are automatically stored in the store
}

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
</script>

<style scoped>
.context-viewer-page {
  @apply space-y-6;
}

.context-header {
  @apply flex items-center gap-4;
}

.search-results {
  @apply bg-surface-2 rounded-xl border border-skin p-4;
}

.results-header {
  @apply flex items-center justify-between mb-4;
}

.results-header h3 {
  @apply text-lg font-semibold text-skin-primary;
}

.close-btn {
  @apply p-1 text-skin-secondary hover:text-skin-primary transition-colors;
}

.close-btn svg {
  @apply w-5 h-5;
}

.results-list {
  @apply space-y-3;
}

.result-item {
  @apply p-4 bg-surface-3 rounded-lg;
}

.result-header {
  @apply flex items-center justify-between mb-2;
}

.result-type {
  @apply text-xs px-2 py-1 rounded font-medium;
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
  @apply text-xs text-skin-secondary;
}

.result-content {
  @apply text-sm text-skin-primary line-clamp-3;
}

.result-meta {
  @apply flex items-center gap-4 mt-2 text-xs text-skin-secondary;
}

.context-layout {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-6;
}

.context-main {
  @apply lg:col-span-2;
}

.context-card {
  @apply space-y-6;
}

.context-sections {
  @apply space-y-6;
}

.context-section {
  @apply space-y-3;
}

.section-header {
  @apply flex items-center justify-between;
}

.section-header h4 {
  @apply text-sm font-semibold text-skin-primary uppercase tracking-wide;
}

.edit-btn {
  @apply text-xs text-brand-purple hover:underline;
}

.context-actions {
  @apply pt-4 border-t border-skin;
}

.context-sidebar {
  @apply space-y-6;
}

.token-card {
  @apply space-y-4;
}

.token-display {
  @apply flex items-center gap-6;
}

.token-circle {
  @apply relative w-24 h-24;
}

.token-circle svg {
  @apply w-full h-full transform -rotate-90;
}

.token-bg {
  fill: none;
  stroke: var(--border);
  stroke-width: 3;
}

.token-progress {
  @apply fill-none stroke-brand-purple;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s ease;
}

.token-percent {
  @apply absolute inset-0 flex items-center justify-center text-xl font-bold text-skin-primary;
}

.token-stats {
  @apply flex flex-col gap-2;
}

.token-stat {
  @apply flex flex-col;
}

.token-value {
  @apply text-lg font-semibold text-skin-primary;
}

.token-label {
  @apply text-xs text-skin-secondary;
}

.chunks-card {
  @apply space-y-4;
}

.loading-small {
  @apply flex justify-center py-8;
}

.spinner-small {
  @apply w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin;
}

.empty-chunks {
  @apply text-center text-skin-secondary py-8;
}

.chunks-list {
  @apply space-y-3 max-h-96 overflow-y-auto;
}

.chunk-item {
  @apply p-3 bg-surface-3 rounded-lg;
}

.chunk-header {
  @apply flex items-center justify-between mb-2;
}

.chunk-type {
  @apply text-xs px-2 py-0.5 rounded;
}

.chunk-type.task_completion {
  @apply bg-green-500/10 text-green-400;
}

.chunk-type.context_update {
  @apply bg-blue-500/10 text-blue-400;
}

.chunk-type.file_change {
  @apply bg-orange-500/10 text-orange-400;
}

.chunk-type.decision {
  @apply bg-purple-500/10 text-purple-400;
}

.chunk-type.summary {
  @apply bg-brand-purple/10 text-brand-purple;
}

.chunk-type.broadcast {
  @apply bg-brand-cyan/10 text-brand-cyan;
}

.chunk-score {
  @apply text-xs text-skin-secondary;
}

.chunk-preview {
  @apply text-sm text-skin-primary line-clamp-2;
}

.chunk-meta {
  @apply flex items-center gap-3 mt-2 text-xs text-skin-secondary;
}
</style>
