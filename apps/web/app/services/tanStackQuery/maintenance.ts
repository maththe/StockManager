import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/services/axios/api';
import { mutationError, mutationSuccess } from './mutationToast';
import type {
  Maintenance,
  MaintenanceStatus,
  CreateMaintenanceInput,
  UpdateMaintenanceInput,
} from '~/types/maintenance';

export const useMaintenances = (status?: MaintenanceStatus) => {
  return useQuery({
    queryKey: ['maintenances', status || ''],
    queryFn: async () => {
      const params = status ? { status } : {};
      const response = await api.get<Maintenance[]>('/maintenance', { params });
      return response.data;
    },
  });
};

export const useMaintenance = (id: string) => {
  return useQuery({
    queryKey: ['maintenances', id],
    queryFn: async () => {
      const response = await api.get<Maintenance>(`/maintenance/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateMaintenance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMaintenanceInput) => {
      const response = await api.post<Maintenance>('/maintenance', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Manutenção criada com sucesso.');
    },
    onError: (error) => mutationError('Erro ao criar manutenção.', error),
  });
};

export const useUpdateMaintenance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMaintenanceInput }) => {
      const response = await api.patch<Maintenance>(`/maintenance/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['maintenances', id] });
      mutationSuccess('Manutenção atualizada.');
    },
    onError: (error) => mutationError('Erro ao atualizar manutenção.', error),
  });
};

export const useConcluirMaintenance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<Maintenance>(`/maintenance/${id}/concluir`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['maintenances', id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Manutenção concluída. Item devolvido ao estoque.');
    },
    onError: (error) => mutationError('Erro ao concluir manutenção.', error),
  });
};

export const useCancelarMaintenance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<Maintenance>(`/maintenance/${id}/cancelar`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['maintenances', id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Manutenção cancelada.');
    },
    onError: (error) => mutationError('Erro ao cancelar manutenção.', error),
  });
};
