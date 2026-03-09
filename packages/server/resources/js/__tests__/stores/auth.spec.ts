import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';

vi.mock('@/composables/useApi', () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return { api, useApi: () => api };
});

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn() }),
}));

// Get the mocked api instance for assertion / control in tests
import { api } from '@/composables/useApi';

const mockApi = api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
    // Simulate no token stored between tests
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('initializes with correct default state', () => {
    const store = useAuthStore();

    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(store.isLoading).toBe(false);
    expect(store.isAuthenticated).toBe(false);
    expect(store.authError).toBeNull();
  });

  it('initializes token from localStorage using auth_token key', () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('stored_token');
    const store = useAuthStore();
    expect(store.token).toBe('stored_token');
  });

  it('authenticates user on successful login', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
    const mockToken = 'abc123token';

    mockApi.post.mockResolvedValueOnce({
      data: { success: true, data: { user: mockUser, token: mockToken } },
    });

    const store = useAuthStore();
    await store.login('test@example.com', 'password123');

    expect(store.user).toEqual(mockUser);
    expect(store.token).toBe(mockToken);
    expect(store.isAuthenticated).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken);
  });

  it('handles failed login and stores error message', async () => {
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 401, data: { error: { message: 'Invalid credentials' } } },
    });
    mockApi.post.mockRejectedValueOnce(axiosError);

    const store = useAuthStore();

    await expect(store.login('wrong@example.com', 'wrongpass')).rejects.toThrow();

    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.authError).toBe('Invalid credentials');
  });

  it('sets loading state during login', async () => {
    let resolveLogin!: (value: unknown) => void;
    mockApi.post.mockReturnValueOnce(
      new Promise(resolve => { resolveLogin = resolve; })
    );

    const store = useAuthStore();
    expect(store.isLoading).toBe(false);

    const loginPromise = store.login('test@example.com', 'password');
    expect(store.isLoading).toBe(true);

    resolveLogin({
      data: {
        success: true,
        data: { user: { id: '1', email: 'test@example.com', name: 'Test' }, token: 'token' },
      },
    });
    await loginPromise;
    expect(store.isLoading).toBe(false);
  });

  it('logs out user and clears state using auth_token key', async () => {
    const store = useAuthStore();
    store.setToken('token123');
    store.user = { id: '1', email: 'test@example.com', name: 'Test' } as any;

    mockApi.post.mockResolvedValueOnce({ data: { success: true } });

    await store.logout();

    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
  });

  it('clears state even if logout request fails', async () => {
    const store = useAuthStore();
    store.setToken('token123');
    store.user = { id: '1', email: 'test@example.com', name: 'Test' } as any;

    mockApi.post.mockRejectedValueOnce(new Error('Network error'));

    await store.logout().catch(() => {});

    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
  });

  it('setToken stores value under auth_token key and clears on null', () => {
    const store = useAuthStore();

    store.setToken('newtoken456');
    expect(store.token).toBe('newtoken456');
    expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'newtoken456');

    store.setToken(null);
    expect(store.token).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
  });

  it('isAuthenticated requires both token and user', () => {
    const store = useAuthStore();

    expect(store.isAuthenticated).toBe(false);

    store.setToken('token123');
    expect(store.isAuthenticated).toBe(false); // no user yet

    store.user = { id: '1', email: 'test@example.com', name: 'Test' } as any;
    expect(store.isAuthenticated).toBe(true);

    store.setToken(null);
    expect(store.isAuthenticated).toBe(false);
  });

  it('fetches current user when token is present', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
    mockApi.get.mockResolvedValueOnce({ data: { data: mockUser } });

    const store = useAuthStore();
    store.setToken('token123');
    const result = await store.fetchUser();

    expect(mockApi.get).toHaveBeenCalledWith('/auth/me');
    expect(store.user).toEqual(mockUser);
    expect(result).toEqual(mockUser);
  });

  it('returns null from fetchUser when no token is set', async () => {
    const store = useAuthStore();
    const result = await store.fetchUser();

    expect(mockApi.get).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('clears token when fetchUser request fails', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('Unauthorized'));

    const store = useAuthStore();
    store.setToken('expired_token');
    const result = await store.fetchUser();

    expect(store.token).toBeNull();
    expect(store.user).toBeNull();
    expect(result).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
  });

  it('registers user successfully', async () => {
    const mockUser = { id: '2', email: 'new@example.com', name: 'New User' };
    const mockToken = 'newtoken789';

    mockApi.post.mockResolvedValueOnce({
      data: { success: true, data: { user: mockUser, token: mockToken } },
    });

    const store = useAuthStore();
    const success = await store.register({
      name: 'New User',
      email: 'new@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    });

    expect(success).toBe(true);
    expect(store.user).toEqual(mockUser);
    expect(store.token).toBe(mockToken);
    expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken);
  });

  it('returns false and stores error when registration fails', async () => {
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 422, data: { error: { message: 'Email already taken' } } },
    });
    mockApi.post.mockRejectedValueOnce(axiosError);

    const store = useAuthStore();
    const success = await store.register({
      name: 'Test',
      email: 'taken@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    });

    expect(success).toBe(false);
    expect(store.authError).toBe('Email already taken');
  });

  it('clearErrors resets authError and fieldErrors', async () => {
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 401, data: { error: { message: 'Bad credentials' } } },
    });
    mockApi.post.mockRejectedValueOnce(axiosError);

    const store = useAuthStore();
    await store.login('x@x.com', 'wrong').catch(() => {});
    expect(store.authError).toBeTruthy();

    store.clearErrors();
    expect(store.authError).toBeNull();
    expect(store.fieldErrors).toEqual({});
  });

  it('init calls fetchUser when token exists', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test' };
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('existing_token');
    mockApi.get.mockResolvedValueOnce({ data: { data: mockUser } });

    const store = useAuthStore();
    await store.init();

    expect(mockApi.get).toHaveBeenCalledWith('/auth/me');
    expect(store.user).toEqual(mockUser);
  });

  it('init does nothing when no token exists', async () => {
    const store = useAuthStore();
    await store.init();

    expect(mockApi.get).not.toHaveBeenCalled();
  });
});
