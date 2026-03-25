import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '~/services/axios/api';
import { queryClient } from '../queryClient';
import { mutationError, mutationSuccess } from '../mutationToast';


export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

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
  return useMutation({
    mutationFn: async (payload: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
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
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> }) => {
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
