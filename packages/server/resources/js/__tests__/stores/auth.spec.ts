import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Simple auth store for testing
interface User {
  id: string;
  email: string;
  name: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const isLoading = ref(false);

  const isAuthenticated = computed(() => !!token.value);

  async function login(credentials: LoginCredentials) {
    isLoading.value = true;
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      user.value = data.data.user;
      token.value = data.data.token;
      localStorage.setItem('token', token.value);
    } catch (error) {
      user.value = null;
      token.value = null;
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      });
    } finally {
      user.value = null;
      token.value = null;
      localStorage.removeItem('token');
    }
  }

  function setUser(newUser: User) {
    user.value = newUser;
  }

  function setToken(newToken: string) {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    setUser,
    setToken,
  };
});

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  it('initializes with correct default state', () => {
    const store = useAuthStore();

    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(store.isLoading).toBe(false);
    expect(store.isAuthenticated).toBe(false);
  });

  it('authenticates user on successful login', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
    const mockToken = 'abc123token';

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: mockUser,
          token: mockToken,
        },
      }),
    });

    const store = useAuthStore();
    await store.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(store.user).toEqual(mockUser);
    expect(store.token).toBe(mockToken);
    expect(store.isAuthenticated).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
  });

  it('handles failed login correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const store = useAuthStore();

    await expect(store.login({
      email: 'wrong@example.com',
      password: 'wrongpass',
    })).rejects.toThrow('Login failed');

    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('sets loading state during login', async () => {
    (global.fetch as any).mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: { id: '1', email: 'test@example.com', name: 'Test' },
            token: 'token',
          },
        }),
      }), 100))
    );

    const store = useAuthStore();
    expect(store.isLoading).toBe(false);

    const loginPromise = store.login({
      email: 'test@example.com',
      password: 'password',
    });

    expect(store.isLoading).toBe(true);

    await loginPromise;
    expect(store.isLoading).toBe(false);
  });

  it('logs out user and clears state', async () => {
    const store = useAuthStore();
    
    // Set initial state
    store.setUser({ id: '1', email: 'test@example.com', name: 'Test' });
    store.setToken('token123');

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
    });

    await store.logout();

    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  });

  it('clears state even if logout request fails', async () => {
    const store = useAuthStore();
    
    store.setUser({ id: '1', email: 'test@example.com', name: 'Test' });
    store.setToken('token123');

    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await store.logout();

    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  });

  it('updates user correctly', () => {
    const store = useAuthStore();
    const newUser = { id: '2', email: 'new@example.com', name: 'New User' };

    store.setUser(newUser);

    expect(store.user).toEqual(newUser);
  });

  it('updates token correctly', () => {
    const store = useAuthStore();
    const newToken = 'newtoken456';

    store.setToken(newToken);

    expect(store.token).toBe(newToken);
    expect(localStorage.setItem).toHaveBeenCalledWith('token', newToken);
  });

  it('computes isAuthenticated correctly', () => {
    const store = useAuthStore();

    expect(store.isAuthenticated).toBe(false);

    store.setToken('token123');
    expect(store.isAuthenticated).toBe(true);

    store.token = null;
    expect(store.isAuthenticated).toBe(false);
  });
});
