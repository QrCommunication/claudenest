import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/composables/useApi';
import type { PaginatedResponse } from '@/types';

/** A single audit-trail entry (mirrors AuditResource on the backend). */
export interface AuditEntry {
  id: string;
  type: string;
  message: string | null;
  icon: string | null;
  color: string | null;
  instance_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string | null;
  created_at_human: string | null;
}

export interface AuditPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/** Server-side filters accepted by GET /projects/{id}/audit. */
export interface AuditFilters {
  type?: string;
  instance_id?: string;
  from?: string;
  to?: string;
}

export interface FetchAuditParams extends AuditFilters {
  page?: number;
  per_page?: number;
}

const DEFAULT_PAGINATION: AuditPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 25,
  total: 0,
};

export const useAuditStore = defineStore('audit', () => {
  // ==================== STATE ====================
  const entries = ref<AuditEntry[]>([]);
  const pagination = ref<AuditPagination>({ ...DEFAULT_PAGINATION });
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // ==================== ACTIONS ====================

  /**
   * Fetch a page of the audit trail for a project. Empty filter values are
   * dropped so the backend `when(isset(...))` guards behave as "no filter".
   * @throws {Error} If the request fails
   */
  async function fetchAudit(projectId: string, params: FetchAuditParams = {}): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get<PaginatedResponse<AuditEntry>>(
        `/projects/${projectId}/audit`,
        {
          params: {
            page: params.page,
            per_page: params.per_page,
            type: params.type || undefined,
            instance_id: params.instance_id || undefined,
            from: params.from || undefined,
            to: params.to || undefined,
          },
        },
      );

      entries.value = response.data.data;
      if (response.data.meta?.pagination) {
        pagination.value = response.data.meta.pagination;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch audit trail';
      error.value = message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /** Reset the store (e.g. when switching projects). */
  function reset(): void {
    entries.value = [];
    pagination.value = { ...DEFAULT_PAGINATION };
    error.value = null;
  }

  function clearError(): void {
    error.value = null;
  }

  return {
    // State
    entries,
    pagination,
    isLoading,
    error,
    // Actions
    fetchAudit,
    reset,
    clearError,
  };
});
