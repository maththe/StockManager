import { FormProvider, useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { InputDate } from '~/components/Form/InputDate';
import { InputForm } from '~/components/Form/InputForm';
import { SelectForm } from '~/components/Form/SelectForm';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import type { Client } from '~/types/client';
import type { User } from '~/types/user';
import type {
  CreateEventInput,
  Event,
  EventStatus,
  UpdateEventInput,
} from '~/types/event';

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  clients: Client[];
  users: User[];
  onSubmit: (data: CreateEventInput | UpdateEventInput) => Promise<void>;
  isLoading?: boolean;
}

const createStatusOptions: Array<{ value: EventStatus; label: string }> = [
  { value: 'PLANNING', label: 'Planejamento' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
];

const editStatusOptions: Array<{
  value: EventStatus;
  label: string;
  disabled?: boolean;
}> = [
    { value: 'PLANNING', label: 'Planejamento' },
    { value: 'IN_PROGRESS', label: 'Em andamento (use Iniciar evento)', disabled: true },
    {
      value: 'COMPLETED',
      label: 'Concluído (use o botão Concluir na página do evento)',
      disabled: true,
    },
  ];

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const toTimeLocal = (value?: string | null) => {
  const local = toDateTimeLocal(value);
  return local ? local.slice(11, 16) : '';
};

const toIsoString = (value: string) => new Date(value).toISOString();

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  clients,
  users,
  onSubmit,
  isLoading = false,
}: EventFormDialogProps) {
  type FormValues = Omit<CreateEventInput, 'endDate'> & { endTime: string };

  const form = useForm<FormValues>({
    values: event
      ? {
        eventName: event.eventName,
        startDate: toDateTimeLocal(event.startDate),
        endTime: toTimeLocal(event.endDate),
        eventLocation: event.eventLocation,
        status: event.status,
        clientId: event.clientId,
        responsibleId: event.responsibleId ?? '',
      }
      : {
        eventName: '',
        startDate: '',
        endTime: '',
        eventLocation: '',
        status: 'PLANNING',
        clientId: '',
        responsibleId: '',
      },
  });

  const statusOptions = event ? editStatusOptions : createStatusOptions;

  const handleSubmit = async (data: FormValues) => {
    const dateOnly = data.startDate.split('T')[0];
    const endDate = data.endTime
      ? toIsoString(`${dateOnly}T${data.endTime}`)
      : null;

    await onSubmit({
      eventName: data.eventName,
      startDate: toIsoString(data.startDate),
      endDate,
      eventLocation: data.eventLocation,
      status: data.status,
      clientId: data.clientId,
      responsibleId: data.responsibleId || null,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl bg-card/75 backdrop-blur-md sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{event ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
        </DialogHeader>

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 px-4 py-2"
          >
            <InputForm
              name="eventName"
              label="Nome do evento"
              placeholder="Ex: Feira corporativa"
              required
            />
            <InputForm
              name="eventLocation"
              label="Local"
              placeholder="Centro de convenções"
              required
            />


            <div className="grid gap-4 md:grid-cols-2">
              <InputDate
                name="startDate"
                endTimeName="endTime"
                label="Data e hora de início"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <SelectForm
                name="status"
                label="Status"
                options={statusOptions}
                placeholder="Selecione o status"
                required
              />
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
            </div>

            <SelectForm
              name="responsibleId"
              label="Responsável"
              options={users.map((user) => ({
                value: user.id,
                label: user.name,
              }))}
              placeholder="Selecione um responsável"
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
                {event ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
