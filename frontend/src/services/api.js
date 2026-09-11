import { authStorage } from '../utils/authStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function fetchWithConfig(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  
  // Attach token if exists
  if (authStorage.hasToken()) {
    headers.set('Authorization', `Bearer ${authStorage.getToken()}`);
  }
  
  // Automatic JSON content-type if there's a body and it's not FormData
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Parse JSON safely
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (response.status !== 204) {
      data = await response.text();
    }

    if (!response.ok) {
      throw new ApiError(
        data?.message || data?.error || 'An unexpected error occurred',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network errors or parsing errors
    throw new ApiError(error.message || 'Network error', 0, null);
  }
}

export const api = {
  get: (endpoint, options = {}) => fetchWithConfig(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint, body, options = {}) => fetchWithConfig(endpoint, { 
    ...options, 
    method: 'POST',
    body: typeof body === 'object' ? JSON.stringify(body) : body
  }),
  
  put: (endpoint, body, options = {}) => fetchWithConfig(endpoint, { 
    ...options, 
    method: 'PUT',
    body: typeof body === 'object' ? JSON.stringify(body) : body
  }),
  
  delete: (endpoint, options = {}) => fetchWithConfig(endpoint, { ...options, method: 'DELETE' })
};
