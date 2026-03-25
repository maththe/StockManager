import { useMutation } from '@tanstack/react-query';
import { api } from '../axios/api';
import { mutationError, mutationSuccess } from './mutationToast';

interface LoginInput {
  email: string;
  senha: string;
}

interface LoginResponse {
  access_token: string;
}

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await api.post<LoginResponse>('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Store the token
      localStorage.setItem('access_token', data.access_token);
      // Optionally set in axios headers for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
      mutationSuccess('Login realizado com sucesso.');
    },
    onError: (error) => mutationError('Erro ao realizar login.', error),
  });
};
