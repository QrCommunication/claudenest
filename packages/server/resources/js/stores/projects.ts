import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/composables/useApi';
import { clearLastProjectIfMatches } from '@/composables/useLastProject';
import type { 
  SharedProject,
  ProjectStats,
  CreateProjectForm,
  UpdateProjectForm,
  ClaudeInstance,
  ActivityLog,
  ApiResponse,
} from '@/types';

export const useProjectsStore = defineStore('projects', () => {
  // ==================== STATE ====================
  const projects = ref<SharedProject[]>([]);
  // Archived projects live in a separate flow; the active `projects` list never
  // contains an archived project (the backend index() defaults to scopeActive).
  const archivedProjects = ref<SharedProject[]>([]);
  const selectedProject = ref<SharedProject | null>(null);
  const projectStats = ref<ProjectStats | null>(null);
  const instances = ref<ClaudeInstance[]>([]);
  const activityLogs = ref<ActivityLog[]>([]);
  const isLoading = ref(false);
  const isCreating = ref(false);
  const isUpdating = ref(false);
  const isDeleting = ref(false);
  const isArchiving = ref(false);
  const error = ref<string | null>(null);

  // ==================== GETTERS ====================
  const projectsByMachine = computed(() => {
    const grouped: Record<string, SharedProject[]> = {};
    projects.value.forEach(project => {
      if (!grouped[project.machine_id]) {
        grouped[project.machine_id] = [];
      }
      grouped[project.machine_id].push(project);
    });
    return grouped;
  });

  const activeProjects = computed(() => 
    projects.value.filter(p => p.active_instances_count > 0)
  );

  const projectsWithPendingTasks = computed(() =>
    projects.value.filter(p => p.pending_tasks_count > 0)
  );

  // ==================== ACTIONS ====================

  /**
   * Fetch projects for a machine
   * @throws {Error} If the fetch operation fails
   */
  async function fetchProjects(machineId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get<ApiResponse<SharedProject[]>>(`/machines/${machineId}/projects`);
      projects.value = response.data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch projects';
      error.value = message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetch a single project
   * @throws {Error} If the fetch operation fails
   */
  async function fetchProject(projectId: string): Promise<SharedProject> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get<ApiResponse<SharedProject>>(`/projects/${projectId}`);
      selectedProject.value = response.data.data;
      return response.data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch project';
      error.value = message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Create a new project
   * @throws {Error} If the creation fails
   */
  async function createProject(machineId: string, data: CreateProjectForm): Promise<SharedProject> {
    isCreating.value = true;
    error.value = null;

    try {
      const response = await api.post<ApiResponse<SharedProject>>(`/machines/${machineId}/projects`, data);
      const project = response.data.data;
      projects.value.unshift(project);
      return project;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      error.value = message;
      throw err;
    } finally {
      isCreating.value = false;
    }
  }

  /**
   * Update a project
   * @throws {Error} If the update fails
   */
  async function updateProject(projectId: string, data: UpdateProjectForm): Promise<SharedProject> {
    isUpdating.value = true;
    error.value = null;

    try {
      const response = await api.patch<ApiResponse<SharedProject>>(`/projects/${projectId}`, data);
      const updated = response.data.data;

      // Update in list
      const index = projects.value.findIndex(p => p.id === projectId);
      if (index !== -1) {
        projects.value[index] = { ...projects.value[index], ...updated };
      }

      // Update selected if same
      if (selectedProject.value?.id === projectId) {
        selectedProject.value = { ...selectedProject.value, ...updated };
      }

      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project';
      error.value = message;
      throw err;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Purge every local reference to a project: list entry, current selection and
   * its derived data, plus the pinned sidebar entry. Pure client-side state — no
   * API call — so it is reused both after a successful DELETE and by the
   * real-time ProjectDeleted listener (a delete triggered from another client).
   */
  function removeProjectLocal(projectId: string): void {
    projects.value = projects.value.filter(p => p.id !== projectId);

    if (selectedProject.value?.id === projectId) {
      selectedProject.value = null;
      projectStats.value = null;
      instances.value = [];
      activityLogs.value = [];
    }

    // Drop the pinned sidebar link if it targeted the deleted project, otherwise
    // a ghost entry survives in the Multi-Agent group.
    clearLastProjectIfMatches(projectId);
  }

  /**
   * Delete a project
   * @throws {Error} If the deletion fails
   */
  async function deleteProject(projectId: string): Promise<void> {
    isDeleting.value = true;
    error.value = null;

    try {
      await api.delete(`/projects/${projectId}`);
      removeProjectLocal(projectId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete project';
      error.value = message;
      throw err;
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Fetch the archived projects for a machine (backend `?archived=true`). Kept
   * in a separate list so the active sidebar flow is never polluted.
   * @throws {Error} If the fetch fails
   */
  async function fetchArchived(machineId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get<ApiResponse<SharedProject[]>>(
        `/machines/${machineId}/projects`,
        { params: { archived: true } },
      );
      archivedProjects.value = response.data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch archived projects';
      error.value = message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Move a project from the active flow to the archived flow locally. Pure
   * client-side state (no API call) so it is reused both after a successful
   * archive call and by the real-time ProjectArchived Echo listener (an archive
   * triggered from another client). `project` is the full row when available
   * (API response); otherwise the entry already present in the active list is
   * reused (scalar Echo payload).
   */
  function archiveProjectLocal(projectId: string, project?: SharedProject): void {
    const idx = projects.value.findIndex(p => p.id === projectId);
    const moved = project ?? (idx !== -1 ? projects.value[idx] : undefined);

    if (idx !== -1) {
      projects.value.splice(idx, 1);
    }

    if (moved) {
      const archivedIdx = archivedProjects.value.findIndex(p => p.id === projectId);
      if (archivedIdx === -1) {
        archivedProjects.value.unshift(moved);
      } else {
        archivedProjects.value[archivedIdx] = moved;
      }
    }

    // An archived project leaves the active workspace context, mirroring
    // removeProjectLocal: clear the selection + derived data and the pinned link.
    if (selectedProject.value?.id === projectId) {
      selectedProject.value = null;
      projectStats.value = null;
      instances.value = [];
      activityLogs.value = [];
    }

    clearLastProjectIfMatches(projectId);
  }

  /**
   * Move a project from the archived flow back to the active flow locally.
   * Reused by the API actions and the real-time ProjectUnarchived Echo listener.
   */
  function unarchiveProjectLocal(projectId: string, project?: SharedProject): void {
    const idx = archivedProjects.value.findIndex(p => p.id === projectId);
    const moved = project ?? (idx !== -1 ? archivedProjects.value[idx] : undefined);

    if (idx !== -1) {
      archivedProjects.value.splice(idx, 1);
    }

    if (moved) {
      const activeIdx = projects.value.findIndex(p => p.id === projectId);
      if (activeIdx === -1) {
        projects.value.unshift(moved);
      } else {
        projects.value[activeIdx] = moved;
      }
    }
  }

  /**
   * Archive a project (reversible — the backend captures a context snapshot and
   * deletes nothing). Moves it to the archived flow on success.
   * @throws {Error} If the archive call fails
   */
  async function archiveProject(projectId: string): Promise<SharedProject> {
    isArchiving.value = true;
    error.value = null;

    try {
      const response = await api.post<ApiResponse<SharedProject>>(`/projects/${projectId}/archive`);
      const archived = response.data.data;
      archiveProjectLocal(projectId, archived);
      return archived;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive project';
      error.value = message;
      throw err;
    } finally {
      isArchiving.value = false;
    }
  }

  /**
   * Unarchive a project (restores the captured context snapshot). Moves it back
   * to the active flow on success.
   * @throws {Error} If the unarchive call fails
   */
  async function unarchiveProject(projectId: string): Promise<SharedProject> {
    isArchiving.value = true;
    error.value = null;

    try {
      const response = await api.post<ApiResponse<SharedProject>>(`/projects/${projectId}/unarchive`);
      const restored = response.data.data;
      unarchiveProjectLocal(projectId, restored);
      return restored;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unarchive project';
      error.value = message;
      throw err;
    } finally {
      isArchiving.value = false;
    }
  }

  /**
   * Recover an archived project (the "recover at path" flow surfaced by a
   * `recoverable` create response). The backend /recover endpoint delegates to
   * unarchive; local sync is identical, so it restores the project to the
   * active flow.
   * @throws {Error} If the recover call fails
   */
  async function recoverProject(projectId: string): Promise<SharedProject> {
    isArchiving.value = true;
    error.value = null;

    try {
      const response = await api.post<ApiResponse<SharedProject>>(`/projects/${projectId}/recover`);
      const restored = response.data.data;
      unarchiveProjectLocal(projectId, restored);
      return restored;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to recover project';
      error.value = message;
      throw err;
    } finally {
      isArchiving.value = false;
    }
  }

  /**
   * Fetch project statistics
   * @throws {Error} If the fetch fails
   */
  async function fetchProjectStats(projectId: string): Promise<ProjectStats> {
    try {
      const response = await api.get<ApiResponse<ProjectStats>>(`/projects/${projectId}/stats`);
      projectStats.value = response.data.data;
      return response.data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stats';
      error.value = message;
      throw err;
    }
  }

  /**
   * Fetch project instances (active Claude Code instances)
   * @throws {Error} If the fetch fails
   */
  async function fetchInstances(projectId: string): Promise<ClaudeInstance[]> {
    try {
      const response = await api.get<ApiResponse<ClaudeInstance[]>>(`/projects/${projectId}/instances`);
      instances.value = response.data.data;
      return response.data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch instances';
      error.value = message;
      throw err;
    }
  }

  /**
   * Fetch activity logs for a project
   * @throws {Error} If the fetch fails
   */
  async function fetchActivity(projectId: string, limit: number = 50): Promise<ActivityLog[]> {
    try {
      const response = await api.get<ApiResponse<ActivityLog[]>>(`/projects/${projectId}/activity`, {
        params: { limit },
      });
      activityLogs.value = response.data.data;
      return response.data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch activity';
      error.value = message;
      throw err;
    }
  }

  /**
   * Broadcast message to all instances in a project
   * @throws {Error} If the broadcast fails
   */
  async function broadcast(projectId: string, message: string, type: string = 'info'): Promise<void> {
    try {
      await api.post(`/projects/${projectId}/broadcast`, {
        message,
        type,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to broadcast';
      error.value = errorMessage;
      throw err;
    }
  }

  /**
   * Select a project
   */
  function selectProject(project: SharedProject | null): void {
    selectedProject.value = project;
  }

  /**
   * Clear selected project
   */
  function clearSelectedProject(): void {
    selectedProject.value = null;
    projectStats.value = null;
    instances.value = [];
    activityLogs.value = [];
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Update project locally (for real-time updates)
   */
  function updateProjectLocal(projectId: string, updates: Partial<SharedProject>): void {
    const project = projects.value.find(p => p.id === projectId);
    if (project) {
      Object.assign(project, updates);
    }
    if (selectedProject.value?.id === projectId) {
      Object.assign(selectedProject.value, updates);
    }
  }

  return {
    // State
    projects,
    archivedProjects,
    selectedProject,
    projectStats,
    instances,
    activityLogs,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isArchiving,
    error,

    // Getters
    projectsByMachine,
    activeProjects,
    projectsWithPendingTasks,

    // Actions
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    removeProjectLocal,
    fetchArchived,
    archiveProject,
    unarchiveProject,
    recoverProject,
    archiveProjectLocal,
    unarchiveProjectLocal,
    fetchProjectStats,
    fetchInstances,
    fetchActivity,
    broadcast,
    selectProject,
    clearSelectedProject,
    clearError,
    updateProjectLocal,
  };
});
