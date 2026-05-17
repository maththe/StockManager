import { useEffect, useMemo, useState } from 'react';
import { type Control, FormProvider, useController, useForm } from 'react-hook-form';
import { Clock3, Loader2 } from 'lucide-react';
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
import { Label } from '~/components/ui/label';
import type { Client } from '~/types/client';
import type { User } from '~/types/user';
import type {
  CompleteEventItemInput,
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

const statusOptions: Array<{ value: EventStatus; label: string }> = [
  { value: 'PLANNING', label: 'Planejamento' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
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

const getDivergenceQuantity = (
  eventItem: NonNullable<Event['eventItems']>[number],
  type: 'MISSING' | 'DAMAGED',
) =>
  eventItem.divergences
    ?.filter((divergence) => divergence.type === type)
    .reduce((total, divergence) => total + divergence.quantity, 0) ?? 0;

const buildCompletionDrafts = (event?: Event | null) =>
  Object.fromEntries(
    (event?.eventItems ?? []).map((eventItem) => [
      eventItem.id,
      {
        eventItemId: eventItem.id,
        returnedQuantity:
          eventItem.returnedQuantity ||
          Math.max(
            0,
            eventItem.plannedQuantity -
              getDivergenceQuantity(eventItem, 'MISSING') -
              getDivergenceQuantity(eventItem, 'DAMAGED'),
          ),
        missingQuantity: getDivergenceQuantity(eventItem, 'MISSING'),
        damagedQuantity: getDivergenceQuantity(eventItem, 'DAMAGED'),
        notes:
          eventItem.divergences?.find((divergence) => divergence.notes)
            ?.notes ?? '',
      },
    ]),
  ) as Record<string, CompleteEventItemInput>;

function EndTimeInput({ control }: { control: Control<any> }) {
  const { field } = useController({ control, name: 'endTime' });

  return (
    <div className="grid gap-2">
      <label htmlFor="endTime" className="text-sm font-medium">
        Horário de término
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">(opcional)</span>
      </label>
      <div className="relative">
        <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
        <input
          id="endTime"
          type="time"
          className="h-11 w-full rounded-xl border border-input bg-background/80 pl-10 pr-3 text-sm text-foreground shadow-sm outline-none transition hover:border-ring/50 focus:border-ring focus:ring-2 focus:ring-ring/30"
          value={field.value ?? ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
        />
      </div>
    </div>
  );
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  clients,
  users,
  onSubmit,
  isLoading = false,
}: EventFormDialogProps) {
  const [completionDrafts, setCompletionDrafts] = useState(() =>
    buildCompletionDrafts(event),
  );

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
          inventoryCountConfirmed: false,
        }
      : {
          eventName: '',
          startDate: '',
          endTime: '',
          eventLocation: '',
          status: 'PLANNING',
          clientId: '',
          responsibleId: '',
          inventoryCountConfirmed: false,
        },
  });

  useEffect(() => {
    setCompletionDrafts(buildCompletionDrafts(event));
  }, [event]);

  const currentStatus = form.watch('status');
  const needsInventoryConfirmation =
    currentStatus === 'COMPLETED' && event?.status !== 'COMPLETED';

  const eventItems = useMemo(
    () => event?.eventItems ?? [],
    [event?.eventItems],
  );

  const completionErrors = useMemo(
    () =>
      eventItems
        .map((eventItem) => {
          const draft = completionDrafts[eventItem.id];
          const totalCounted =
            (draft?.returnedQuantity ?? 0) +
            (draft?.missingQuantity ?? 0) +
            (draft?.damagedQuantity ?? 0);

          return totalCounted === eventItem.plannedQuantity
            ? null
            : `${eventItem.item.name}: total contado (${totalCounted}) deve ser igual ao reservado (${eventItem.plannedQuantity}).`;
        })
        .filter(Boolean),
    [completionDrafts, eventItems],
  );

  const handleCompletionDraftChange = (
    eventItemId: string,
    field: keyof CompleteEventItemInput,
    value: string,
  ) => {
    setCompletionDrafts((current) => ({
      ...current,
      [eventItemId]: {
        ...current[eventItemId],
        eventItemId,
        [field]:
          field === 'notes'
            ? value
            : Math.max(0, Number.parseInt(value, 10) || 0),
      },
    }));
  };

  const handleSubmit = async (data: FormValues) => {
    if (needsInventoryConfirmation && completionErrors.length) {
      return;
    }

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
      inventoryCountConfirmed: data.inventoryCountConfirmed,
      completionItems: needsInventoryConfirmation
        ? Object.values(completionDrafts)
        : undefined,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-2xl bg-card/75 backdrop-blur-md">
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
              <InputDate name="startDate" label="Data e hora de início" required />
              <EndTimeInput control={form.control} />
            </div>

            {needsInventoryConfirmation && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    Antes de concluir o evento, confirme que a contagem física
                    dos itens foi realizada.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      id="inventoryCountConfirmed"
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      {...form.register('inventoryCountConfirmed', {
                        validate: (value) =>
                          value ||
                          'Confirme a contagem dos itens para finalizar o evento.',
                      })}
                    />
                    <Label
                      htmlFor="inventoryCountConfirmed"
                      className="cursor-pointer text-sm text-destructive"
                    >
                      Confirmo que realizei a contagem dos itens e validei o
                      retorno ao estoque.
                    </Label>
                  </div>
                  {form.formState.errors.inventoryCountConfirmed && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.inventoryCountConfirmed.message}
                    </p>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Conferência de retorno e avarias
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Informe quantos itens voltaram íntegros, quantos estão
                      faltando e quantos chegaram quebrados/avariados.
                    </p>
                  </div>

                  {eventItems.length === 0 ? (
                    <p className="rounded-lg border border-border/60 bg-background/70 p-3 text-sm text-muted-foreground">
                      Este evento não possui itens reservados para conferir.
                    </p>
                  ) : (
                    <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                      {eventItems.map((eventItem) => {
                        const draft = completionDrafts[eventItem.id];
                        const totalCounted =
                          (draft?.returnedQuantity ?? 0) +
                          (draft?.missingQuantity ?? 0) +
                          (draft?.damagedQuantity ?? 0);
                        const hasError =
                          totalCounted !== eventItem.plannedQuantity;

                        return (
                          <div
                            key={eventItem.id}
                            className="rounded-xl border border-border/60 bg-background/80 p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {eventItem.item.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Reservado: {eventItem.plannedQuantity}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                  hasError
                                    ? 'bg-destructive/10 text-destructive'
                                    : 'bg-accent/15 text-accent'
                                }`}
                              >
                                Total contado: {totalCounted}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-3 md:grid-cols-3">
                              <label className="space-y-1 text-xs font-medium text-muted-foreground">
                                Retornaram
                                <input
                                  type="number"
                                  min={0}
                                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                                  value={draft?.returnedQuantity ?? 0}
                                  onChange={(currentEvent) =>
                                    handleCompletionDraftChange(
                                      eventItem.id,
                                      'returnedQuantity',
                                      currentEvent.target.value,
                                    )
                                  }
                                />
                              </label>
                              <label className="space-y-1 text-xs font-medium text-muted-foreground">
                                Faltantes
                                <input
                                  type="number"
                                  min={0}
                                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                                  value={draft?.missingQuantity ?? 0}
                                  onChange={(currentEvent) =>
                                    handleCompletionDraftChange(
                                      eventItem.id,
                                      'missingQuantity',
                                      currentEvent.target.value,
                                    )
                                  }
                                />
                              </label>
                              <label className="space-y-1 text-xs font-medium text-muted-foreground">
                                Avariados
                                <input
                                  type="number"
                                  min={0}
                                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                                  value={draft?.damagedQuantity ?? 0}
                                  onChange={(currentEvent) =>
                                    handleCompletionDraftChange(
                                      eventItem.id,
                                      'damagedQuantity',
                                      currentEvent.target.value,
                                    )
                                  }
                                />
                              </label>
                            </div>

                            <label className="mt-3 block space-y-1 text-xs font-medium text-muted-foreground">
                              Observações da avaria/falta
                              <textarea
                                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                                placeholder="Ex: 2 cadeiras com pernas quebradas ou item não devolvido pelo cliente"
                                value={draft?.notes ?? ''}
                                onChange={(currentEvent) =>
                                  handleCompletionDraftChange(
                                    eventItem.id,
                                    'notes',
                                    currentEvent.target.value,
                                  )
                                }
                              />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {completionErrors.length > 0 && (
                    <div className="space-y-1 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                      {completionErrors.map((error) => (
                        <p key={error} className="text-xs text-destructive">
                          {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                disabled={
                  isLoading ||
                  (needsInventoryConfirmation && completionErrors.length > 0)
                }
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
