import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api, { getErrorMessage } from '@/utils/api';
import type { 
  FileLock,
  CreateLockForm,
  ApiResponse,
} from '@/types/multiagent';

export const useLocksStore = defineStore('locks', () => {
  // ==================== STATE ====================
  const locks = ref<FileLock[]>([]);
  const isLoading = ref(false);
  const isCreating = ref(false);
  const error = ref<string | null>(null);

  // ==================== GETTERS ====================
  const activeLocks = computed(() => 
    locks.value.filter(l => l.remaining_seconds > 0)
  );

  const expiredLocks = computed(() =>
    locks.value.filter(l => l.remaining_seconds <= 0)
  );

  const locksByInstance = computed(() => {
    const grouped: Record<string, FileLock[]> = {};
    locks.value.forEach(lock => {
      if (!grouped[lock.locked_by]) {
        grouped[lock.locked_by] = [];
      }
      grouped[lock.locked_by].push(lock);
    });
    return grouped;
  });

  const lockPaths = computed(() => 
    locks.value.map(l => l.path)
  );

  // ==================== ACTIONS ====================

  /**
   * Fetch file locks for a project
   */
  async function fetchLocks(projectId: string): Promise<FileLock[]> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get<ApiResponse<FileLock[]>>(`/projects/${projectId}/locks`);
      locks.value = response.data.data;
      return response.data.data;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Check if a file is locked
   */
  async function checkLock(projectId: string, path: string): Promise<{ is_locked: boolean; locked_by: string | null }> {
    try {
      const response = await api.post<ApiResponse<{ is_locked: boolean; locked_by: string | null }>>(
        `/projects/${projectId}/locks/check`,
        { path }
      );
      return response.data.data;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  /**
   * Lock a file
   */
  async function lockFile(projectId: string, data: CreateLockForm): Promise<FileLock> {
    isCreating.value = true;
    error.value = null;

    try {
      const response = await api.post<ApiResponse<FileLock>>(`/projects/${projectId}/locks`, data);
      const lock = response.data.data;
      
      // Replace existing lock for same path if exists
      const existingIndex = locks.value.findIndex(l => l.path === lock.path);
      if (existingIndex !== -1) {
        locks.value[existingIndex] = lock;
      } else {
        locks.value.push(lock);
      }
      
      return lock;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isCreating.value = false;
    }
  }

  /**
   * Unlock a file
   */
  async function unlockFile(projectId: string, path: string, instanceId: string): Promise<void> {
    try {
      await api.post<ApiResponse<null>>(`/projects/${projectId}/locks/release`, {
        path,
        instance_id: instanceId,
      });
      locks.value = locks.value.filter(l => l.path !== path);
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  /**
   * Force unlock a file (admin)
   */
  async function forceUnlock(projectId: string, path: string): Promise<void> {
    try {
      await api.post<ApiResponse<null>>(`/projects/${projectId}/locks/force-release`, { path });
      locks.value = locks.value.filter(l => l.path !== path);
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  /**
   * Extend a lock
   */
  async function extendLock(projectId: string, path: string, instanceId: string, minutes: number = 30): Promise<FileLock> {
    try {
      const response = await api.post<ApiResponse<FileLock>>(`/projects/${projectId}/locks/extend`, {
        path,
        instance_id: instanceId,
        minutes,
      });
      const updated = response.data.data;
      
      const index = locks.value.findIndex(l => l.path === path);
      if (index !== -1) {
        locks.value[index] = updated;
      }
      
      return updated;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  /**
   * Bulk lock files
   */
  async function bulkLock(
    projectId: string, 
    paths: string[], 
    instanceId: string, 
    reason?: string
  ): Promise<{ locked: FileLock[]; failed: Array<{ path: string; error: string }> }> {
    isCreating.value = true;
    error.value = null;

    try {
      const response = await api.post<ApiResponse<{ locked: FileLock[]; failed: Array<{ path: string; error: string }> }>>(
        `/projects/${projectId}/locks/bulk`,
        {
          paths,
          instance_id: instanceId,
          reason,
        }
      );
      const { locked, failed } = response.data.data;
      
      // Add successful locks
      locked.forEach(lock => {
        const existingIndex = locks.value.findIndex(l => l.path === lock.path);
        if (existingIndex !== -1) {
          locks.value[existingIndex] = lock;
        } else {
          locks.value.push(lock);
        }
      });
      
      return { locked, failed };
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isCreating.value = false;
    }
  }

  /**
   * Release all locks by an instance
   */
  async function releaseByInstance(projectId: string, instanceId: string): Promise<number> {
    try {
      const response = await api.post<ApiResponse<{ released_count: number }>>(
        `/projects/${projectId}/locks/release-by-instance`,
        { instance_id: instanceId }
      );
      const { released_count } = response.data.data;
      
      // Remove released locks
      locks.value = locks.value.filter(l => l.locked_by !== instanceId);
      
      return released_count;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  /**
   * Check if a path is locked
   */
  function isPathLocked(path: string): boolean {
    return locks.value.some(l => l.path === path && l.remaining_seconds > 0);
  }

  /**
   * Get lock for a path
   */
  function getLockForPath(path: string): FileLock | undefined {
    return locks.value.find(l => l.path === path && l.remaining_seconds > 0);
  }

  /**
   * Clear locks
   */
  function clearLocks(): void {
    locks.value = [];
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Add lock locally (for real-time updates)
   */
  function addLockLocal(lock: FileLock): void {
    const existingIndex = locks.value.findIndex(l => l.path === lock.path);
    if (existingIndex !== -1) {
      locks.value[existingIndex] = lock;
    } else {
      locks.value.push(lock);
    }
  }

  /**
   * Remove lock locally (for real-time updates)
   */
  function removeLockLocal(path: string): void {
    locks.value = locks.value.filter(l => l.path !== path);
  }

  /**
   * Update remaining times (call periodically)
   */
  function updateRemainingTimes(): void {
    locks.value = locks.value.map(lock => ({
      ...lock,
      remaining_seconds: Math.max(0, lock.remaining_seconds - 1),
    }));
  }

  return {
    // State
    locks,
    isLoading,
    isCreating,
    error,

    // Getters
    activeLocks,
    expiredLocks,
    locksByInstance,
    lockPaths,

    // Actions
    fetchLocks,
    checkLock,
    lockFile,
    unlockFile,
    forceUnlock,
    extendLock,
    bulkLock,
    releaseByInstance,
    isPathLocked,
    getLockForPath,
    clearLocks,
    clearError,
    addLockLocal,
    removeLockLocal,
    updateRemainingTimes,
  };
});
