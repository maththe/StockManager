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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '~/components/ui/dialog';
import type { Event } from '~/types/event';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(
    new Date(value),
  );

interface EventCompleteDialogProps {
  open: boolean;
  event: Event | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EventCompleteDialog({
  open,
  event,
  isLoading,
  onConfirm,
  onCancel,
}: EventCompleteDialogProps) {
  const itemsCount = event?.eventItems?.length ?? 0;
  const reservedTotal =
    event?.eventItems?.reduce(
      (total, current) => total + (current.plannedQuantity ?? 0),
      0,
    ) ?? 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !isLoading) onCancel();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden p-0 sm:max-w-md md:max-w-lg"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary px-6 pt-8 pb-12 text-center text-primary-foreground">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <Sparkles className="absolute left-6 top-6 h-5 w-5 animate-pulse text-white/40" />
            <Sparkles
              className="absolute right-8 top-10 h-4 w-4 animate-pulse text-white/30"
              style={{ animationDelay: '0.4s' }}
            />
            <Sparkles
              className="absolute left-12 top-20 h-3 w-3 animate-pulse text-white/40"
              style={{ animationDelay: '0.8s' }}
            />
            <Sparkles
              className="absolute right-14 top-24 h-4 w-4 animate-pulse text-white/30"
              style={{ animationDelay: '1.1s' }}
            />
            <PartyPopper
              className="absolute -left-2 bottom-4 h-10 w-10 -rotate-12 text-white/15"
            />
            <PartyPopper
              className="absolute -right-2 bottom-6 h-10 w-10 rotate-12 text-white/15"
            />
          </div>

          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 shadow-lg ring-4 ring-white/20 backdrop-blur">
            <Trophy className="h-10 w-10 text-white drop-shadow-md" />
            <span className="absolute inset-0 animate-ping rounded-full bg-white/10" />
          </div>

          <DialogTitle className="relative mt-5 text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Parabéns!
          </DialogTitle>
          <DialogDescription className="relative mt-2 text-sm font-medium text-white/85">
            Mais um evento realizado com sucesso{event ? '.' : '!'}
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
                    {formatDate(event.startDate)} → {formatDate(event.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="line-clamp-1">{event.eventLocation}</span>
                </div>
                {event.responsible?.name && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <UserRound className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="line-clamp-1">
                      {event.responsible.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
              <div className="text-2xl font-extrabold text-primary">
                {itemsCount}
              </div>
              <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {itemsCount === 1 ? 'item' : 'itens'} no evento
              </div>
            </div>
            <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-3 text-center">
              <div className="text-2xl font-extrabold text-secondary">
                {reservedTotal}
              </div>
              <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                unidades reservadas
              </div>
            </div>
          </div>

          <p className="rounded-lg bg-muted/40 px-4 py-3 text-center text-xs text-muted-foreground">
            Ao confirmar, todos os itens reservados retornam ao estoque
            disponível.
          </p>

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
              onClick={onConfirm}
              disabled={isLoading}
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
