import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/services/axios/api';
import { mutationError, mutationSuccess } from './mutationToast';
import type {
  CreateEventInput,
  CreateEventItemInput,
  Event,
  EventItem,
  UpdateEventInput,
  UpdateEventItemInput,
} from '~/types/event';

export const useEvents = (search?: string) => {
  return useQuery({
    queryKey: ['events', search || ''],
    queryFn: async () => {
      const params = search ? { search } : {};
      const response = await api.get<Event[]>('/events', { params });
      return response.data;
    },
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateEventInput) => {
      const response = await api.post<Event>('/events', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      mutationSuccess('Evento criado com sucesso.');
    },
    onError: (error) => mutationError('Erro ao criar evento.', error),
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateEventInput;
    }) => {
      const response = await api.patch<Event>(`/events/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', variables.id] });
      queryClient.invalidateQueries({
        queryKey: ['event-items', variables.id],
      });
      mutationSuccess('Evento atualizado com sucesso.');
    },
    onError: (error) => mutationError('Erro ao atualizar evento.', error),
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      mutationSuccess('Evento removido com sucesso.');
    },
    onError: (error) => mutationError('Erro ao remover evento.', error),
  });
};

export const useStartEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Event>(`/events/${id}/iniciar`);
      return response.data;
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-items', eventId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Evento iniciado e tarefa de saída criada.');
    },
    onError: (error) => mutationError('Erro ao iniciar evento.', error),
  });
};

export const useCancelEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<Event>(`/events/${id}/cancel`);
      return response.data;
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-items', eventId] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Evento cancelado e itens devolvidos ao estoque.');
    },
    onError: (error) => mutationError('Erro ao cancelar evento.', error),
  });
};

export const useCompleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<Event>(`/events/${id}/complete`);
      return response.data;
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-items', eventId] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Evento concluído e itens devolvidos ao estoque.');
    },
    onError: (error) => mutationError('Erro ao concluir evento.', error),
  });
};

export const useEventItems = (eventId?: string) => {
  return useQuery({
    queryKey: ['event-items', eventId],
    enabled: Boolean(eventId),
    queryFn: async () => {
      const response = await api.get<EventItem[]>(`/events/${eventId}/items`);
      return response.data;
    },
  });
};

export const useCreateEventItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      data,
    }: {
      eventId: string;
      data: CreateEventItemInput;
    }) => {
      const response = await api.post<EventItem>(
        `/events/${eventId}/items`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['event-items', variables.eventId],
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Item adicionado ao evento com sucesso.');
    },
    onError: (error) =>
      mutationError('Erro ao adicionar item ao evento.', error),
  });
};

export const useUpdateEventItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      eventItemId,
      data,
    }: {
      eventId: string;
      eventItemId: string;
      data: UpdateEventItemInput;
    }) => {
      const response = await api.patch<EventItem>(
        `/events/${eventId}/items/${eventItemId}`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['event-items', variables.eventId],
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Item do evento atualizado com sucesso.');
    },
    onError: (error) =>
      mutationError('Erro ao atualizar item do evento.', error),
  });
};

export const useDeleteEventItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      eventItemId,
    }: {
      eventId: string;
      eventItemId: string;
    }) => {
      await api.delete(`/events/${eventId}/items/${eventItemId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['event-items', variables.eventId],
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      mutationSuccess('Item removido do evento com sucesso.');
    },
    onError: (error) => mutationError('Erro ao remover item do evento.', error),
  });
};
