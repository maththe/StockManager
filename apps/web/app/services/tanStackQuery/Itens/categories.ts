import { useQuery } from '@tanstack/react-query';
import { api } from '~/services/axios/api';


export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<Category[]>('/categories');
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
