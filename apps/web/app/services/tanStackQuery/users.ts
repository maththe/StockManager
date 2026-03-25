import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../axios/api';
import type { CreateUserInput, UpdateUserInput, User } from '../../types/user';
import { mutationError, mutationSuccess } from './mutationToast';

// Queries
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get<User[]>('/users/lista');
      return response.data;
    },
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await api.get<User>(`/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useMe = () => {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const response = await api.get<User>('/users/me');
      return response.data;
    },
  });
};

// Mutations
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const response = await api.post<User>('/users/tenant', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      mutationSuccess('Usuário criado com sucesso.');
    },
    onError: (error) => mutationError('Erro ao criar usuário.', error),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserInput }) => {
      const response = await api.patch<User>(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
      mutationSuccess('Usuário atualizado com sucesso.');
    },
    onError: (error) => mutationError('Erro ao atualizar usuário.', error),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      mutationSuccess('Usuário removido com sucesso.');
    },
    onError: (error) => mutationError('Erro ao remover usuário.', error),
  });
};
