import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { InputForm } from '~/components/Form/InputForm';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
} from '~/types/client';

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSubmit: (data: CreateClientInput | UpdateClientInput) => Promise<void>;
  isLoading?: boolean;
}

function getDefaultValues(client?: Client | null): CreateClientInput {
  return {
    companyName: client?.companyName ?? '',
    taxId: client?.taxId ?? '',
    contactName: client?.contactName ?? '',
  };
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onSubmit,
  isLoading = false,
}: ClientFormDialogProps) {
  const form = useForm<CreateClientInput>({
    defaultValues: getDefaultValues(client),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(client));
    }
  }, [client, form, open]);

  const handleSubmit = async (data: CreateClientInput) => {
    await onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl bg-card/75 backdrop-blur-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 px-4 py-2"
          >
            <InputForm
              name="companyName"
              label="Empresa"
              placeholder="Empresa cliente"
              required
            />
            <InputForm
              name="taxId"
              label="CNPJ/CPF"
              placeholder="00.000.000/0000-00"
              required
            />
            <InputForm
              name="contactName"
              label="Contato"
              placeholder="Nome do responsável"
            />

            <DialogFooter className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-primary to-secondary text-white"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {client ? 'Salvar cliente' : 'Criar cliente'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
