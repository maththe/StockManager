import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/services/axios/api';
import { mutationError, mutationSuccess } from './mutationToast';
import type {
  Task,
  TaskStatus,
  TaskType,
  UpdateTaskInput,
  ConfirmTaskInput,
  CreatePartialTaskInput,
} from '~/types/task';

export interface UseTasksFilters {
  status?: TaskStatus;
  type?: TaskType;
}

export const useTasks = (filters?: UseTasksFilters) => {
  const status = filters?.status;
  const type = filters?.type;
  return useQuery({
    queryKey: ['tasks', status || '', type || ''],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      if (type) params.type = type;
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
    onSuccess: (task, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });

      // A contagem final devolve estoque, fecha o evento e pode gerar divergência.
      const isContagemFinal = task?.type === 'ENTRADA_GALPAO' && !!task?.eventId;
      if (isContagemFinal) {
        queryClient.invalidateQueries({ queryKey: ['items'] });
        queryClient.invalidateQueries({ queryKey: ['divergences'] });
        if (task?.eventId) {
          queryClient.invalidateQueries({ queryKey: ['events', task.eventId] });
          queryClient.invalidateQueries({
            queryKey: ['event-items', task.eventId],
          });
        }
      }

      const message = isContagemFinal
        ? 'Contagem finalizada. Estoque atualizado e evento concluído.'
        : task?.type === 'ENTRADA_GALPAO'
          ? 'Entrada no galpão confirmada com sucesso.'
          : 'Saída do galpão confirmada com sucesso.';
      mutationSuccess(message);
    },
    onError: (error) => mutationError('Erro ao confirmar tarefa.', error),
  });
};

export const useConfirmarTaskItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      taskItemId,
      confirmed,
      confirmedQuantity,
    }: {
      taskId: string;
      taskItemId: string;
      confirmed: boolean;
      // Só é aceita na contagem final de evento; nas demais o backend impõe
      // a quantidade solicitada.
      confirmedQuantity?: number;
    }) => {
      const response = await api.patch<Task>(
        `/tasks/${taskId}/itens/${taskItemId}/confirmar`,
        { confirmed, confirmedQuantity },
      );
      return response.data;
    },
    onSuccess: (_, { taskId, confirmed }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      mutationSuccess(
        confirmed ? 'Item confirmado.' : 'Confirmação do item desfeita.',
      );
    },
    onError: (error) => mutationError('Erro ao confirmar item.', error),
  });
};

export const useCreatePartialTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      data,
    }: {
      eventId: string;
      data: CreatePartialTaskInput;
    }) => {
      const response = await api.post<Task>(`/tasks/evento/${eventId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', variables.eventId] });
      queryClient.invalidateQueries({
        queryKey: ['event-items', variables.eventId],
      });
      mutationSuccess('Tarefa parcial criada com sucesso.');
    },
    onError: (error) => mutationError('Erro ao criar tarefa parcial.', error),
  });
};

export const useCancelarTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<Task>(`/tasks/${id}/cancelar`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      mutationSuccess('Tarefa cancelada.');
    },
    onError: (error) => mutationError('Erro ao cancelar tarefa.', error),
  });
};
