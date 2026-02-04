import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api, { getErrorMessage } from '@/utils/api';
import type { 
  Skill, 
  SkillCategory,
  CreateSkillPayload, 
  UpdateSkillPayload,
  SkillsFilter,
  SkillsMeta,
  PaginatedResponse,
  ApiResponse 
} from '@/types';

export const useSkillsStore = defineStore('skills', () => {
  // ==================== STATE ====================
  const skills = ref<Skill[]>([]);
  const selectedSkill = ref<Skill | null>(null);
  const relatedSkills = ref<Skill[]>([]);
  const isLoading = ref(false);
  const isCreating = ref(false);
  const isUpdating = ref(false);
  const isToggling = ref(false);
  const isDeleting = ref(false);
  const error = ref<string | null>(null);
  const meta = ref<SkillsMeta | null>(null);
  const pagination = ref({
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0,
  });
  const filters = ref<SkillsFilter>({
    search: '',
    category: 'all',
    enabled: null,
  });

  // ==================== GETTERS ====================
  const enabledSkills = computed(() => 
    skills.value.filter(s => s.enabled)
  );
  
  const disabledSkills = computed(() => 
    skills.value.filter(s => !s.enabled)
  );

  const skillsByCategory = computed(() => {
    const grouped: Record<string, Skill[]> = {};
    skills.value.forEach(skill => {
      if (!grouped[skill.category]) {
        grouped[skill.category] = [];
      }
      grouped[skill.category].push(skill);
    });
    return grouped;
  });

  const categoryCounts = computed(() => meta.value?.categories ?? {});

  const filteredSkills = computed(() => {
    let result = skills.value;
    
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(search) ||
        (s.display_name && s.display_name.toLowerCase().includes(search)) ||
        (s.description && s.description.toLowerCase().includes(search))
      );
    }
    
    if (filters.value.category && filters.value.category !== 'all') {
      result = result.filter(s => s.category === filters.value.category);
    }
    
    if (filters.value.enabled !== null) {
      result = result.filter(s => s.enabled === filters.value.enabled);
    }
    
    return result;
  });

  const categories = computed(() => 
    Object.keys(categoryCounts.value).sort()
  );

  // ==================== ACTIONS ====================
  
  /**
   * Fetch all skills for a machine
   */
  async function fetchSkills(machineId: string, page: number = 1, perPage: number = 15): Promise<void> {
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
      
      if (filters.value.enabled !== null) {
        params.enabled = filters.value.enabled;
      }
      
      const response = await api.get<PaginatedResponse<Skill>>(`/machines/${machineId}/skills`, { params });
      
      skills.value = response.data.data;
      meta.value = response.data.meta.categories ? { categories: response.data.meta.categories } : null;
      pagination.value = {
        currentPage: response.data.meta.pagination?.current_page ?? 1,
        lastPage: response.data.meta.pagination?.last_page ?? 1,
        perPage: response.data.meta.pagination?.per_page ?? 15,
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
   * Fetch a single skill by path
   */
  async function fetchSkill(machineId: string, path: string): Promise<Skill> {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.get<ApiResponse<{ skill: Skill; related: Skill[] }>>(
        `/machines/${machineId}/skills/${encodeURIComponent(path)}`
      );
      selectedSkill.value = response.data.data.skill;
      relatedSkills.value = response.data.data.related;
      return response.data.data.skill;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Create a new skill
   */
  async function createSkill(machineId: string, data: CreateSkillPayload): Promise<Skill> {
    isCreating.value = true;
    error.value = null;
    
    try {
      const response = await api.post<ApiResponse<Skill>>(`/machines/${machineId}/skills`, data);
      const skill = response.data.data;
      
      skills.value.unshift(skill);
      pagination.value.total++;
      
      return skill;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isCreating.value = false;
    }
  }

  /**
   * Update a skill
   */
  async function updateSkill(machineId: string, path: string, data: UpdateSkillPayload): Promise<Skill> {
    isUpdating.value = true;
    error.value = null;
    
    try {
      const response = await api.patch<ApiResponse<Skill>>(
        `/machines/${machineId}/skills/${encodeURIComponent(path)}`,
        data
      );
      const updatedSkill = response.data.data;
      
      // Update in list
      const index = skills.value.findIndex(s => s.path === path);
      if (index !== -1) {
        skills.value[index] = updatedSkill;
      }
      
      // Update selected if same
      if (selectedSkill.value?.path === path) {
        selectedSkill.value = updatedSkill;
      }
      
      return updatedSkill;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Toggle skill enabled status
   */
  async function toggleSkill(machineId: string, path: string): Promise<Skill> {
    isToggling.value = true;
    error.value = null;
    
    try {
      const response = await api.post<ApiResponse<Skill>>(
        `/machines/${machineId}/skills/${encodeURIComponent(path)}/toggle`
      );
      const updatedSkill = response.data.data;
      
      // Update in list
      const index = skills.value.findIndex(s => s.path === path);
      if (index !== -1) {
        skills.value[index] = updatedSkill;
      }
      
      // Update selected if same
      if (selectedSkill.value?.path === path) {
        selectedSkill.value = updatedSkill;
      }
      
      return updatedSkill;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isToggling.value = false;
    }
  }

  /**
   * Delete a skill
   */
  async function deleteSkill(machineId: string, path: string): Promise<void> {
    isDeleting.value = true;
    error.value = null;
    
    try {
      await api.delete<ApiResponse<null>>(`/machines/${machineId}/skills/${encodeURIComponent(path)}`);
      
      // Remove from list
      skills.value = skills.value.filter(s => s.path !== path);
      pagination.value.total--;
      
      // Clear selected if same
      if (selectedSkill.value?.path === path) {
        selectedSkill.value = null;
      }
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Bulk update skills
   */
  async function bulkUpdate(machineId: string, paths: string[], enabled: boolean): Promise<number> {
    error.value = null;
    
    try {
      const response = await api.post<ApiResponse<{ updated_count: number }>>(
        `/machines/${machineId}/skills/bulk`,
        { paths, enabled }
      );
      
      // Update local state
      skills.value.forEach(skill => {
        if (paths.includes(skill.path)) {
          skill.enabled = enabled;
        }
      });
      
      if (selectedSkill.value && paths.includes(selectedSkill.value.path)) {
        selectedSkill.value.enabled = enabled;
      }
      
      return response.data.data.updated_count;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    }
  }

  /**
   * Select a skill
   */
  function selectSkill(skill: Skill | null): void {
    selectedSkill.value = skill;
  }

  /**
   * Clear selected skill
   */
  function clearSelectedSkill(): void {
    selectedSkill.value = null;
    relatedSkills.value = [];
  }

  /**
   * Set filters
   */
  function setFilters(newFilters: Partial<SkillsFilter>): void {
    filters.value = { ...filters.value, ...newFilters };
  }

  /**
   * Clear filters
   */
  function clearFilters(): void {
    filters.value = {
      search: '',
      category: 'all',
      enabled: null,
    };
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null;
  }

  return {
    // State
    skills,
    selectedSkill,
    relatedSkills,
    isLoading,
    isCreating,
    isUpdating,
    isToggling,
    isDeleting,
    error,
    meta,
    pagination,
    filters,
    
    // Getters
    enabledSkills,
    disabledSkills,
    skillsByCategory,
    categoryCounts,
    filteredSkills,
    categories,
    
    // Actions
    fetchSkills,
    fetchSkill,
    createSkill,
    updateSkill,
    toggleSkill,
    deleteSkill,
    bulkUpdate,
    selectSkill,
    clearSelectedSkill,
    setFilters,
    clearFilters,
    clearError,
  };
});
