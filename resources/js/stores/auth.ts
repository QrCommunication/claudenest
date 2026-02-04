import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';
import { api } from '@/composables/useApi';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('auth_token'));
  const isLoading = ref(false);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  const setToken = (newToken: string | null) => {
    token.value = newToken;
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
    } else {
      localStorage.removeItem('auth_token');
    }
  };

  const fetchUser = async () => {
    if (!token.value) return null;

    try {
      isLoading.value = true;
      const response = await api.get<User>('/user');
      user.value = response.data;
      return response.data;
    } catch (error) {
      setToken(null);
      user.value = null;
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post<{ token: string; user: User }>('/login', {
      email,
      password,
    });
    
    setToken(response.data.token);
    user.value = response.data.user;
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } finally {
      setToken(null);
      user.value = null;
    }
  };

  const init = async () => {
    if (token.value) {
      await fetchUser();
    }
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    setToken,
    fetchUser,
    login,
    logout,
    init,
  };
});
