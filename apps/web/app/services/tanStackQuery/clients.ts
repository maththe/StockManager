import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "~/services/axios/api";
import { queryClient } from "./queryClient";
import type { Client, CreateClientInput } from "~/types/client";

export const useClients = () => {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await api.get<Client[]>("/clients");
      return response.data;
    },
  });
};

export const useCreateClient = () => {
  return useMutation({
    mutationFn: async (payload: CreateClientInput) => {
      const response = await api.post<Client>("/clients", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};
