import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Loader2,
  MapPin,
  PartyPopper,
  Sparkles,
  Trophy,
  UserRound,
} from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '~/components/ui/dialog';
import { QuantityField } from '~/components/Form/QuantityInput';
import type { CompleteEventItemInput, Event } from '~/types/event';
import { ItemThumbnail } from './ItemThumbnail';
import { buildCompletionDrafts } from '../utils/utils';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(
    new Date(value),
  );

interface EventCompleteDialogProps {
  open: boolean;
  event: Event | null;
  isLoading: boolean;
  onConfirm: (completionItems: CompleteEventItemInput[]) => void;
  onCancel: () => void;
}

export function EventCompleteDialog({
  open,
  event,
  isLoading,
  onConfirm,
  onCancel,
}: EventCompleteDialogProps) {
  const eventItems = useMemo(() => event?.eventItems ?? [], [event?.eventItems]);
  const [drafts, setDrafts] = useState<Record<string, CompleteEventItemInput>>({});
  const [inventoryConfirmed, setInventoryConfirmed] = useState(false);

  useEffect(() => {
    if (!open) return;

    setDrafts(buildCompletionDrafts(event));
    setInventoryConfirmed(false);
  }, [event, open]);

  const itemsCount = eventItems.length;
  const reservedTotal = eventItems.reduce(
    (total, current) => total + (current.plannedQuantity ?? 0),
    0,
  );

  const completionErrors = eventItems
    .map((eventItem) => {
      const draft = drafts[eventItem.id];
      const totalCounted =
        (draft?.returnedQuantity ?? 0) +
        (draft?.missingQuantity ?? 0) +
        (draft?.damagedQuantity ?? 0);

      return totalCounted === eventItem.plannedQuantity
        ? null
        : `${eventItem.item.name}: total contado (${totalCounted}) deve ser igual ao reservado (${eventItem.plannedQuantity}).`;
    })
    .filter(Boolean);

  const handleDraftChange = (
    eventItemId: string,
    field: keyof CompleteEventItemInput,
    value: string,
  ) => {
    setDrafts((current) => ({
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

  const handleConfirm = () => {
    if (completionErrors.length > 0 || !inventoryConfirmed) return;
    onConfirm(Object.values(drafts));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !isLoading) onCancel();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-3xl"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary px-6 pt-8 pb-12 text-center text-primary-foreground">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <Sparkles className="absolute left-6 top-6 h-5 w-5 animate-pulse text-white/40" />
            <Sparkles
              className="absolute right-8 top-10 h-4 w-4 animate-pulse text-white/30"
              style={{ animationDelay: '0.4s' }}
            />
            <PartyPopper className="absolute -left-2 bottom-4 h-10 w-10 -rotate-12 text-white/15" />
            <PartyPopper className="absolute -right-2 bottom-6 h-10 w-10 rotate-12 text-white/15" />
          </div>

          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 shadow-lg ring-4 ring-white/20 backdrop-blur">
            <Trophy className="h-10 w-10 text-white drop-shadow-md" />
            <span className="absolute inset-0 animate-ping rounded-full bg-white/10" />
          </div>

          <DialogTitle className="relative mt-5 text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Finalizar evento
          </DialogTitle>
          <DialogDescription className="relative mt-2 text-sm font-medium text-white/85">
            Informe a contagem de retorno para devolver estoque, registrar divergências e gerar a tarefa de entrada no galpão.
          </DialogDescription>
        </div>

        <div className="space-y-5 px-6 pt-6 pb-6">
          {event && (
            <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-muted/30 p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Evento
              </div>
              <div className="mt-1 text-lg font-bold text-foreground">
                {event.eventName}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {event.client?.companyName ?? 'Cliente não associado'}
              </div>

              <div className="mt-4 grid gap-2 border-t border-border/40 pt-4 text-sm text-muted-foreground sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="line-clamp-1">
                    {formatDate(event.startDate)}
                    {event.endDate && ` → ${formatDate(event.endDate)}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="line-clamp-1">{event.eventLocation}</span>
                </div>
                {event.responsible?.name && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <UserRound className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="line-clamp-1">{event.responsible.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
              <div className="text-2xl font-extrabold text-primary">{itemsCount}</div>
              <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {itemsCount === 1 ? 'item' : 'itens'} no evento
              </div>
            </div>
            <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-3 text-center">
              <div className="text-2xl font-extrabold text-secondary">{reservedTotal}</div>
              <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                unidades reservadas
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {eventItems.map((eventItem) => {
              const draft = drafts[eventItem.id];
              const totalCounted =
                (draft?.returnedQuantity ?? 0) +
                (draft?.missingQuantity ?? 0) +
                (draft?.damagedQuantity ?? 0);

              return (
                <div key={eventItem.id} className="rounded-xl border border-border/50 bg-background/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-border/40 bg-muted/40">
                        <ItemThumbnail item={eventItem.item} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">{eventItem.item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Reservado: {eventItem.plannedQuantity} • Total contado: {totalCounted}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        totalCounted !== eventItem.plannedQuantity
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-accent/15 text-accent'
                      }`}
                    >
                      {totalCounted !== eventItem.plannedQuantity
                        ? 'Contagem incompleta'
                        : 'Contagem confere'}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <label className="space-y-1 text-xs font-medium text-muted-foreground">
                      Retornaram
                      <QuantityField
                        value={draft?.returnedQuantity ?? 0}
                        minimum={0}
                        maximum={eventItem.plannedQuantity}
                        size="compact"
                        onChange={(value) =>
                          handleDraftChange(eventItem.id, 'returnedQuantity', value)
                        }
                      />
                    </label>
                    <label className="space-y-1 text-xs font-medium text-muted-foreground">
                      Faltantes
                      <QuantityField
                        value={draft?.missingQuantity ?? 0}
                        minimum={0}
                        maximum={eventItem.plannedQuantity}
                        size="compact"
                        onChange={(value) =>
                          handleDraftChange(eventItem.id, 'missingQuantity', value)
                        }
                      />
                    </label>
                    <label className="space-y-1 text-xs font-medium text-muted-foreground">
                      Avariados
                      <QuantityField
                        value={draft?.damagedQuantity ?? 0}
                        minimum={0}
                        maximum={eventItem.plannedQuantity}
                        size="compact"
                        onChange={(value) =>
                          handleDraftChange(eventItem.id, 'damagedQuantity', value)
                        }
                      />
                    </label>
                  </div>

                  <Label className="mt-3 block space-y-1 text-xs font-medium text-muted-foreground">
                    Observações da avaria/falta
                    <textarea
                      className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="Ex: item não devolvido ou avariado"
                      value={draft?.notes ?? ''}
                      onChange={(currentEvent) =>
                        handleDraftChange(eventItem.id, 'notes', currentEvent.target.value)
                      }
                    />
                  </Label>
                </div>
              );
            })}
          </div>

          {completionErrors.length > 0 && (
            <div className="space-y-1 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              {completionErrors.map((error) => (
                <p key={error} className="text-xs text-destructive">
                  {error}
                </p>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-start gap-2">
              <input
                id="completeInventoryConfirmed"
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-primary"
                checked={inventoryConfirmed}
                disabled={isLoading}
                onChange={(currentEvent) =>
                  setInventoryConfirmed(currentEvent.target.checked)
                }
              />
              <Label
                htmlFor="completeInventoryConfirmed"
                className="cursor-pointer text-sm text-foreground"
              >
                Confirmo que realizei a contagem dos itens e validei o retorno
                ao estoque.
              </Label>
            </div>
            {!inventoryConfirmed && (
              <p className="mt-2 text-xs text-muted-foreground">
                Marque a confirmação da contagem para habilitar a finalização.
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="border-border/60"
            >
              Voltar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={
                isLoading || completionErrors.length > 0 || !inventoryConfirmed
              }
              className="bg-gradient-to-r from-primary to-secondary font-semibold text-white shadow-md transition-all hover:shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <Trophy className="mr-2 h-4 w-4" />
                  Finalizar evento
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
