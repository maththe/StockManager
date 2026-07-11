import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/services/axios/api';
import { mutationError, mutationSuccess } from '../mutationToast';
import type { Category } from '~/types/category';

export type { Category };

export const useCategories = (search?: string) => {
  return useQuery({
    queryKey: ['categories', search || ''],
    queryFn: async () => {
      const params = search ? { search } : {};
      const response = await api.get<Category[]>('/categories', { params });
      return response.data;
    },
  });
};

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: async () => {
      const response = await api.get<Category>(`/categories/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>,
    ) => {
      const response = await api.post<Category>('/categories', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      mutationSuccess('Categoria criada com sucesso.');
    },
    onError: (error) => mutationError('Erro ao criar categoria.', error),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
    }) => {
      const response = await api.patch<Category>(`/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      mutationSuccess('Categoria atualizada com sucesso.');
    },
    onError: (error) => mutationError('Erro ao atualizar categoria.', error),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Categoria removida com sucesso.');
    },
    onError: (error) => mutationError('Erro ao remover categoria.', error),
  });
};
