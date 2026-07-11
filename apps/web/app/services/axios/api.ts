import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') {
    return config;
  }

  const token = window.localStorage.getItem('access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Sessão expirada/inválida: limpa o token e volta para o login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error?.config?.url?.includes('/auth/login');

    if (
      typeof window !== 'undefined' &&
      error?.response?.status === 401 &&
      !isLoginRequest
    ) {
      clearSession();

      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  },
);

export const clearSession = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('access_token');
  delete api.defaults.headers.common['Authorization'];
};
