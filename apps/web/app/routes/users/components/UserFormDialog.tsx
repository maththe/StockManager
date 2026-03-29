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
import type { CreateUserInput, UpdateUserInput, User } from '~/types/user';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSubmit: (data: CreateUserInput | UpdateUserInput) => Promise<void>;
  isLoading?: boolean;
}

function getDefaultValues(user?: User | null): CreateUserInput {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    senha: '',
  };
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isLoading = false,
}: UserFormDialogProps) {
  const form = useForm<CreateUserInput>({
    defaultValues: getDefaultValues(user),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(user));
    }
  }, [form, open, user]);

  const handleSubmit = async (data: CreateUserInput) => {
    const payload =
      user && !data.senha ? { name: data.name, email: data.email } : data;
    await onSubmit(payload);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl bg-card/75 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuario' : 'Novo Usuario'}</DialogTitle>
        </DialogHeader>

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 px-4 py-2"
          >
            <InputForm
              name="name"
              label="Nome"
              placeholder="Nome do usuario"
              required
            />
            <InputForm
              name="email"
              label="Email"
              placeholder="usuario@empresa.com"
              required
              type="email"
            />
            <InputForm
              name="senha"
              label={user ? 'Nova senha' : 'Senha'}
              placeholder={
                user ? 'Deixe em branco para manter a atual' : 'Digite a senha'
              }
              type="password"
              required={!user}
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
                {user ? 'Salvar usuario' : 'Criar usuario'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
