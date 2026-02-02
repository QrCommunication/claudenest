import { ref } from 'vue';
import type { Toast } from '@/types';

const toasts = ref<Toast[]>([]);

let toastId = 0;

export function useToast() {
  const addToast = (
    type: Toast['type'],
    title: string,
    message?: string,
    duration: number = 5000
  ) => {
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
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const success = (title: string, message?: string, duration?: number) => {
    return addToast('success', title, message, duration);
  };

  const error = (title: string, message?: string, duration?: number) => {
    return addToast('error', title, message, duration);
  };

  const warning = (title: string, message?: string, duration?: number) => {
    return addToast('warning', title, message, duration);
  };

  const info = (title: string, message?: string, duration?: number) => {
    return addToast('info', title, message, duration);
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}

export function useGlobalToast() {
  return {
    toasts,
    removeToast: (id: string) => {
      const index = toasts.value.findIndex((t) => t.id === id);
      if (index > -1) {
        toasts.value.splice(index, 1);
      }
    },
  };
}
