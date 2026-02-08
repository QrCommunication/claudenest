import { ref } from 'vue';
import type { Toast } from '@/types';

const toasts = ref<Toast[]>([]);

let toastId = 0;
const timeoutMap = new Map<string, ReturnType<typeof setTimeout>>();

export function useToast() {
  /**
   * Add a toast notification
   * @param type - Toast type (success, error, warning, info)
   * @param title - Toast title
   * @param message - Optional toast message
   * @param duration - Display duration in ms (0 = persist until manually closed)
   * @returns Toast ID
   */
  const addToast = (
    type: Toast['type'],
    title: string,
    message?: string,
    duration: number = 5000
  ): string => {
    const id = `toast-${++toastId}`;
    const toast: Toast = {
      id,
      type,
      title,
      message,
      duration,
    };

    toasts.value.push(toast);

    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        removeToast(id);
      }, duration);
      timeoutMap.set(id, timeoutId);
    }

    return id;
  };

  /**
   * Remove a toast by ID and clear its timeout
   */
  const removeToast = (id: string): void => {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
    
    // Clear timeout if exists
    const timeoutId = timeoutMap.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutMap.delete(id);
    }
  };

  /**
   * Clear all toasts and their timeouts
   */
  const clearAll = (): void => {
    timeoutMap.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutMap.clear();
    toasts.value = [];
  };

  const success = (title: string, message?: string, duration?: number): string => {
    return addToast('success', title, message, duration);
  };

  const error = (title: string, message?: string, duration?: number): string => {
    return addToast('error', title, message, duration);
  };

  const warning = (title: string, message?: string, duration?: number): string => {
    return addToast('warning', title, message, duration);
  };

  const info = (title: string, message?: string, duration?: number): string => {
    return addToast('info', title, message, duration);
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
  };
}

/**
 * Global toast instance for use in components
 */
export function useGlobalToast() {
  return {
    toasts,
    removeToast: (id: string) => {
      const index = toasts.value.findIndex((t) => t.id === id);
      if (index > -1) {
        toasts.value.splice(index, 1);
      }
      
      const timeoutId = timeoutMap.get(id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutMap.delete(id);
      }
    },
  };
}
