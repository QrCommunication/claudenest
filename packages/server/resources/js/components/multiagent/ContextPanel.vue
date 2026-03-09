<template>
  <div class="context-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
        </svg>
        Project Context
      </h3>
      <div class="panel-actions">
        <button 
          v-if="!isEditing"
          class="action-btn"
          @click="startEditing"
          title="Edit context"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <template v-else>
          <button 
            class="action-btn success"
            @click="saveChanges"
            :disabled="isSaving"
            title="Save changes"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </button>
          <button 
            class="action-btn danger"
            @click="cancelEditing"
            title="Cancel"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </template>
      </div>
    </div>

    <div class="panel-content">
      <!-- Context Tabs -->
      <div class="context-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="context-tab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Summary Tab -->
        <div v-if="activeTab === 'summary'" class="tab-panel">
          <div v-if="!isEditing" class="context-display">
            <p v-if="context.summary" class="context-text">{{ context.summary }}</p>
            <p v-else class="context-empty">No summary set</p>
          </div>
          <textarea 
            v-else
            v-model="editForm.summary"
            class="context-editor"
            rows="12"
            placeholder="Enter project summary..."
          />
        </div>

        <!-- Architecture Tab -->
        <div v-else-if="activeTab === 'architecture'" class="tab-panel">
          <div v-if="!isEditing" class="context-display">
            <pre v-if="context.architecture" class="context-pre">{{ context.architecture }}</pre>
            <p v-else class="context-empty">No architecture defined</p>
          </div>
          <textarea 
            v-else
            v-model="editForm.architecture"
            class="context-editor"
            rows="12"
            placeholder="Describe the system architecture..."
          />
        </div>

        <!-- Conventions Tab -->
        <div v-else-if="activeTab === 'conventions'" class="tab-panel">
          <div v-if="!isEditing" class="context-display">
            <pre v-if="context.conventions" class="context-pre">{{ context.conventions }}</pre>
            <p v-else class="context-empty">No conventions defined</p>
          </div>
          <textarea 
            v-else
            v-model="editForm.conventions"
            class="context-editor"
            rows="12"
            placeholder="Define coding conventions..."
          />
        </div>

        <!-- Current Focus Tab -->
        <div v-else-if="activeTab === 'current_focus'" class="tab-panel">
          <div v-if="!isEditing" class="context-display">
            <p v-if="context.current_focus" class="context-text">{{ context.current_focus }}</p>
            <p v-else class="context-empty">No current focus set</p>
          </div>
          <textarea 
            v-else
            v-model="editForm.current_focus"
            class="context-editor"
            rows="12"
            placeholder="What is the team currently working on?..."
          />
        </div>
      </div>
    </div>

    <!-- Token Usage Footer -->
    <div class="panel-footer">
      <div class="token-usage">
        <span class="token-label">Context Usage</span>
        <div class="token-bar">
          <div 
            class="token-progress" 
            :style="{ width: `${context.token_usage_percent}%` }"
            :class="{ 'is-high': context.token_usage_percent > 80 }"
          />
        </div>
        <span class="token-value">{{ Math.round(context.token_usage_percent) }}%</span>
      </div>
      <span class="token-detail">
        {{ context.total_tokens?.toLocaleString() }} / {{ context.max_tokens?.toLocaleString() }} tokens
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import type { ProjectContext, UpdateContextForm } from '@/types';

interface Props {
  context: ProjectContext;
  isSaving?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSaving: false,
});

const emit = defineEmits<{
  'update': [data: UpdateContextForm];
}>();

const tabs = [
  { id: 'summary', label: 'Summary' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'conventions', label: 'Conventions' },
  { id: 'current_focus', label: 'Current Focus' },
] as const;

type TabId = typeof tabs[number]['id'];

const activeTab = ref<TabId>('summary');
const isEditing = ref(false);

const editForm = reactive<UpdateContextForm>({
  summary: '',
  architecture: '',
  conventions: '',
  current_focus: '',
  recent_changes: '',
});

// Sync form with context when context changes
watch(() => props.context, (newContext) => {
  if (newContext && !isEditing.value) {
    editForm.summary = newContext.summary || '';
    editForm.architecture = newContext.architecture || '';
    editForm.conventions = newContext.conventions || '';
    editForm.current_focus = newContext.current_focus || '';
    editForm.recent_changes = newContext.recent_changes || '';
  }
}, { immediate: true });

function startEditing() {
  // Ensure form is synced with current context
  editForm.summary = props.context.summary || '';
  editForm.architecture = props.context.architecture || '';
  editForm.conventions = props.context.conventions || '';
  editForm.current_focus = props.context.current_focus || '';
  editForm.recent_changes = props.context.recent_changes || '';
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
  // Reset form to current context
  editForm.summary = props.context.summary || '';
  editForm.architecture = props.context.architecture || '';
  editForm.conventions = props.context.conventions || '';
  editForm.current_focus = props.context.current_focus || '';
  editForm.recent_changes = props.context.recent_changes || '';
}

function saveChanges() {
  const data: UpdateContextForm = {};
  
  // Only include changed fields
  if (editForm.summary !== props.context.summary) {
    data.summary = editForm.summary;
  }
  if (editForm.architecture !== props.context.architecture) {
    data.architecture = editForm.architecture;
  }
  if (editForm.conventions !== props.context.conventions) {
    data.conventions = editForm.conventions;
  }
  if (editForm.current_focus !== props.context.current_focus) {
    data.current_focus = editForm.current_focus;
  }
  if (editForm.recent_changes !== props.context.recent_changes) {
    data.recent_changes = editForm.recent_changes;
  }
  
  emit('update', data);
  isEditing.value = false;
}
</script>

<style scoped>
.context-panel {
  @apply bg-surface-2 rounded-xl border border-skin flex flex-col;
}

.panel-header {
  @apply flex items-center justify-between p-4 border-b border-skin;
}

.panel-title {
  @apply flex items-center gap-2 text-lg font-semibold text-skin-primary;
}

.panel-title svg {
  @apply w-5 h-5 text-brand-purple;
}

.panel-actions {
  @apply flex items-center gap-2;
}

.action-btn {
  @apply p-2 rounded-lg text-skin-secondary hover:text-skin-primary hover:bg-surface-3 transition-colors;
}

.action-btn svg {
  @apply w-4 h-4;
}

.action-btn.success {
  @apply hover:text-green-400 hover:bg-green-500/10;
}

.action-btn.danger {
  @apply hover:text-red-400 hover:bg-red-500/10;
}

.action-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.panel-content {
  @apply flex-1 overflow-hidden;
}

.context-tabs {
  @apply flex items-center gap-1 p-2 border-b border-skin overflow-x-auto;
}

.context-tab {
  @apply px-4 py-2 text-sm font-medium text-skin-secondary rounded-lg transition-colors whitespace-nowrap;
}

.context-tab:hover {
  @apply text-skin-primary bg-surface-3;
}

.context-tab.active {
  @apply text-white bg-brand-purple/20 text-brand-purple;
}

.tab-content {
  @apply p-4;
}

.tab-panel {
  @apply h-full;
}

.context-display {
  @apply min-h-[200px];
}

.context-text {
  @apply text-skin-secondary leading-relaxed whitespace-pre-wrap;
}

.context-pre {
  @apply text-skin-secondary leading-relaxed whitespace-pre-wrap font-mono text-sm bg-surface-3 p-4 rounded-lg;
}

.context-empty {
  @apply text-skin-muted italic text-center py-8;
}

.context-editor {
  @apply w-full px-4 py-3 bg-surface-3 border border-skin rounded-lg text-skin-primary resize-none;
  @apply focus:outline-none focus:border-brand-purple font-mono text-sm leading-relaxed;
}

.panel-footer {
  @apply p-4 border-t border-skin space-y-2;
}

.token-usage {
  @apply flex items-center gap-3;
}

.token-label {
  @apply text-sm text-skin-secondary w-24;
}

.token-bar {
  @apply flex-1 h-2 bg-surface-3 rounded-full overflow-hidden;
}

.token-progress {
  @apply h-full bg-gradient-to-r from-brand-purple to-brand-indigo rounded-full transition-all duration-300;
}

.token-progress.is-high {
  @apply bg-gradient-to-r from-orange-500 to-red-500;
}

.token-value {
  @apply text-sm font-medium text-skin-primary w-12 text-right;
}

.token-detail {
  @apply text-xs text-skin-muted text-right block;
}

/* Custom scrollbar for tabs */
.context-tabs::-webkit-scrollbar {
  @apply h-1;
}

.context-tabs::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.context-tabs::-webkit-scrollbar-thumb {
  @apply bg-surface-4 rounded-full;
}
</style>
