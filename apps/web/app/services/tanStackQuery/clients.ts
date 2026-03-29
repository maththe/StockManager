import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/services/axios/api';
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
} from '~/types/client';
import { mutationError, mutationSuccess } from './mutationToast';

export const useClients = (search?: string) => {
  return useQuery({
    queryKey: ['clients', search || ''],
    queryFn: async () => {
      const params = search ? { search } : {};
      const response = await api.get<Client[]>('/clients', { params });
      return response.data;
    },
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateClientInput) => {
      const response = await api.post<Client>('/clients', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      mutationSuccess('Cliente criado com sucesso.');
    },
    onError: (error) => mutationError('Erro ao criar cliente.', error),
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateClientInput;
    }) => {
      const response = await api.patch<Client>(`/clients/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] });
      mutationSuccess('Cliente atualizado com sucesso.');
    },
    onError: (error) => mutationError('Erro ao atualizar cliente.', error),
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      mutationSuccess('Cliente removido com sucesso.');
    },
    onError: (error) => mutationError('Erro ao remover cliente.', error),
  });
};
