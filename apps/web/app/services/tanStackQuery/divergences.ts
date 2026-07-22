import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/services/axios/api';
import type { CreateTaskDivergenceInput } from '~/types/task';
import { mutationError, mutationSuccess } from './mutationToast';

// Origem resolvida pelo backend (evento ou locação por trás do sourceId).
// null quando a origem é MANUAL/MAINTENANCE ou o registro foi apagado.
export interface DivergenceSourceRef {
  label: string;
  clientName?: string | null;
  date?: string | null;
}

export interface Divergence {
  id: string;
  source: string;
  sourceId?: string;
  sourceRef?: DivergenceSourceRef | null;
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
      mutationSuccess(
        'Divergencia resolvida. Manutencoes criadas para itens avariados.',
      );
    },
    onError: (error) => mutationError('Erro ao resolver divergencia.', error),
  });
};

export const useCreateTaskDivergence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      data,
    }: {
      taskId: string;
      data: CreateTaskDivergenceInput;
    }) => {
      const response = await api.post<Divergence>(
        `/divergences/tasks/${taskId}`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['divergences'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event-items'] });
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      // A divergência dá baixa imediata no estoque total do item
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Divergencia criada com sucesso.');
    },
    onError: (error) => mutationError('Erro ao criar divergencia.', error),
  });
};
