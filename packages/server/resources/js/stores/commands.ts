import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api, { getErrorMessage } from '@/utils/api';
import type { 
  DiscoveredCommand, 
  CommandCategory,
  CreateCommandPayload,
  BulkCreateCommandsPayload,
  ExecuteCommandPayload,
  CommandsFilter,
  CommandsMeta,
  PaginatedResponse,
  ApiResponse 
} from '@/types';

export const useCommandsStore = defineStore('commands', () => {
  // ==================== STATE ====================
  const commands = ref<DiscoveredCommand[]>([]);
  const selectedCommand = ref<DiscoveredCommand | null>(null);
  const relatedCommands = ref<DiscoveredCommand[]>([]);
  const searchResults = ref<DiscoveredCommand[]>([]);
  const isLoading = ref(false);
  const isSearching = ref(false);
  const isCreating = ref(false);
  const isExecuting = ref(false);
  const isDeleting = ref(false);
  const error = ref<string | null>(null);
  const meta = ref<CommandsMeta | null>(null);
  const pagination = ref({
    currentPage: 1,
    lastPage: 1,
    perPage: 50,
    total: 0,
  });
  const filters = ref<CommandsFilter>({
    search: '',
    category: 'all',
    skill_path: 'all',
  });

  // ==================== GETTERS ====================
  const commandsByCategory = computed(() => {
    const grouped: Record<string, DiscoveredCommand[]> = {};
    commands.value.forEach(cmd => {
      if (!grouped[cmd.category]) {
        grouped[cmd.category] = [];
      }
      grouped[cmd.category].push(cmd);
    });
    return grouped;
  });

  const commandsBySkill = computed(() => {
    const grouped: Record<string, DiscoveredCommand[]> = {};
    commands.value.forEach(cmd => {
      const key = cmd.skill_path || 'unassigned';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(cmd);
    });
    return grouped;
  });

  const categoryCounts = computed(() => meta.value?.categories ?? {});
  const skillCounts = computed(() => meta.value?.skills ?? {});

  const filteredCommands = computed(() => {
    let result = commands.value;
    
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(search) ||
        (c.display_name && c.display_name.toLowerCase().includes(search)) ||
        (c.description && c.description.toLowerCase().includes(search)) ||
        c.aliases.some(alias => alias.toLowerCase().includes(search))
      );
    }
    
    if (filters.value.category && filters.value.category !== 'all') {
      result = result.filter(c => c.category === filters.value.category);
    }
    
    if (filters.value.skill_path && filters.value.skill_path !== 'all') {
      result = result.filter(c => c.skill_path === filters.value.skill_path);
    }
    
    return result;
  });

  const categories = computed(() => 
    Object.keys(categoryCounts.value).sort()
  );

  const skillPaths = computed(() => 
    Object.keys(skillCounts.value).sort()
  );

  // ==================== ACTIONS ====================
  
  /**
   * Fetch all commands for a machine
   */
  async function fetchCommands(machineId: string, page: number = 1, perPage: number = 50): Promise<void> {
    isLoading.value = true;
    error.value = null;
    
    try {
      const params: Record<string, unknown> = { page, per_page: perPage };
      
      if (filters.value.search) {
        params.search = filters.value.search;
      }
      
      if (filters.value.category && filters.value.category !== 'all') {
        params.category = filters.value.category;
      }
      
      if (filters.value.skill_path && filters.value.skill_path !== 'all') {
        params.skill_path = filters.value.skill_path;
      }
      
      const response = await api.get<PaginatedResponse<DiscoveredCommand>>(
        `/machines/${machineId}/commands`,
        { params }
      );
      
      commands.value = response.data.data;
      meta.value = {
        categories: response.data.meta.categories ?? {},
        skills: response.data.meta.skills ?? {},
      };
      pagination.value = {
        currentPage: response.data.meta.pagination?.current_page ?? 1,
        lastPage: response.data.meta.pagination?.last_page ?? 1,
        perPage: response.data.meta.pagination?.per_page ?? 50,
        total: response.data.meta.pagination?.total ?? 0,
      };
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetch a single command
   */
  async function fetchCommand(machineId: string, id: string): Promise<DiscoveredCommand> {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.get<ApiResponse<{ command: DiscoveredCommand; related: DiscoveredCommand[] }>>(
        `/machines/${machineId}/commands/${id}`
      );
      selectedCommand.value = response.data.data.command;
      relatedCommands.value = response.data.data.related;
      return response.data.data.command;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Search commands
   */
  async function searchCommands(machineId: string, query: string, limit: number = 20): Promise<DiscoveredCommand[]> {
    if (!query.trim()) {
      searchResults.value = [];
      return [];
    }
    
    isSearching.value = true;
    error.value = null;
    
    try {
      const response = await api.get<ApiResponse<{ query: string; results: DiscoveredCommand[]; count: number }>>(
        `/machines/${machineId}/commands/search`,
        { params: { q: query, limit } }
      );
      
      searchResults.value = response.data.data.results;
      return response.data.data.results;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isSearching.value = false;
    }
  }

  /**
   * Register a new command
   */
  async function createCommand(machineId: string, data: CreateCommandPayload): Promise<DiscoveredCommand> {
    isCreating.value = true;
    error.value = null;
    
    try {
      const response = await api.post<ApiResponse<DiscoveredCommand>>(
        `/machines/${machineId}/commands`,
        data
      );
      const command = response.data.data;
      
      commands.value.unshift(command);
      pagination.value.total++;
      
      return command;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isCreating.value = false;
    }
  }

  /**
   * Bulk register commands
   */
  async function bulkCreateCommands(machineId: string, data: BulkCreateCommandsPayload): Promise<{ created: number; updated: number }> {
    isCreating.value = true;
    error.value = null;
    
    try {
      const response = await api.post<ApiResponse<{ created: number; updated: number }>>(
        `/machines/${machineId}/commands/bulk`,
        data
      );
      
      // Refresh commands to get updated list
      await fetchCommands(machineId);
      
      return response.data.data;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isCreating.value = false;
    }
  }

  /**
   * Execute a command
   */
  async function executeCommand(machineId: string, id: string, payload: ExecuteCommandPayload = {}): Promise<unknown> {
    isExecuting.value = true;
    error.value = null;
    
    try {
      const response = await api.post<ApiResponse<unknown>>(
        `/machines/${machineId}/commands/${id}/execute`,
        payload
      );
      
      return response.data.data;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isExecuting.value = false;
    }
  }

  /**
   * Delete a command
   */
  async function deleteCommand(machineId: string, id: string): Promise<void> {
    isDeleting.value = true;
    error.value = null;
    
    try {
      await api.delete<ApiResponse<null>>(`/machines/${machineId}/commands/${id}`);
      
      // Remove from list
      commands.value = commands.value.filter(c => c.id !== id);
      pagination.value.total--;
      
      // Clear selected if same
      if (selectedCommand.value?.id === id) {
        selectedCommand.value = null;
      }
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Clear all commands for a machine
   */
  async function clearCommands(machineId: string): Promise<number> {
    isDeleting.value = true;
    error.value = null;
    
    try {
      const response = await api.delete<ApiResponse<{ deleted_count: number }>>(
        `/machines/${machineId}/commands`
      );
      
      commands.value = [];
      pagination.value.total = 0;
      selectedCommand.value = null;
      
      return response.data.data.deleted_count;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Select a command
   */
  function selectCommand(command: DiscoveredCommand | null): void {
    selectedCommand.value = command;
  }

  /**
   * Clear selected command
   */
  function clearSelectedCommand(): void {
    selectedCommand.value = null;
    relatedCommands.value = [];
  }

  /**
   * Set filters
   */
  function setFilters(newFilters: Partial<CommandsFilter>): void {
    filters.value = { ...filters.value, ...newFilters };
  }

  /**
   * Clear filters
   */
  function clearFilters(): void {
    filters.value = {
      search: '',
      category: 'all',
      skill_path: 'all',
    };
  }

  /**
   * Clear search results
   */
  function clearSearchResults(): void {
    searchResults.value = [];
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null;
  }

  return {
    // State
    commands,
    selectedCommand,
    relatedCommands,
    searchResults,
    isLoading,
    isSearching,
    isCreating,
    isExecuting,
    isDeleting,
    error,
    meta,
    pagination,
    filters,
    
    // Getters
    commandsByCategory,
    commandsBySkill,
    categoryCounts,
    skillCounts,
    filteredCommands,
    categories,
    skillPaths,
    
    // Actions
    fetchCommands,
    fetchCommand,
    searchCommands,
    createCommand,
    bulkCreateCommands,
    executeCommand,
    deleteCommand,
    clearCommands,
    selectCommand,
    clearSelectedCommand,
    setFilters,
    clearFilters,
    clearSearchResults,
    clearError,
  };
});
