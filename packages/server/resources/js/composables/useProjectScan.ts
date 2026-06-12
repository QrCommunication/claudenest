import { ref } from 'vue';
import { api } from '@/composables/useApi';
import type { ApiResponse } from '@/types';

export interface ScanResult {
  project_name: string;
  tech_stack: string[];
  has_git: boolean;
  readme: string | null;
  structure: string[];
}

export interface GeneratedContext {
  summary: string;
  architecture: string;
  conventions: string;
  current_focus: string;
  tech_stack: string[];
  suggested_tasks: Array<{
    title: string;
    priority: string;
    description: string;
  }>;
}

/**
 * Context generation runs a single bounded LLM pass server-side (local
 * Ollama on CPU): ~2 min worst case on a warm model. Override the
 * per-request timeout so the wizard outlives the generation instead of
 * aborting on the shared axios default.
 */
const GENERATE_CONTEXT_TIMEOUT_MS = 300_000;

export function useProjectScan() {
  const scanResult = ref<ScanResult | null>(null);
  const generatedContext = ref<GeneratedContext | null>(null);
  const isScanning = ref(false);
  const isGenerating = ref(false);
  const scanError = ref<string | null>(null);
  const generateError = ref<string | null>(null);

  async function scanProject(machineId: string, path: string): Promise<ScanResult> {
    isScanning.value = true;
    scanError.value = null;

    try {
      const response = await api.post<ApiResponse<ScanResult>>(
        `/machines/${machineId}/projects/scan`,
        { path },
      );
      scanResult.value = response.data.data;
      return response.data.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to scan project';
      scanError.value = message;
      throw err;
    } finally {
      isScanning.value = false;
    }
  }

  async function generateContext(
    machineId: string,
    path: string,
    techStack: string[],
    readme: string | null,
    structure: string[],
    projectName?: string | null,
  ): Promise<GeneratedContext> {
    isGenerating.value = true;
    generateError.value = null;

    try {
      const response = await api.post<ApiResponse<GeneratedContext>>(
        `/machines/${machineId}/projects/generate-context`,
        {
          path,
          tech_stack: techStack,
          readme,
          structure,
          // Server falls back to basename(path) when absent — send it anyway.
          project_name: projectName || null,
        },
        { timeout: GENERATE_CONTEXT_TIMEOUT_MS },
      );
      generatedContext.value = response.data.data;
      return response.data.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate context';
      generateError.value = message;
      throw err;
    } finally {
      isGenerating.value = false;
    }
  }

  function reset(): void {
    scanResult.value = null;
    generatedContext.value = null;
    isScanning.value = false;
    isGenerating.value = false;
    scanError.value = null;
    generateError.value = null;
  }

  return {
    scanResult,
    generatedContext,
    isScanning,
    isGenerating,
    scanError,
    generateError,
    scanProject,
    generateContext,
    reset,
  };
}
