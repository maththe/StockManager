import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "~/services/axios/api";
import type { CreateEventInput, Event, UpdateEventInput } from "~/types/event";

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
