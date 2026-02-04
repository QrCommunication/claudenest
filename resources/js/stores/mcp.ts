import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api, { getErrorMessage } from '@/utils/api';
import type { 
  MCPServer, 
  MCPTool,
  MCPToolWithServer,
  MCPTransport,
  MCPStatus,
  CreateMCPServerPayload, 
  UpdateMCPServerPayload,
  ExecuteToolPayload,
  MCPStats,
  MCPMeta,
  ApiResponse 
} from '@/types';

export const useMCPStore = defineStore('mcp', () => {
  // ==================== STATE ====================
  const servers = ref<MCPServer[]>([]);
  const selectedServer = ref<MCPServer | null>(null);
  const allTools = ref<MCPToolWithServer[]>([]);
  const isLoading = ref(false);
  const isLoadingTools = ref(false);
  const isCreating = ref(false);
  const isUpdating = ref(false);
  const isStarting = ref(false);
  const isStopping = ref(false);
  const isDeleting = ref(false);
  const isExecuting = ref(false);
  const error = ref<string | null>(null);
  const stats = ref<MCPStats | null>(null);

  // ==================== GETTERS ====================
  const runningServers = computed(() => 
    servers.value.filter(s => s.status === 'running')
  );
  
  const stoppedServers = computed(() => 
    servers.value.filter(s => s.status === 'stopped')
  );

  const serversWithErrors = computed(() => 
    servers.value.filter(s => s.status === 'error')
  );

  const serversByTransport = computed(() => {
    const grouped: Record<string, MCPServer[]> = {};
    servers.value.forEach(server => {
      if (!grouped[server.transport]) {
        grouped[server.transport] = [];
      }
      grouped[server.transport].push(server);
    });
    return grouped;
  });

  const totalToolsCount = computed(() => 
    servers.value.reduce((sum, s) => sum + s.tools_count, 0)
  );

  const hasRunningServers = computed(() => runningServers.value.length > 0);

  const transports = computed(() => 
    [...new Set(servers.value.map(s => s.transport))].sort()
  );

  // ==================== ACTIONS ====================
  
  /**
   * Fetch all MCP servers for a machine
   */
  async function fetchServers(machineId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.get<ApiResponse<MCPServer[]> & { meta: MCPMeta }>(
        `/machines/${machineId}/mcp`
      );
      
      servers.value = response.data.data;
      stats.value = response.data.meta.stats ?? null;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetch a single MCP server
   */
  async function fetchServer(machineId: string, name: string): Promise<MCPServer> {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.get<ApiResponse<MCPServer>>(
        `/machines/${machineId}/mcp/${encodeURIComponent(name)}`
      );
      selectedServer.value = response.data.data;
      return response.data.data;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Create a new MCP server
   */
  async function createServer(machineId: string, data: CreateMCPServerPayload): Promise<MCPServer> {
    isCreating.value = true;
    error.value = null;
    
    try {
      const response = await api.post<ApiResponse<MCPServer>>(`/machines/${machineId}/mcp`, data);
      const server = response.data.data;
      
      servers.value.unshift(server);
      
      // Update stats
      if (stats.value) {
        stats.value.total++;
      }
      
      return server;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isCreating.value = false;
    }
  }

  /**
   * Update an MCP server
   */
  async function updateServer(machineId: string, name: string, data: UpdateMCPServerPayload): Promise<MCPServer> {
    isUpdating.value = true;
    error.value = null;
    
    try {
      const response = await api.patch<ApiResponse<MCPServer>>(
        `/machines/${machineId}/mcp/${encodeURIComponent(name)}`,
        data
      );
      const updatedServer = response.data.data;
      
      // Update in list
      const index = servers.value.findIndex(s => s.name === name);
      if (index !== -1) {
        servers.value[index] = updatedServer;
      }
      
      // Update selected if same
      if (selectedServer.value?.name === name) {
        selectedServer.value = updatedServer;
      }
      
      return updatedServer;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Start an MCP server
   */
  async function startServer(machineId: string, name: string): Promise<MCPServer> {
    isStarting.value = true;
    error.value = null;
    
    try {
      const response = await api.post<ApiResponse<{ message: string; server: MCPServer }>>(
        `/machines/${machineId}/mcp/${encodeURIComponent(name)}/start`
      );
      const updatedServer = response.data.data.server;
      
      // Update in list
      const index = servers.value.findIndex(s => s.name === name);
      if (index !== -1) {
        servers.value[index] = updatedServer;
      }
      
      // Update selected if same
      if (selectedServer.value?.name === name) {
        selectedServer.value = updatedServer;
      }
      
      // Refresh stats
      await fetchServers(machineId);
      
      return updatedServer;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isStarting.value = false;
    }
  }

  /**
   * Stop an MCP server
   */
  async function stopServer(machineId: string, name: string): Promise<MCPServer> {
    isStopping.value = true;
    error.value = null;
    
    try {
      const response = await api.post<ApiResponse<{ message: string; server: MCPServer }>>(
        `/machines/${machineId}/mcp/${encodeURIComponent(name)}/stop`
      );
      const updatedServer = response.data.data.server;
      
      // Update in list
      const index = servers.value.findIndex(s => s.name === name);
      if (index !== -1) {
        servers.value[index] = updatedServer;
      }
      
      // Update selected if same
      if (selectedServer.value?.name === name) {
        selectedServer.value = updatedServer;
      }
      
      // Refresh stats
      await fetchServers(machineId);
      
      return updatedServer;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isStopping.value = false;
    }
  }

  /**
   * Delete an MCP server
   */
  async function deleteServer(machineId: string, name: string): Promise<void> {
    isDeleting.value = true;
    error.value = null;
    
    try {
      await api.delete<ApiResponse<null>>(`/machines/${machineId}/mcp/${encodeURIComponent(name)}`);
      
      // Remove from list
      servers.value = servers.value.filter(s => s.name !== name);
      
      // Clear selected if same
      if (selectedServer.value?.name === name) {
        selectedServer.value = null;
      }
      
      // Update stats
      if (stats.value) {
        stats.value.total--;
        if (stats.value.running > 0) stats.value.running--;
      }
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Fetch tools from a specific MCP server
   */
  async function fetchServerTools(machineId: string, name: string): Promise<MCPTool[]> {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.get<ApiResponse<{ tools: MCPTool[]; count: number }>>(
        `/machines/${machineId}/mcp/${encodeURIComponent(name)}/tools`
      );
      
      // Update tools in the server list
      const index = servers.value.findIndex(s => s.name === name);
      if (index !== -1) {
        servers.value[index].tools = response.data.data.tools;
        servers.value[index].tools_count = response.data.data.count;
      }
      
      return response.data.data.tools;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetch all tools from all running MCP servers
   */
  async function fetchAllTools(machineId: string): Promise<void> {
    isLoadingTools.value = true;
    error.value = null;
    
    try {
      const response = await api.get<ApiResponse<{ tools: MCPToolWithServer[]; count: number }>>(
        `/machines/${machineId}/mcp/all-tools`
      );
      
      allTools.value = response.data.data.tools;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw err;
    } finally {
      isLoadingTools.value = false;
    }
  }

  /**
   * Execute a tool on an MCP server
   */
  async function executeTool(
    machineId: string, 
    name: string, 
    payload: ExecuteToolPayload
  ): Promise<unknown> {
    isExecuting.value = true;
    error.value = null;
    
    try {
      const response = await api.post<ApiResponse<unknown>>(
        `/machines/${machineId}/mcp/${encodeURIComponent(name)}/execute`,
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
   * Select a server
   */
  function selectServer(server: MCPServer | null): void {
    selectedServer.value = server;
  }

  /**
   * Clear selected server
   */
  function clearSelectedServer(): void {
    selectedServer.value = null;
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Update server status locally (for real-time updates)
   */
  function updateServerStatus(name: string, status: MCPStatus): void {
    const server = servers.value.find(s => s.name === name);
    if (server) {
      server.status = status;
    }
    if (selectedServer.value?.name === name) {
      selectedServer.value.status = status;
    }
  }

  return {
    // State
    servers,
    selectedServer,
    allTools,
    isLoading,
    isLoadingTools,
    isCreating,
    isUpdating,
    isStarting,
    isStopping,
    isDeleting,
    isExecuting,
    error,
    stats,
    
    // Getters
    runningServers,
    stoppedServers,
    serversWithErrors,
    serversByTransport,
    totalToolsCount,
    hasRunningServers,
    transports,
    
    // Actions
    fetchServers,
    fetchServer,
    createServer,
    updateServer,
    startServer,
    stopServer,
    deleteServer,
    fetchServerTools,
    fetchAllTools,
    executeTool,
    selectServer,
    clearSelectedServer,
    clearError,
    updateServerStatus,
  };
});
