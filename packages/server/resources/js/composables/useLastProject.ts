import { readonly, ref } from 'vue';

/**
 * Last visited project, pinned in the sidebar (Multi-Agent group) with quick
 * links to its Workspace and Board. Module-level state synced to
 * localStorage so the entry survives reloads and updates reactively within
 * the running app (a bare localStorage read would never re-render).
 */

export interface LastProject {
  id: string;
  name: string;
}

const STORAGE_KEY = 'cn-last-project';

function restore(): LastProject | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<LastProject>;
    if (typeof data.id === 'string' && typeof data.name === 'string') {
      return { id: data.id, name: data.name };
    }
    return null;
  } catch {
    return null;
  }
}

const lastProject = ref<LastProject | null>(restore());

export function setLastProject(project: LastProject): void {
  if (lastProject.value?.id === project.id && lastProject.value.name === project.name) {
    return;
  }
  lastProject.value = project;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
}

export function useLastProject() {
  return {
    lastProject: readonly(lastProject),
    setLastProject,
  };
}
