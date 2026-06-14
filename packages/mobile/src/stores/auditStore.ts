/**
 * Audit Store - Zustand
 * Paginated audit trail for a shared project (web parity:
 * components/multiagent/AuditTrail.vue). Open to any project member — no plan
 * gating. Supports pull-to-refresh (reset to page 1) and infinite scroll.
 */

import { create } from "zustand";
import type { AuditEntry } from "@/types";
import { auditApi } from "@/services/api";

const PER_PAGE = 30;

/** The server returns snake_case pagination at runtime (the typed ApiResponse
 * is camelCase/aspirational), so read it through a snake_case cast. */
function readLastPage(meta: unknown): number {
  const pagination = (
    meta as { pagination?: { last_page?: number } } | undefined
  )?.pagination;
  return pagination?.last_page ?? 1;
}

function extractError(e: unknown, fallback: string): string {
  const res = (e as { response?: { data?: { error?: { message?: string } } } })
    ?.response;
  return res?.data?.error?.message ?? fallback;
}

interface AuditState {
  entries: AuditEntry[];
  page: number;
  lastPage: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  /** (Re)load page 1, replacing entries. */
  fetch: (projectId: string) => Promise<void>;
  /** Append the next page if any remain. */
  loadMore: (projectId: string) => Promise<void>;
  reset: () => void;
}

export const useAuditStore = create<AuditState>((set, get) => ({
  entries: [],
  page: 1,
  lastPage: 1,
  isLoading: false,
  isLoadingMore: false,
  error: null,

  fetch: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await auditApi.list(projectId, {
        page: 1,
        per_page: PER_PAGE,
      });
      set({
        entries: res.data ?? [],
        page: 1,
        lastPage: readLastPage(res.meta),
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false, error: extractError(e, "Failed to load audit") });
    }
  },

  loadMore: async (projectId) => {
    const { page, lastPage, isLoadingMore, isLoading } = get();
    if (isLoading || isLoadingMore || page >= lastPage) return;

    const next = page + 1;
    set({ isLoadingMore: true });
    try {
      const res = await auditApi.list(projectId, {
        page: next,
        per_page: PER_PAGE,
      });
      set((state) => ({
        entries: [...state.entries, ...(res.data ?? [])],
        page: next,
        lastPage: readLastPage(res.meta),
        isLoadingMore: false,
      }));
    } catch (e) {
      set({
        isLoadingMore: false,
        error: extractError(e, "Failed to load more"),
      });
    }
  },

  reset: () =>
    set({
      entries: [],
      page: 1,
      lastPage: 1,
      isLoading: false,
      isLoadingMore: false,
      error: null,
    }),
}));
