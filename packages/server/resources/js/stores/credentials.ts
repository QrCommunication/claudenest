import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api, { getErrorMessage } from '@/utils/api';
import type { Credential, CreateCredentialForm, UpdateCredentialForm, ApiResponse } from '@/types';

export const useCredentialsStore = defineStore('credentials', () => {
  // ==================== STATE ====================
  const credentials = ref<Credential[]>([]);
  const selectedCredential = ref<Credential | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // ==================== GETTERS ====================
  const defaultCredential = computed(() =>
    credentials.value.find(c => c.is_default) || credentials.value[0] || null
  );

  const apiKeyCredentials = computed(() =>
    credentials.value.filter(c => c.auth_type === 'api_key')
  );

  const oauthCredentials = computed(() =>
    credentials.value.filter(c => c.auth_type === 'oauth')
  );

  const expiredCredentials = computed(() =>
    credentials.value.filter(c => c.token_status === 'expired')
  );

  // ==================== ACTIONS ====================
  async function fetchCredentials(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.get<ApiResponse<Credential[]>>('/credentials');
      credentials.value = response.data.data;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function createCredential(form: CreateCredentialForm): Promise<Credential> {
    const response = await api.post<ApiResponse<Credential>>('/credentials', form);
    const created = response.data.data;
    credentials.value.push(created);
    return created;
  }

  async function updateCredential(id: string, form: UpdateCredentialForm): Promise<void> {
    const response = await api.patch<ApiResponse<Credential>>(`/credentials/${id}`, form);
    const updated = response.data.data;
    const idx = credentials.value.findIndex(c => c.id === id);
    if (idx >= 0) credentials.value[idx] = updated;
    if (selectedCredential.value?.id === id) selectedCredential.value = updated;
  }

  async function deleteCredential(id: string): Promise<void> {
    await api.delete(`/credentials/${id}`);
    credentials.value = credentials.value.filter(c => c.id !== id);
    if (selectedCredential.value?.id === id) selectedCredential.value = null;
  }

  async function testCredential(id: string): Promise<Record<string, unknown>> {
    const response = await api.post<ApiResponse<Record<string, unknown>>>(`/credentials/${id}/test`);
    return response.data.data;
  }

  async function refreshCredential(id: string): Promise<Record<string, unknown>> {
    const response = await api.post<ApiResponse<Record<string, unknown>>>(`/credentials/${id}/refresh`);
    await fetchCredentials();
    return response.data.data;
  }

  async function captureOAuth(id: string): Promise<Record<string, unknown>> {
    const response = await api.post<ApiResponse<Record<string, unknown>>>(`/credentials/${id}/capture`);
    await fetchCredentials();
    return response.data.data;
  }

  async function setDefault(id: string): Promise<void> {
    await api.patch(`/credentials/${id}/default`);
    await fetchCredentials();
  }

  function clearError(): void {
    error.value = null;
  }

  return {
    credentials, selectedCredential, isLoading, error,
    defaultCredential, apiKeyCredentials, oauthCredentials, expiredCredentials,
    fetchCredentials, createCredential, updateCredential, deleteCredential,
    testCredential, refreshCredential, captureOAuth, setDefault, clearError,
  };
});
