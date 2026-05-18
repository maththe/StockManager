import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/services/axios/api';
import { mutationError, mutationSuccess } from './mutationToast';

export interface Divergence {
  id: string;
  source: string;
  sourceId?: string;
  status: 'PENDING' | 'RESOLVED';
  notes?: string;
  occurredAt: string;
  resolvedAt?: string;
  resolvedBy?: { id: string; name: string };
  createdBy?: { id: string; name: string };
  items: Array<{
    id: string;
    quantity: number;
    type: 'MISSING' | 'DAMAGED';
    notes?: string;
    item: { id: string; name: string };
  }>;
  maintenances?: Array<{ id: string; code: string; status: string }>;
}

export const useDivergences = (status?: 'PENDING' | 'RESOLVED') => {
  return useQuery({
    queryKey: ['divergences', status || ''],
    queryFn: async () => {
      const params = status ? { status } : {};
      const response = await api.get<Divergence[]>('/divergences', { params });
      return response.data;
    },
  });
};

export const useDivergence = (id: string) => {
  return useQuery({
    queryKey: ['divergences', id],
    queryFn: async () => {
      const response = await api.get<Divergence>(`/divergences/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useResolverDivergencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<Divergence>(`/divergences/${id}/resolver`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divergences'] });
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      mutationSuccess('Divergência resolvida. Manutenções criadas para itens avariados.');
    },
    onError: (error) => mutationError('Erro ao resolver divergência.', error),
  });
};
