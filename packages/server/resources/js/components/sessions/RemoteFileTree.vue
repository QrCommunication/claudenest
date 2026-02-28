<template>
  <div class="remote-file-tree">
    <!-- Breadcrumb -->
    <div v-if="currentPath" class="breadcrumb">
      <button
        v-for="(segment, index) in breadcrumbSegments"
        :key="index"
        class="breadcrumb-segment"
        @click="navigateTo(segment.path)"
      >
        <span v-if="index > 0" class="breadcrumb-sep">/</span>
        <span :class="{ 'breadcrumb-current': index === breadcrumbSegments.length - 1 }">
          {{ segment.label }}
        </span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && entries.length === 0" class="tree-status">
      <span class="spinner-sm"></span>
      {{ $t('sessions.create.loading_tree') }}
    </div>

    <!-- Error -->
    <div v-else-if="error" class="tree-error">
      <svg viewBox="0 0 24 24" fill="currentColor" class="icon-sm">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      {{ $t('sessions.create.browse_error') }}
      <button class="retry-btn" @click="loadDirectory()">{{ $t('sessions.terminal.retry') }}</button>
    </div>

    <!-- Empty -->
    <div v-else-if="!isLoading && entries.length === 0 && currentPath" class="tree-empty">
      {{ $t('sessions.create.empty_directory') }}
    </div>

    <!-- Entries -->
    <div v-else class="tree-entries">
      <!-- Parent directory -->
      <button
        v-if="canGoUp"
        class="tree-entry"
        @click="goUp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" class="icon-folder">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        <span class="entry-name">..</span>
      </button>

      <button
        v-for="entry in entries"
        :key="entry.name"
        class="tree-entry"
        :class="{ 'entry-selected': isSelected(entry) }"
        @click="handleEntryClick(entry)"
        @dblclick="handleEntryDblClick(entry)"
      >
        <!-- Folder icon -->
        <svg v-if="entry.type === 'directory'" viewBox="0 0 24 24" fill="currentColor" class="icon-folder">
          <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
        </svg>
        <!-- File icon -->
        <svg v-else viewBox="0 0 24 24" fill="currentColor" class="icon-file">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
        </svg>
        <span class="entry-name">{{ entry.name }}</span>
        <span v-if="isLoading && expandingPath === fullPath(entry)" class="spinner-xs"></span>
      </button>
    </div>

    <!-- Selected path display -->
    <div v-if="selectedPath" class="selected-display">
      <span class="selected-label">{{ $t('sessions.create.selected_path') }}:</span>
      <code class="selected-path">{{ selectedPath }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/utils/api';

interface FileEntry {
  name: string;
  type: 'directory' | 'file';
  size?: number;
  modifiedAt?: string;
}

interface Props {
  machineId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'select', path: string): void;
}>();

const { t } = useI18n();

const entries = ref<FileEntry[]>([]);
const currentPath = ref('');
const homePath = ref('');
const selectedPath = ref('');
const isLoading = ref(false);
const error = ref(false);
const expandingPath = ref('');

const canGoUp = computed(() => {
  return currentPath.value && currentPath.value !== homePath.value;
});

const breadcrumbSegments = computed(() => {
  if (!currentPath.value || !homePath.value) return [];

  const segments: { label: string; path: string }[] = [];
  segments.push({ label: '~', path: homePath.value });

  if (currentPath.value !== homePath.value) {
    const relative = currentPath.value.slice(homePath.value.length);
    const parts = relative.split('/').filter(Boolean);
    let accumulated = homePath.value;
    for (const part of parts) {
      accumulated += '/' + part;
      segments.push({ label: part, path: accumulated });
    }
  }

  return segments;
});

function fullPath(entry: FileEntry): string {
  return currentPath.value + '/' + entry.name;
}

function isSelected(entry: FileEntry): boolean {
  return selectedPath.value === fullPath(entry);
}

async function loadDirectory(path?: string): Promise<void> {
  isLoading.value = true;
  error.value = false;

  try {
    const params: Record<string, string> = { dirs_only: 'true' };
    if (path) params.path = path;

    const response = await api.get(`/machines/${props.machineId}/browse`, { params });
    const data = response.data.data;

    entries.value = data.entries;
    currentPath.value = data.path;
    homePath.value = data.home_path;
  } catch {
    error.value = true;
    entries.value = [];
  } finally {
    isLoading.value = false;
    expandingPath.value = '';
  }
}

function handleEntryClick(entry: FileEntry): void {
  if (entry.type === 'directory') {
    const path = fullPath(entry);
    selectedPath.value = path;
    emit('select', path);
  }
}

function handleEntryDblClick(entry: FileEntry): void {
  if (entry.type === 'directory') {
    expandingPath.value = fullPath(entry);
    loadDirectory(fullPath(entry));
  }
}

function navigateTo(path: string): void {
  selectedPath.value = path;
  emit('select', path);
  loadDirectory(path);
}

function goUp(): void {
  const parentPath = currentPath.value.replace(/\/[^/]+$/, '');
  if (parentPath && parentPath.length >= homePath.value.length) {
    loadDirectory(parentPath);
  }
}

// Load root when machineId changes
watch(
  () => props.machineId,
  (newId) => {
    if (newId) {
      entries.value = [];
      currentPath.value = '';
      selectedPath.value = '';
      error.value = false;
      loadDirectory();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.remote-file-tree {
  @apply rounded-lg border border-skin bg-surface-3 overflow-hidden;
}

.breadcrumb {
  @apply flex items-center gap-0 px-3 py-2 border-b border-skin bg-surface-2 text-xs overflow-x-auto;
}

.breadcrumb-segment {
  @apply text-skin-secondary hover:text-skin-primary transition-colors whitespace-nowrap;
}

.breadcrumb-sep {
  @apply text-skin-muted mx-1;
}

.breadcrumb-current {
  @apply text-skin-primary font-medium;
}

.tree-status {
  @apply flex items-center gap-2 p-4 text-sm text-skin-secondary;
}

.tree-error {
  @apply flex items-center gap-2 p-4 text-sm text-red-400;
}

.tree-empty {
  @apply p-4 text-sm text-skin-muted text-center;
}

.retry-btn {
  @apply ml-2 text-xs text-brand-purple hover:underline;
}

.tree-entries {
  @apply max-h-64 overflow-y-auto;
}

.tree-entry {
  @apply flex items-center gap-2 w-full px-3 py-1.5 text-sm text-skin-secondary;
  @apply hover:bg-surface-4 transition-colors cursor-pointer text-left;
}

.tree-entry.entry-selected {
  @apply bg-brand-purple/10 text-white;
}

.icon-folder {
  @apply w-4 h-4 text-brand-purple flex-shrink-0;
}

.icon-file {
  @apply w-4 h-4 text-skin-muted flex-shrink-0;
}

.icon-sm {
  @apply w-4 h-4 flex-shrink-0;
}

.entry-name {
  @apply truncate;
}

.selected-display {
  @apply flex items-center gap-2 px-3 py-2 border-t border-skin text-xs;
}

.selected-label {
  @apply text-skin-muted whitespace-nowrap;
}

.selected-path {
  @apply text-brand-cyan truncate;
}

.spinner-sm {
  @apply w-4 h-4 border-2 border-skin border-t-brand-purple rounded-full flex-shrink-0;
  animation: spin 1s linear infinite;
}

.spinner-xs {
  @apply w-3 h-3 border border-skin border-t-brand-purple rounded-full flex-shrink-0 ml-auto;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
