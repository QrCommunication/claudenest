import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

// Simple useApi composable for testing
interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

function useApi<T = any>(url: string, options: ApiOptions = {}) {
  const data = ref<T | null>(null);
  const error = ref<Error | null>(null);
  const isLoading = ref(false);

  const execute = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      data.value = result;
      return result;
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    data,
    error,
    isLoading,
    execute,
  };
}

describe('useApi Composable', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });

  it('initializes with correct default values', () => {
    const { data, error, isLoading } = useApi('/api/test');

    expect(data.value).toBeNull();
    expect(error.value).toBeNull();
    expect(isLoading.value).toBe(false);
  });

  it('makes GET request and returns data', async () => {
    const mockData = { success: true, data: { id: 1, name: 'Test' } };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { data, execute } = useApi('/api/machines');
    await execute();

    expect(global.fetch).toHaveBeenCalledWith('/api/machines', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: undefined,
    });
    expect(data.value).toEqual(mockData);
  });

  it('makes POST request with body', async () => {
    const mockData = { success: true, data: { id: 1 } };
    const postBody = { name: 'New Machine', platform: 'linux' };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { data, execute } = useApi('/api/machines', {
      method: 'POST',
      body: postBody,
    });
    await execute();

    expect(global.fetch).toHaveBeenCalledWith('/api/machines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postBody),
    });
    expect(data.value).toEqual(mockData);
  });

  it('sets loading state correctly', async () => {
    (global.fetch as any).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true }),
      }), 100))
    );

    const { isLoading, execute } = useApi('/api/test');
    
    expect(isLoading.value).toBe(false);
    
    const promise = execute();
    expect(isLoading.value).toBe(true);
    
    await promise;
    expect(isLoading.value).toBe(false);
  });

  it('handles HTTP errors correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const { error, execute } = useApi('/api/machines/nonexistent');

    await expect(execute()).rejects.toThrow('HTTP error! status: 404');
    expect(error.value).toBeTruthy();
  });

  it('handles network errors correctly', async () => {
    const networkError = new Error('Network error');
    (global.fetch as any).mockRejectedValueOnce(networkError);

    const { error, execute } = useApi('/api/machines');

    await expect(execute()).rejects.toThrow('Network error');
    expect(error.value).toBe(networkError);
  });

  it('includes custom headers in request', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { execute } = useApi('/api/machines', {
      headers: {
        'Authorization': 'Bearer token123',
        'X-Custom-Header': 'value',
      },
    });
    await execute();

    expect(global.fetch).toHaveBeenCalledWith('/api/machines', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token123',
        'X-Custom-Header': 'value',
      },
      body: undefined,
    });
  });

  it('clears error on subsequent successful request', async () => {
    // First request fails
    (global.fetch as any).mockRejectedValueOnce(new Error('Error'));
    const { error, execute } = useApi('/api/test');
    
    await expect(execute()).rejects.toThrow();
    expect(error.value).toBeTruthy();

    // Second request succeeds
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });
    
    await execute();
    expect(error.value).toBeNull();
  });
});
