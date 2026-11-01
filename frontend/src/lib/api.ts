import axios from 'axios';

/**
 * Validates whether a token string is a well-formed compact JWT (3 dot-separated base64 segments)
 * as required by JJWT and RFC 7519.
 */
export const isValidCompactJwt = (token: string | null | undefined): boolean => {
  if (!token || typeof token !== 'string') return false;
  const parts = token.trim().split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0);
};

export const isDemoToken = (token: string | null | undefined): boolean => {
  if (!token) return false;
  return token.startsWith('demo-') || token.startsWith('mock-');
};

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      if (isValidCompactJwt(token) && !isDemoToken(token)) {
        config.headers.Authorization = `Bearer ${token.trim()}`;
      } else {
        // Automatically purge any invalid, malformed, or mock token string so it is
        // never transmitted to the Spring Boot backend
        localStorage.removeItem('accessToken');
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for session expiration and error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export default api;
