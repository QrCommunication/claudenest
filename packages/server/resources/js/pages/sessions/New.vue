<template>
  <div class="new-session-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
      <h1>New Session</h1>
    </div>
    <div class="form-container">
      <div class="card">
        <h2 class="card-title">Start a new session</h2>
        <p class="card-desc">Create a new Claude session on machine: <strong>{{ machineName }}</strong></p>
        
        <div class="form-group">
          <label>Session Mode</label>
          <div class="mode-options">
            <label class="mode-option">
              <input type="radio" value="interactive" v-model="mode" />
              <span class="mode-label">Interactive</span>
              <span class="mode-desc">Full interactive terminal session</span>
            </label>
            <label class="mode-option">
              <input type="radio" value="headless" v-model="mode" />
              <span class="mode-label">Headless</span>
              <span class="mode-desc">Run without terminal UI</span>
            </label>
          </div>
        </div>
        
        <div class="form-group">
          <label for="project_path">Project Path (optional)</label>
          <input 
            id="project_path" 
            v-model="projectPath" 
            type="text" 
            placeholder="/path/to/project"
          />
        </div>
        
        <div class="form-group">
          <label for="prompt">Initial Prompt (optional)</label>
          <textarea 
            id="prompt" 
            v-model="initialPrompt" 
            rows="4"
            placeholder="Enter your initial prompt..."
          ></textarea>
        </div>
        
        <div class="form-actions">
          <button class="btn-secondary" @click="$router.back()">Cancel</button>
          <button class="btn-primary" @click="startSession" :disabled="isStarting">
            <span v-if="isStarting" class="spinner"></span>
            {{ isStarting ? 'Starting...' : 'Start Session' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const mode = ref('interactive');
const projectPath = ref('');
const initialPrompt = ref('');
const isStarting = ref(false);

const machineId = computed(() => route.query.machine as string);
const machineName = computed(() => machineId.value ? 'Selected Machine' : 'Unknown');

async function startSession() {
  isStarting.value = true;
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  isStarting.value = false;
  
  // Redirect to sessions list
  router.push({ name: 'sessions' });
}
</script>

<style scoped>
.new-session-page {
  @apply p-6;
}

.page-header {
  @apply flex items-center gap-4 mb-8;
}

.back-btn {
  @apply p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-2 transition-colors;
}

.back-btn svg {
  @apply w-6 h-6;
}

.page-header h1 {
  @apply text-2xl font-bold text-white;
}

.form-container {
  @apply max-w-2xl;
}

.card {
  @apply bg-dark-2 rounded-xl border border-dark-4 p-6;
}

.card-title {
  @apply text-xl font-semibold text-white mb-2;
}

.card-desc {
  @apply text-gray-400 mb-6;
}

.form-group {
  @apply mb-6;
}

.form-group label {
  @apply block text-sm font-medium text-gray-300 mb-2;
}

.form-group input,
.form-group textarea {
  @apply w-full px-3 py-2 bg-dark-3 border border-dark-4 rounded-lg text-white;
  @apply focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple;
  @apply transition-colors;
}

.form-group textarea {
  @apply resize-none;
}

.mode-options {
  @apply space-y-2;
}

.mode-option {
  @apply flex items-start gap-3 p-3 rounded-lg bg-dark-3 cursor-pointer;
  @apply hover:bg-dark-4 transition-colors;
}

.mode-option input {
  @apply mt-1;
}

.mode-label {
  @apply block text-sm font-medium text-white;
}

.mode-desc {
  @apply block text-xs text-gray-500;
}

.form-actions {
  @apply flex items-center justify-end gap-3 pt-4 border-t border-dark-4;
}

.btn-secondary {
  @apply px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white transition-colors;
}

.btn-primary {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white;
  @apply bg-gradient-to-r from-brand-purple to-brand-indigo;
  @apply hover:opacity-90 transition-opacity;
}

.btn-primary:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.spinner {
  @apply w-4 h-4 border-2 border-white/30 border-t-white rounded-full;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
