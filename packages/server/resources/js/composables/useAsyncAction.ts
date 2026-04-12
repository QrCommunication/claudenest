import { ref, type Ref } from 'vue';

/**
 * Wraps async store actions with loading state, error handling, and cleanup.
 * Eliminates the repetitive try/catch/finally boilerplate in every store action.
 *
 * Usage:
 *   const { isLoading, error, run, clearError } = useAsyncAction();
 *   await run(() => api.get('/endpoint'), 'Failed to fetch');
 */
export function useAsyncAction() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function run<T>(
    action: () => Promise<T>,
    errorMessage = 'Operation failed'
  ): Promise<T> {
    isLoading.value = true;
    error.value = null;
    try {
      return await action();
    } catch (err) {
      error.value = err instanceof Error ? err.message : errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  return { isLoading, error, run, clearError };
}

/**
 * Creates multiple named loading states for a store with a shared error ref.
 * Useful when a store has distinct operations (loading, creating, updating, deleting)
 * that should each have their own loading indicator.
 *
 * Usage:
 *   const { states, error, run, clearError } = useMultiAsyncAction(['loading', 'creating', 'updating', 'deleting']);
 *   await run('loading', () => api.get('/endpoint'), 'Failed to fetch');
 *
 *   // Expose as aliases for backward compatibility:
 *   return { isLoading: states.loading, isCreating: states.creating, error, ... };
 */
export function useMultiAsyncAction<T extends string>(names: readonly T[]) {
  const states = {} as Record<T, Ref<boolean>>;
  const error = ref<string | null>(null);

  for (const name of names) {
    states[name] = ref(false);
  }

  async function run<R>(
    stateName: T,
    action: () => Promise<R>,
    errorMessage = 'Operation failed'
  ): Promise<R> {
    states[stateName].value = true;
    error.value = null;
    try {
      return await action();
    } catch (err) {
      error.value = err instanceof Error ? err.message : errorMessage;
      throw err;
    } finally {
      states[stateName].value = false;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  return { states, error, run, clearError };
}
