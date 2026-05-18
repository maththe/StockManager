import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/services/axios/api';
import { mutationError, mutationSuccess } from './mutationToast';
import type {
  Task,
  TaskStatus,
  UpdateTaskInput,
  ConfirmTaskInput,
} from '~/types/task';

export const useTasks = (status?: TaskStatus) => {
  return useQuery({
    queryKey: ['tasks', status || ''],
    queryFn: async () => {
      const params = status ? { status } : {};
      const response = await api.get<Task[]>('/tasks', { params });
      return response.data;
    },
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const response = await api.get<Task>(`/tasks/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskInput }) => {
      const response = await api.patch<Task>(`/tasks/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      mutationSuccess('Tarefa atualizada.');
    },
    onError: (error) => mutationError('Erro ao atualizar tarefa.', error),
  });
};

export const useConcluirTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ConfirmTaskInput }) => {
      const response = await api.patch<Task>(`/tasks/${id}/concluir`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      mutationSuccess('Saída do galpão confirmada com sucesso.');
    },
    onError: (error) => mutationError('Erro ao confirmar saída.', error),
  });
};

export const useCancelarTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<Task>(`/tasks/${id}/cancelar`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      mutationSuccess('Tarefa cancelada.');
    },
    onError: (error) => mutationError('Erro ao cancelar tarefa.', error),
  });
};
