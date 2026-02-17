<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="search-modal" @click="closeOnBackdrop">
        <div class="search-container" @click.stop>
          <!-- Search Input -->
          <div class="search-header">
            <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              ref="inputRef"
              v-model="searchQuery"
              type="text"
              placeholder="Search documentation..."
              class="search-input"
              @keydown.down.prevent="navigateDown"
              @keydown.up.prevent="navigateUp"
              @keydown.enter.prevent="selectCurrent"
              @keydown.esc="close"
            />
            <kbd class="shortcut-hint">ESC</kbd>
          </div>

          <!-- Search Results -->
          <div class="search-results">
            <div v-if="!searchQuery" class="search-placeholder">
              <div class="placeholder-section">
                <h4>Quick Navigation</h4>
                <div class="quick-links">
                  <router-link to="/docs" @click="close">Introduction</router-link>
                  <router-link to="/docs/quickstart" @click="close">Quickstart</router-link>
                  <router-link to="/docs/api/authentication" @click="close">Authentication</router-link>
                  <router-link to="/docs/api/machines" @click="close">Machines API</router-link>
                </div>
              </div>
              <div class="placeholder-section">
                <h4>Popular Endpoints</h4>
                <div class="quick-links">
                  <router-link to="/docs/api/sessions" @click="close">POST /api/machines/{id}/sessions</router-link>
                  <router-link to="/docs/api/sessions" @click="close">POST /api/sessions/{id}/attach</router-link>
                  <router-link to="/docs/api/tasks" @click="close">POST /api/projects/{id}/tasks</router-link>
                </div>
              </div>
            </div>

            <template v-else-if="searchResults.length > 0">
              <div class="results-list">
                <div
                  v-for="(result, index) in searchResults"
                  :key="index"
                  class="result-item"
                  :class="{ 'is-active': selectedIndex === index }"
                  @click="selectResult(result)"
                  @mouseenter="selectedIndex = index"
                >
                  <template v-if="result.type === 'nav'">
                    <div class="result-icon nav">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                      </svg>
                    </div>
                    <div class="result-content">
                      <div class="result-title">{{ result.data.item.title }}</div>
                      <div class="result-subtitle">
                        {{ result.data.section.title }} — {{ result.data.item.description }}
                      </div>
                    </div>
                  </template>
                  
                  <template v-else-if="result.type === 'endpoint'">
                    <div class="result-icon endpoint">
                      <span :style="{ color: getMethodColor(result.data.endpoint.method) }">
                        {{ result.data.endpoint.method }}
                      </span>
                    </div>
                    <div class="result-content">
                      <div class="result-title">{{ result.data.endpoint.path }}</div>
                      <div class="result-subtitle">
                        {{ result.data.category.title }} — {{ result.data.endpoint.description }}
                      </div>
                    </div>
                  </template>
                </div>
              </div>
              <div class="results-footer">
                <span>{{ searchResults.length }} results</span>
                <span class="nav-hint">
                  <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>↵</kbd> to select
                </span>
              </div>
            </template>

            <div v-else-if="searchQuery" class="no-results">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <p>No results found for "{{ searchQuery }}"</p>
              <span>Try different keywords or check your spelling</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useDocs } from '@/composables/useDocs';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const router = useRouter();
const { searchQuery, searchResults, performSearch, getMethodColor, navigateToResult } = useDocs();

const inputRef = ref<HTMLInputElement>();
const selectedIndex = ref(0);

// Reset state when modal opens
watch(() => props.modelValue, (value) => {
  if (value) {
    searchQuery.value = '';
    selectedIndex.value = 0;
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
});

// Update search when query changes
watch(searchQuery, () => {
  performSearch(searchQuery.value);
  selectedIndex.value = 0;
});

const close = () => {
  emit('update:modelValue', false);
};

const closeOnBackdrop = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    close();
  }
};

const navigateDown = () => {
  selectedIndex.value = Math.min(selectedIndex.value + 1, searchResults.value.length - 1);
};

const navigateUp = () => {
  selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
};

const selectCurrent = () => {
  const result = searchResults.value[selectedIndex.value];
  if (result) {
    selectResult(result);
  }
};

const selectResult = (result: { type: 'nav' | 'endpoint'; data: any }) => {
  navigateToResult(result);
  close();
};
</script>

<style scoped>
.search-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
}

.search-container {
  width: 100%;
  max-width: 640px;
  background: var(--bg-secondary, var(--surface-2));
  border: 1px solid var(--border-color, var(--border));
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.search-icon {
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 1rem;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.shortcut-hint {
  font-family: inherit;
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  background: color-mix(in srgb, var(--text-primary) 10%, transparent);
  border-radius: 4px;
  color: var(--text-muted);
}

/* Results */
.search-results {
  max-height: 60vh;
  overflow-y: auto;
}

.search-placeholder {
  padding: 1.5rem;
}

.placeholder-section {
  margin-bottom: 1.5rem;
}

.placeholder-section:last-child {
  margin-bottom: 0;
}

.placeholder-section h4 {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin: 0 0 0.75rem;
}

.quick-links {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.quick-links a {
  padding: 0.5rem 0.75rem;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.15s;
}

.quick-links a:hover {
  background: color-mix(in srgb, var(--text-primary) 5%, transparent);
  color: var(--text-primary);
}

/* Results List */
.results-list {
  padding: 0.5rem;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.result-item:hover,
.result-item.is-active {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
}

.result-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--text-primary) 5%, transparent);
  border-radius: 8px;
  flex-shrink: 0;
}

.result-icon.nav svg {
  width: 18px;
  height: 18px;
  color: var(--accent-purple, #a855f7);
}

.result-icon.endpoint span {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 0.125rem;
}

.results-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border-color, var(--border));
  font-size: 0.75rem;
  color: var(--text-muted);
}

.nav-hint kbd {
  font-family: inherit;
  padding: 0.1rem 0.3rem;
  background: color-mix(in srgb, var(--text-primary) 10%, transparent);
  border-radius: 4px;
  margin: 0 0.125rem;
}

/* No Results */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.no-results svg {
  width: 48px;
  height: 48px;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.no-results p {
  color: var(--text-secondary);
  margin: 0 0 0.5rem;
}

.no-results span {
  color: var(--text-muted);
  font-size: 0.85rem;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .search-container,
.modal-leave-active .search-container {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from .search-container,
.modal-leave-to .search-container {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}
</style>
