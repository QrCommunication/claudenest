import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api, { getErrorMessage } from '@/utils/api';
import type { 
  Machine, 
  MachineEnvironment, 
  MachineStatus,
  Session,
  CreateMachineForm, 
  UpdateMachineForm,
  PaginatedResponse,
  ApiResponse 
} from '@/types';

export interface MachinesState {
  machines: Machine[];
  selectedMachine: Machine | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
  filters: {
    search: string;
    status: MachineStatus | 'all';
  };
}

export const useMachinesStore = defineStore('machines', () => {
  // ==================== STATE ====================
  const machines = ref<Machine[]>([]);
  const selectedMachine = ref<Machine | null>(null);
  const isLoading = ref(false);
  const isCreating = ref(false);
  const isUpdating = ref(false);
  const isDeleting = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0,
  });
  const filters = ref({
    search: '',
    status: 'all' as const,
  });

  // ==================== GETTERS ====================
  const onlineMachines = computed(() => 
    machines.value.filter(m => m.status === 'online')
  );
  
  const offlineMachines = computed(() => 
    machines.value.filter(m => m.status === 'offline')
  );
  
  const connectingMachines = computed(() => 
    machines.value.filter(m => m.status === 'connecting')
  );

  const totalActiveSessions = computed(() => 
    machines.value.reduce((sum, m) => sum + m.active_sessions_count, 0)
  );

  const filteredMachines = computed(() => {
    let result = machines.value;
    
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(search) ||
        (m.hostname && m.hostname.toLowerCase().includes(search))
      );
    }
    
    const statusFilter = filters.value.status;
    if (statusFilter && statusFilter !== 'all') {
      result = result.filter(m => m.status === statusFilter);
    }
    
    return result;
  });

  // ==================== ACTIONS ====================
  
  /**
   * Fetch all machines with pagination
   */
  async function fetchMachines(page: number = 1, perPage: number = 15): Promise<void> {
    isLoading.value = true;
    error.value = null;
    
    try {
      const params: Record<string, unknown> = { page, per_page: perPage };
      
      if (filters.value.search) {
        params.search = filters.value.search;
      }
      
      if (filters.value.status !== 'all') {
        params.status = filters.value.status;
      }
      
      const response = await api.get<PaginatedResponse<Machine>>('/machines', { params });
      
      machines.value = response.data.data;
      pagination.value = {
        currentPage: response.data.meta.pagination.current_page,
        lastPage: response.data.meta.pagination.last_page,
        perPage: response.data.meta.pagination.per_page,
        total: response.data.meta.pagination.total,
      };
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetch a single machine by ID
   */
  async function fetchMachine(id: string): Promise<Machine> {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.get<ApiResponse<Machine>>(`/machines/${id}`);
      selectedMachine.value = response.data.data;
      return response.data.data;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Create a new machine
   */
  async function createMachine(data: CreateMachineForm): Promise<{ machine: Machine; token: string }> {
    isCreating.value = true;
    error.value = null;
    
    try {
      const response = await api.post<ApiResponse<{ machine: Machine; token: string }>>('/machines', data);
      const { machine, token } = response.data.data;
      
      // Add to list
      machines.value.unshift(machine);
      pagination.value.total++;
      
      return { machine, token };
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isCreating.value = false;
    }
  }

  /**
   * Update a machine
   */
  async function updateMachine(id: string, data: UpdateMachineForm): Promise<Machine> {
    isUpdating.value = true;
    error.value = null;
    
    try {
      const response = await api.patch<ApiResponse<Machine>>(`/machines/${id}`, data);
      const updatedMachine = response.data.data;
      
      // Update in list
      const index = machines.value.findIndex(m => m.id === id);
      if (index !== -1) {
        machines.value[index] = updatedMachine;
      }
      
      // Update selected if same
      if (selectedMachine.value?.id === id) {
        selectedMachine.value = updatedMachine;
      }
      
      return updatedMachine;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Delete a machine
   */
  async function deleteMachine(id: string): Promise<void> {
    isDeleting.value = true;
    error.value = null;
    
    try {
      await api.delete<ApiResponse<null>>(`/machines/${id}`);
      
      // Remove from list
      machines.value = machines.value.filter(m => m.id !== id);
      pagination.value.total--;
      
      // Clear selected if same
      if (selectedMachine.value?.id === id) {
        selectedMachine.value = null;
      }
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Select a machine
   */
  function selectMachine(machine: Machine | null): void {
    selectedMachine.value = machine;
  }

  /**
   * Clear selected machine
   */
  function clearSelectedMachine(): void {
    selectedMachine.value = null;
  }

  /**
   * Fetch machine environment info
   */
  async function fetchMachineEnvironment(id: string): Promise<MachineEnvironment> {
    try {
      const response = await api.get<ApiResponse<MachineEnvironment>>(`/machines/${id}/environment`);
      return response.data.data;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  /**
   * Fetch machine sessions
   */
  async function fetchMachineSessions(id: string): Promise<Session[]> {
    try {
      const response = await api.get<ApiResponse<Session[]>>(`/machines/${id}/sessions`);
      return response.data.data;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  /**
   * Wake up a machine via Wake-on-LAN
   */
  async function wakeMachine(id: string): Promise<void> {
    try {
      await api.post<ApiResponse<{ message: string; machine: Machine }>>(`/machines/${id}/wake`);
      // Refresh machine data
      await fetchMachine(id);
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  /**
   * Regenerate machine token
   */
  async function regenerateToken(id: string): Promise<string> {
    try {
      const response = await api.post<ApiResponse<{ token: string }>>(`/machines/${id}/regenerate-token`);
      return response.data.data.token;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  /**
   * Set filters
   */
  function setFilters(newFilters: Partial<typeof filters.value>): void {
    filters.value = { ...filters.value, ...newFilters };
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Update machine status locally (for real-time updates)
   */
  function updateMachineStatus(id: string, status: Machine['status']): void {
    const machine = machines.value.find(m => m.id === id);
    if (machine) {
      machine.status = status;
    }
    if (selectedMachine.value?.id === id) {
      selectedMachine.value.status = status;
    }
  }

  return {
    // State
    machines,
    selectedMachine,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    pagination,
    filters,
    
    // Getters
    onlineMachines,
    offlineMachines,
    connectingMachines,
    totalActiveSessions,
    filteredMachines,
    
    // Actions
    fetchMachines,
    fetchMachine,
    createMachine,
    updateMachine,
    deleteMachine,
    selectMachine,
    clearSelectedMachine,
    fetchMachineEnvironment,
    fetchMachineSessions,
    wakeMachine,
    regenerateToken,
    setFilters,
    clearError,
    updateMachineStatus,
  };
});
