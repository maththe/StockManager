import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "~/services/axios/api";
import type {
  CreateEventInput,
  CreateEventItemInput,
  Event,
  EventItem,
  UpdateEventInput,
  UpdateEventItemInput,
} from "~/types/event";

export const useEvents = () => {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await api.get<Event[]>("/events");
      return response.data;
    },
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateEventInput) => {
      const response = await api.post<Event>("/events", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEventInput }) => {
      const response = await api.patch<Event>(`/events/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["event-items", variables.id] });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

export const useEventItems = (eventId?: string) => {
  return useQuery({
    queryKey: ["event-items", eventId],
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
    mutationFn: async ({ eventId, data }: { eventId: string; data: CreateEventItemInput }) => {
      const response = await api.post<EventItem>(`/events/${eventId}/items`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-items", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
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
      const response = await api.patch<EventItem>(`/events/${eventId}/items/${eventItemId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-items", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
};

export const useDeleteEventItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, eventItemId }: { eventId: string; eventItemId: string }) => {
      await api.delete(`/events/${eventId}/items/${eventItemId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-items", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
};
