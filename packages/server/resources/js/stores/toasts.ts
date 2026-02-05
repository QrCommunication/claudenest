import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration: number;
}

export const useToastStore = defineStore('toasts', () => {
  const toasts = ref<Toast[]>([]);
  let nextId = 0;

  function addToast(type: Toast['type'], message: string, duration = 5000) {
    const id = nextId++;
    toasts.value.push({ id, type, message, duration });
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  }

  function removeToast(id: number) {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  }

  function success(message: string, duration = 5000) {
    return addToast('success', message, duration);
  }

  function error(message: string, duration = 7000) {
    return addToast('error', message, duration);
  }

  function info(message: string, duration = 5000) {
    return addToast('info', message, duration);
  }

  function warning(message: string, duration = 6000) {
    return addToast('warning', message, duration);
  }

  function clear() {
    toasts.value = [];
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
    clear
  };
});
