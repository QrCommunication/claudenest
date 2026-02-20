<template>
  <div class="credentials-page">
    <div class="page-header">
      <div>
        <h1>Credentials</h1>
        <p class="page-subtitle">Manage your Claude API keys and OAuth tokens</p>
      </div>
      <button class="btn-primary" @click="showAddModal = true">
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Add Credential
      </button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner-lg"></div>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="loadCredentials">Retry</button>
    </div>

    <div v-else-if="credentials.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="currentColor" class="empty-icon">
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
      </svg>
      <h3>No credentials yet</h3>
      <p>Add your first Claude API key or OAuth token to get started.</p>
      <button class="btn-primary" @click="showAddModal = true">Add Credential</button>
    </div>

    <div v-else class="credentials-grid">
      <CredentialCard
        v-for="credential in credentials"
        :key="credential.id"
        :credential="credential"
        @test="handleTest"
        @refresh="handleRefresh"
        @capture="handleCapture"
        @set-default="handleSetDefault"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <AddCredentialModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @created="onCredentialCreated"
    />

    <EditCredentialModal
      v-if="editingCredential"
      :credential="editingCredential"
      @close="editingCredential = null"
      @updated="onCredentialUpdated"
    />

    <CaptureOAuthModal
      v-if="capturingCredentialId"
      :credential-id="capturingCredentialId"
      @close="capturingCredentialId = null"
      @captured="onCaptureComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCredentialsStore } from '@/stores/credentials';
import { useToast } from '@/composables/useToast';
import { getErrorMessage } from '@/utils/api';
import { storeToRefs } from 'pinia';
import CredentialCard from './CredentialCard.vue';
import AddCredentialModal from './AddCredentialModal.vue';
import EditCredentialModal from './EditCredentialModal.vue';
import CaptureOAuthModal from './CaptureOAuthModal.vue';
import type { Credential } from '@/types';

const store = useCredentialsStore();
const toast = useToast();
const { credentials, isLoading, error } = storeToRefs(store);
const showAddModal = ref(false);
const editingCredential = ref<Credential | null>(null);
const capturingCredentialId = ref<string | null>(null);

onMounted(() => {
  loadCredentials();
});

async function loadCredentials(): Promise<void> {
  try {
    await store.fetchCredentials();
  } catch (error) {
    toast.error('Failed to load credentials', getErrorMessage(error));
  }
}

function onCredentialCreated(): void {
  showAddModal.value = false;
  toast.success('Credential created');
}

async function handleTest(id: string): Promise<void> {
  try {
    const result = await store.testCredential(id);
    if (result.valid) {
      toast.success('Credential is valid');
    } else {
      toast.error('Credential is invalid', String(result.reason || result.token_status || ''));
    }
  } catch (error) {
    toast.error('Test failed', getErrorMessage(error));
  }
}

async function handleRefresh(id: string): Promise<void> {
  try {
    await store.refreshCredential(id);
    toast.success('Token refreshed');
  } catch (error) {
    toast.error('Refresh failed', getErrorMessage(error));
  }
}

function handleCapture(id: string): void {
  capturingCredentialId.value = id;
}

function onCaptureComplete(): void {
  capturingCredentialId.value = null;
  loadCredentials();
}

async function handleSetDefault(id: string): Promise<void> {
  try {
    await store.setDefault(id);
    toast.success('Default credential updated');
  } catch (error) {
    toast.error('Failed to set default', getErrorMessage(error));
  }
}

function handleEdit(credential: Credential): void {
  editingCredential.value = credential;
}

function onCredentialUpdated(): void {
  editingCredential.value = null;
  toast.success('Credential updated');
}

async function handleDelete(id: string): Promise<void> {
  if (!confirm('Delete this credential? This cannot be undone.')) return;
  try {
    await store.deleteCredential(id);
    toast.success('Credential deleted');
  } catch (error) {
    toast.error('Failed to delete', getErrorMessage(error));
  }
}
</script>

<style scoped>
.credentials-page {
  @apply p-6;
}

.page-header {
  @apply flex items-center justify-between mb-8;
}

.page-header h1 {
  @apply text-2xl font-bold;
  color: var(--text-primary, #c0caf5);
}

.page-subtitle {
  @apply text-sm mt-1;
  color: var(--text-muted, #6b7280);
}

.btn-primary {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white;
  @apply bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-90 transition-opacity;
}

.btn-secondary {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
  color: var(--text-secondary, #9ca3af);
  background: var(--bg-tertiary, #24283b);
}

.btn-secondary:hover {
  color: var(--text-primary, #c0caf5);
}

.credentials-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.loading-state {
  @apply flex justify-center py-20;
}

.spinner-lg {
  @apply w-8 h-8 border-2 border-brand-purple/30 border-t-brand-purple rounded-full;
  animation: spin 1s linear infinite;
}

.error-state {
  @apply text-center py-20 text-red-400;
}

.error-state p {
  @apply mb-4;
}

.empty-state {
  @apply text-center py-20;
}

.empty-icon {
  @apply w-16 h-16 mx-auto mb-4;
  color: var(--text-muted, #6b7280);
}

.empty-state h3 {
  @apply text-lg font-semibold mb-2;
  color: var(--text-primary, #c0caf5);
}

.empty-state p {
  @apply mb-6;
  color: var(--text-muted, #6b7280);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
