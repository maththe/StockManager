import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  Building2,
  CalendarDays,
  FileText,
  Hash,
  Loader2,
  MapPin,
  PackageOpen,
} from 'lucide-react';

import { InputDate } from '~/components/Form/InputDate';
import { InputForm } from '~/components/Form/InputForm';
import { SelectForm } from '~/components/Form/SelectForm';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import { useFormContext } from 'react-hook-form';

import type {
  CreateRentalInput,
  Rental,
  RentalStatus,
} from '~/types/rental';
import {
  rentalStatusDescription,
  toDateTimeLocal,
  toIsoString,
} from '../utils/rental-helpers';

const initialStatusOptions: Array<{ value: RentalStatus; label: string }> = [
  { value: 'DRAFT', label: 'Rascunho (não retirado)' },
  { value: 'ACTIVE', label: 'Ativa (itens já entregues)' },
];

interface RentalFormDialogProps {
  open: boolean;
  rental: Rental | null;
  clients: Array<{ id: string; companyName: string }>;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRentalInput) => Promise<void>;
}

type FormValues = {
  clientId: string;
  startDate: string;
  expectedReturn: string;
  location: string;
  notes: string;
  status: RentalStatus;
};

function getFormValues(rental: Rental | null): FormValues {
  if (!rental) {
    return {
      clientId: '',
      startDate: '',
      expectedReturn: '',
      location: '',
      notes: '',
      status: 'DRAFT',
    };
  }

  return {
    clientId: rental.clientId,
    startDate: toDateTimeLocal(rental.startDate),
    expectedReturn: toDateTimeLocal(rental.expectedReturn),
    location: rental.location ?? '',
    notes: rental.notes ?? '',
    status: rental.status,
  };
}

function StatusHint() {
  const { watch } = useFormContext<FormValues>();
  const status = watch('status');
  if (!status) return null;
  return (
    <p className="text-xs text-muted-foreground">
      {rentalStatusDescription[status]}
    </p>
  );
}

export function RentalFormDialog({
  open,
  rental,
  clients,
  isLoading,
  onOpenChange,
  onSubmit,
}: RentalFormDialogProps) {
  const isEdit = Boolean(rental);

  const form = useForm<FormValues>({
    defaultValues: getFormValues(rental),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(getFormValues(rental));
  }, [form, open, rental]);

  const handleSubmit = async (data: FormValues) => {
    await onSubmit({
      clientId: data.clientId,
      startDate: toIsoString(data.startDate),
      expectedReturn: toIsoString(data.expectedReturn),
      location: data.location || undefined,
      notes: data.notes || undefined,
      status: data.status,
    });
    if (!isEdit) {
      form.reset(getFormValues(null));
    }
    onOpenChange(false);
  };

  const statusOptions = initialStatusOptions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto rounded-2xl bg-card/75 backdrop-blur-md">
        <DialogHeader className="space-y-3 border-b border-border/40 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10 p-2 ring-1 ring-primary/20">
                <PackageOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {isEdit ? 'Editar Locação' : 'Nova Locação'}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {isEdit
                    ? 'Ajuste informações do contrato. Itens são gerenciados separadamente.'
                    : 'Cadastre o cliente, datas e detalhes. O código será gerado automaticamente.'}
                </DialogDescription>
              </div>
            </div>
            {isEdit && rental && (
              <div className="flex flex-col items-end gap-1">
                <span className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-mono font-semibold text-foreground shadow-sm">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  {rental.rentalCode}
                </span>
                <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  Código gerado
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 py-2"
          >
            <section className="space-y-4">
              <header className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Cliente & Período
                </h3>
              </header>

              <SelectForm
                name="clientId"
                label="Cliente"
                options={clients.map((client) => ({
                  value: client.id,
                  label: client.companyName,
                }))}
                placeholder="Selecione um cliente"
                required
              />

              <div className="grid gap-4 md:grid-cols-2">
                <InputDate
                  name="startDate"
                  label="Início da locação"
                  required
                />
                <InputDate
                  name="expectedReturn"
                  label="Devolução prevista"
                  required
                />
              </div>
            </section>

            <section className="space-y-4 border-t border-border/40 pt-5">
              <header className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Detalhes operacionais
                </h3>
              </header>

              <InputForm
                name="location"
                label="Local de entrega / uso"
                placeholder="Ex: Galpão central, Av. Brasil, 1000"
                hint="Onde os itens serão utilizados ou entregues."
              />

              <div className="grid gap-2">
                <Label htmlFor="rental-notes" className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Observações
                </Label>
                <textarea
                  id="rental-notes"
                  rows={3}
                  placeholder="Condições, contato de retirada, instruções de manuseio..."
                  className="min-h-20 w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground hover:border-ring/50 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
                  {...form.register('notes')}
                />
              </div>
            </section>

            <section className="space-y-3 border-t border-border/40 pt-5">
              <header className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Situação inicial
                </h3>
              </header>

              <SelectForm
                name="status"
                label="Situação da locação"
                options={statusOptions}
                placeholder="Selecione a situação"
                required
              />
              <StatusHint />
            </section>

            <DialogFooter className="flex justify-end gap-2 border-t border-border/40 pt-4">
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
                {isEdit ? 'Salvar alterações' : 'Criar locação'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
