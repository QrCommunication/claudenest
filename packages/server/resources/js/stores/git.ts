import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/composables/useApi';
import type { ApiResponse } from '@/types';

export interface GitFileChange {
  path: string;
  /** Two-letter porcelain code, e.g. ' M', '??', 'A '. */
  code: string;
}

export interface GitStatus {
  branch: string | null;
  ahead: number;
  behind: number;
  clean: boolean;
  files: GitFileChange[];
  remote_url: string | null;
  last_commit: string | null;
  sandboxed: boolean;
}

export interface PullRequest {
  number: number;
  title: string;
  headRefName: string;
  baseRefName: string;
  isDraft: boolean;
  mergeable?: string;
  mergeStateStatus?: string;
  url: string;
  createdAt: string;
  author?: { login?: string } | null;
}

export type MergeMethod = 'squash' | 'merge' | 'rebase';

/**
 * Git worktree + pull-request state for a shared project. The server proxies
 * every call to the agent (sandboxed git/gh), so failures are surfaced as a
 * single `error` string the panel can render.
 */
export const useGitStore = defineStore('git', () => {
  const status = ref<GitStatus | null>(null);
  const pulls = ref<PullRequest[]>([]);
  const isLoadingStatus = ref(false);
  const isLoadingPulls = ref(false);
  const mergingNumber = ref<number | null>(null);
  const error = ref<string | null>(null);

  function extractError(e: unknown, fallback: string): string {
    const res = (e as { response?: { data?: { error?: { message?: string } } } })?.response;
    return res?.data?.error?.message ?? fallback;
  }

  async function fetchStatus(projectId: string): Promise<void> {
    isLoadingStatus.value = true;
    error.value = null;
    try {
      const res = await api.get<ApiResponse<GitStatus>>(`/projects/${projectId}/git/status`);
      status.value = res.data.data;
    } catch (e) {
      error.value = extractError(e, 'Failed to load git status');
    } finally {
      isLoadingStatus.value = false;
    }
  }

  async function fetchPulls(projectId: string): Promise<void> {
    isLoadingPulls.value = true;
    error.value = null;
    try {
      const res = await api.get<ApiResponse<{ pulls: PullRequest[] }>>(`/projects/${projectId}/pulls`);
      pulls.value = res.data.data.pulls ?? [];
    } catch (e) {
      error.value = extractError(e, 'Failed to load pull requests');
    } finally {
      isLoadingPulls.value = false;
    }
  }

  async function refresh(projectId: string): Promise<void> {
    await Promise.all([fetchStatus(projectId), fetchPulls(projectId)]);
  }

  /** Merge a PR. Returns true on success so the caller can toast/refresh. */
  async function mergePull(
    projectId: string,
    number: number,
    method: MergeMethod = 'squash',
  ): Promise<boolean> {
    mergingNumber.value = number;
    error.value = null;
    try {
      await api.post<ApiResponse<{ merged: boolean }>>(
        `/projects/${projectId}/pulls/${number}/merge`,
        { method },
      );
      pulls.value = pulls.value.filter((pr) => pr.number !== number);
      // The merged work changed the default branch — refresh the worktree view.
      await fetchStatus(projectId);
      return true;
    } catch (e) {
      error.value = extractError(e, 'Merge failed');
      return false;
    } finally {
      mergingNumber.value = null;
    }
  }

  return {
    status,
    pulls,
    isLoadingStatus,
    isLoadingPulls,
    mergingNumber,
    error,
    fetchStatus,
    fetchPulls,
    refresh,
    mergePull,
  };
});
