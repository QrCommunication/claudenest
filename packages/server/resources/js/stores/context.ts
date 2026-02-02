import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/composables/useApi';
import type { 
  ProjectContext,
  ContextChunk,
  ContextQueryResult,
  UpdateContextForm,
  ContextChunkType,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export const useContextStore = defineStore('context', () => {
  // ==================== STATE ====================
  const projectContext = ref<ProjectContext | null>(null);
  const contextChunks = ref<ContextChunk[]>([]);
  const queryResults = ref<ContextQueryResult[]>([]);
  const isLoading = ref(false);
  const isQuerying = ref(false);
  const isSummarizing = ref(false);
  const error = ref<string | null>(null);

  // ==================== GETTERS ====================
  const hasContext = computed(() => projectContext.value !== null);
  
  const tokenUsagePercent = computed(() => 
    projectContext.value?.token_usage_percent ?? 0
  );

  const isTokenLimitReached = computed(() =>
    projectContext.value?.is_token_limit_reached ?? false
  );

  const chunksByType = computed(() => {
    const grouped: Record<ContextChunkType, ContextChunk[]> = {
      task_completion: [],
      context_update: [],
      file_change: [],
      decision: [],
      summary: [],
      broadcast: [],
    };
    contextChunks.value.forEach(chunk => {
      grouped[chunk.type].push(chunk);
    });
    return grouped;
  });

  const recentChunks = computed(() => 
    contextChunks.value.slice(0, 10)
  );

  const highImportanceChunks = computed(() =>
    contextChunks.value.filter(c => (c.importance_score ?? 0) >= 0.7)
  );

  // ==================== ACTIONS ====================

  /**
   * Fetch project context
   */
  async function fetchContext(projectId: string): Promise<ProjectContext> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get<ApiResponse<ProjectContext>>(`/projects/${projectId}/context`);
      projectContext.value = response.data.data;
      return response.data.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch context';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Update project context
   */
  async function updateContext(projectId: string, data: UpdateContextForm): Promise<ProjectContext> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.patch<ApiResponse<ProjectContext>>(`/projects/${projectId}/context`, data);
      const updated = response.data.data;
      projectContext.value = { ...projectContext.value, ...updated };
      return updated;
    } catch (err: any) {
      error.value = err.message || 'Failed to update context';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Query context with RAG search
   */
  async function queryContext(
    projectId: string, 
    query: string, 
    options?: { limit?: number; type?: ContextChunkType; min_similarity?: number }
  ): Promise<ContextQueryResult[]> {
    isQuerying.value = true;
    error.value = null;

    try {
      const response = await api.post<ApiResponse<ContextQueryResult[]>>(
        `/projects/${projectId}/context/query`,
        {
          query,
          limit: options?.limit ?? 10,
          type: options?.type,
          min_similarity: options?.min_similarity ?? 0.7,
        }
      );
      queryResults.value = response.data.data;
      return response.data.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to query context';
      throw err;
    } finally {
      isQuerying.value = false;
    }
  }

  /**
   * Fetch context chunks
   */
  async function fetchChunks(
    projectId: string, 
    options?: { type?: ContextChunkType; instance_id?: string; limit?: number }
  ): Promise<ContextChunk[]> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get<PaginatedResponse<ContextChunk>>(
        `/projects/${projectId}/context/chunks`,
        { params: options }
      );
      contextChunks.value = response.data.data;
      return response.data.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch chunks';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Create context chunk
   */
  async function createChunk(
    projectId: string, 
    data: {
      content: string;
      type: ContextChunkType;
      instance_id?: string;
      task_id?: string;
      files?: string[];
      importance_score?: number;
      generate_embedding?: boolean;
    }
  ): Promise<ContextChunk> {
    try {
      const response = await api.post<ApiResponse<ContextChunk>>(
        `/projects/${projectId}/context/chunks`,
        data
      );
      const chunk = response.data.data;
      contextChunks.value.unshift(chunk);
      return chunk;
    } catch (err: any) {
      error.value = err.message || 'Failed to create chunk';
      throw err;
    }
  }

  /**
   * Delete context chunk
   */
  async function deleteChunk(projectId: string, chunkId: string): Promise<void> {
    try {
      await api.delete(`/projects/${projectId}/context/chunks/${chunkId}`);
      contextChunks.value = contextChunks.value.filter(c => c.id !== chunkId);
    } catch (err: any) {
      error.value = err.message || 'Failed to delete chunk';
      throw err;
    }
  }

  /**
   * Summarize context chunks
   */
  async function summarizeContext(
    projectId: string, 
    options?: { chunk_ids?: string[]; max_length?: number }
  ): Promise<string> {
    isSummarizing.value = true;
    error.value = null;

    try {
      const response = await api.post<ApiResponse<{ summary: string; chunks_used: number }>>(
        `/projects/${projectId}/context/summarize`,
        options ?? {}
      );
      const { summary } = response.data.data;
      
      // Update recent_changes with summary
      if (projectContext.value) {
        projectContext.value.recent_changes = summary;
      }
      
      return summary;
    } catch (err: any) {
      error.value = err.message || 'Failed to summarize context';
      throw err;
    } finally {
      isSummarizing.value = false;
    }
  }

  /**
   * Clear query results
   */
  function clearQueryResults(): void {
    queryResults.value = [];
  }

  /**
   * Clear context
   */
  function clearContext(): void {
    projectContext.value = null;
    contextChunks.value = [];
    queryResults.value = [];
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Add chunk locally (for real-time updates)
   */
  function addChunkLocal(chunk: ContextChunk): void {
    contextChunks.value.unshift(chunk);
  }

  /**
   * Update context locally (for real-time updates)
   */
  function updateContextLocal(updates: Partial<ProjectContext>): void {
    if (projectContext.value) {
      Object.assign(projectContext.value, updates);
    }
  }

  return {
    // State
    projectContext,
    contextChunks,
    queryResults,
    isLoading,
    isQuerying,
    isSummarizing,
    error,

    // Getters
    hasContext,
    tokenUsagePercent,
    isTokenLimitReached,
    chunksByType,
    recentChunks,
    highImportanceChunks,

    // Actions
    fetchContext,
    updateContext,
    queryContext,
    fetchChunks,
    createChunk,
    deleteChunk,
    summarizeContext,
    clearQueryResults,
    clearContext,
    clearError,
    addChunkLocal,
    updateContextLocal,
  };
});
