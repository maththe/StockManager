import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '~/services/axios/api';
import type { CreateItemInput, Item, UpdateItemInput } from '~/types/item';
import { mutationError, mutationSuccess } from '../mutationToast';

// Queries
export const useItems = () => {
  return useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get<Item[]>('/items');
      return response.data;
    },
  });
};

export const useItem = (id: string) => {
  return useQuery({
    queryKey: ['items', id],
    queryFn: async () => {
      const response = await api.get<Item>(`/items/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Mutations
export const useCreateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateItemInput) => {
      const response = await api.post<Item>('/items', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Item criado com sucesso.');
    },
    onError: (error) => mutationError('Erro ao criar item.', error),
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateItemInput }) => {
      const response = await api.patch<Item>(`/items/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['items', variables.id] });
      mutationSuccess('Item atualizado com sucesso.');
    },
    onError: (error) => mutationError('Erro ao atualizar item.', error),
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Item removido com sucesso.');
    },
    onError: (error) => mutationError('Erro ao remover item.', error),
  });
};
