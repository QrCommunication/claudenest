import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

export const useToastStore = defineStore('toasts', () => {
  const toasts = ref<Toast[]>([])

  function add(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).substring(7)
    toasts.value.push({ ...toast, id })
    
    setTimeout(() => {
      remove(id)
    }, toast.duration || 5000)
  }

  function remove(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function success(message: string) {
    add({ type: 'success', message })
  }

  function error(message: string) {
    add({ type: 'error', message })
  }

  function warning(message: string) {
    add({ type: 'warning', message })
  }

  function info(message: string) {
    add({ type: 'info', message })
  }

  return {
    toasts,
    add,
    remove,
    success,
    error,
    warning,
    info
  }
})
