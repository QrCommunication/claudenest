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
  const selectedProject = ref<SharedProject | null>(null);
  const projectStats = ref<ProjectStats | null>(null);
  const instances = ref<ClaudeInstance[]>([]);
  const activityLogs = ref<ActivityLog[]>([]);
  const isLoading = ref(false);
  const isCreating = ref(false);
  const isUpdating = ref(false);
  const isDeleting = ref(false);
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
    selectedProject,
    projectStats,
    instances,
    activityLogs,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
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
