import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/services/axios/api';
import { mutationError, mutationSuccess } from './mutationToast';
import type {
  CreateRentalInput,
  CreateRentalItemInput,
  Rental,
  RentalItem,
  UpdateRentalInput,
  UpdateRentalItemInput,
} from '~/types/rental';

export const useRentals = (search?: string) => {
  return useQuery({
    queryKey: ['rentals', search || ''],
    queryFn: async () => {
      const params = search ? { search } : {};
      const response = await api.get<Rental[]>('/rentals', { params });
      return response.data;
    },
  });
};

export const useRental = (id?: string) => {
  return useQuery({
    queryKey: ['rentals', 'detail', id],
    queryFn: async () => {
      const response = await api.get<Rental>(`/rentals/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
  });
};

export const useCreateRental = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRentalInput) => {
      const response = await api.post<Rental>('/rentals', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      mutationSuccess('Locação criada com sucesso.');
    },
    onError: (error) => mutationError('Erro ao criar locação.', error),
  });
};

export const useUpdateRental = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRentalInput }) => {
      const response = await api.patch<Rental>(`/rentals/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      mutationSuccess('Locação atualizada com sucesso.');
    },
    onError: (error) => mutationError('Erro ao atualizar locação.', error),
  });
};

export const useDeleteRental = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/rentals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      mutationSuccess('Locação removida com sucesso.');
    },
    onError: (error) => mutationError('Erro ao remover locação.', error),
  });
};

export const useCancelRental = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<Rental>(`/rentals/${id}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Locação cancelada e estoque devolvido.');
    },
    onError: (error) => mutationError('Erro ao cancelar locação.', error),
  });
};

export const useReturnRental = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Devolver cria a tarefa de contagem no galpão; a locação só vira
      // RETURNED quando a contagem é concluída. `task` vem null quando não
      // havia nada a conferir e a locação foi encerrada direto.
      const response = await api.patch<{
        rental: Rental;
        task: { id: string; code: string } | null;
      }>(`/rentals/${id}/return`);
      return response.data;
    },
    onSuccess: ({ task }) => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      mutationSuccess(
        task
          ? `Contagem de devolução enviada para o galpão (${task.code}). A locação será devolvida quando os funcionários terminarem.`
          : 'Locação devolvida. Não havia itens pendentes para conferir.',
      );
    },
    onError: (error) => mutationError('Erro ao devolver locação.', error),
  });
};

export const useCreateRentalGalpaoTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rentalId: string) => {
      const response = await api.post(`/rentals/${rentalId}/tasks`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      mutationSuccess('Tarefa de saída do galpão criada.');
    },
    onError: (error) => mutationError('Erro ao gerar tarefa de galpão.', error),
  });
};

export const useCreateRentalItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rentalId, data }: { rentalId: string; data: CreateRentalItemInput }) => {
      const response = await api.post<RentalItem>(`/rentals/${rentalId}/items`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Item adicionado à locação.');
    },
    onError: (error) => mutationError('Erro ao adicionar item à locação.', error),
  });
};

export const useUpdateRentalItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rentalId, rentalItemId, data }: { rentalId: string; rentalItemId: string; data: UpdateRentalItemInput }) => {
      const response = await api.patch<RentalItem>(`/rentals/${rentalId}/items/${rentalItemId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Item da locação atualizado.');
    },
    onError: (error) => mutationError('Erro ao atualizar item da locação.', error),
  });
};

export const useDeleteRentalItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rentalId, rentalItemId }: { rentalId: string; rentalItemId: string }) => api.delete(`/rentals/${rentalId}/items/${rentalItemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Item removido da locação.');
    },
    onError: (error) => mutationError('Erro ao remover item da locação.', error),
  });
};
