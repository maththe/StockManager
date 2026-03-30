import { useMemo, useState } from 'react';
import {
  Ban,
  CalendarDays,
  Edit2,
  Loader2,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { useClients } from '~/services/tanStackQuery/clients';
import {
  useCancelEvent,
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  useUpdateEvent,
} from '~/services/tanStackQuery/events';
import type { Event } from '~/types/event';

import { EventFormDialog } from './EventFormDialog';

const statusLabel: Record<string, string> = {
  PLANNING: 'Planejamento',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
};

const statusClassName: Record<string, string> = {
  PLANNING:
    'bg-secondary/10 text-secondary ring-1 ring-secondary/30 dark:bg-secondary/20 dark:text-secondary',
  IN_PROGRESS:
    'bg-primary/10 text-primary ring-1 ring-primary/30 dark:bg-primary/20 dark:text-primary',
  COMPLETED:
    'bg-accent/10 text-accent ring-1 ring-accent/30 dark:bg-accent/20 dark:text-accent',
  CANCELLED:
    'bg-destructive/10 text-destructive ring-1 ring-destructive/30 dark:bg-destructive/20 dark:text-destructive',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));

export function EventsList() {
  const navigate = useNavigate();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: 'cancel' | 'delete';
    event: Event;
  } | null>(null);

  const { data: events = [], isLoading } = useEvents();
  const { data: clients = [] } = useClients();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const cancelEvent = useCancelEvent();

  const stats = useMemo(
    () => ({
      total: events.length,
      active: events.filter((event) => event.status === 'IN_PROGRESS').length,
      planning: events.filter((event) => event.status === 'PLANNING').length,
    }),
    [events],
  );

  const handleOpenDialog = (event?: Event) => {
    setEditingEvent(event ?? null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingEvent(null);
    setDialogOpen(false);
  };

  const handleSubmit = async (data: any) => {
    if (editingEvent) {
      await updateEvent.mutateAsync({ id: editingEvent.id, data });
    } else {
      await createEvent.mutateAsync(data);
    }
    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteEvent.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setCancellingId(id);
      await cancelEvent.mutateAsync(id);
    } finally {
      setCancellingId(null);
    }
  };

  const handleConfirmPendingAction = async () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'delete') {
      await handleDelete(pendingAction.event.id);
    } else {
      await handleCancel(pendingAction.event.id);
    }

    setPendingAction(null);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-primary">
              Total de eventos
            </CardDescription>
            <CardTitle className="mt-2 text-4xl font-bold text-primary">
              {stats.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-secondary/30 bg-gradient-to-br from-secondary/10 to-secondary/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Em planejamento
            </CardDescription>
            <CardTitle className="mt-2 text-4xl font-bold text-secondary">
              {stats.planning}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-accent">
              Em andamento
            </CardDescription>
            <CardTitle className="mt-2 text-4xl font-bold text-accent">
              {stats.active}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border border-border/50 bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-bold">
                Agenda de Eventos
              </CardTitle>
            </div>
            <CardDescription className="mt-2 text-sm text-muted-foreground">
              Clique em um evento para visualizar e gerenciar os itens
              reservados
            </CardDescription>
          </div>

          <Button
            onClick={() => handleOpenDialog()}
            className="w-full bg-gradient-to-r from-primary to-secondary font-medium text-white shadow-md transition-all hover:shadow-lg sm:w-auto"
          >
            <Plus className="mr-2 h-5 w-5" />
            Novo Evento
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays className="mx-auto mb-4 h-14 w-14 text-muted-foreground/50" />
              <div className="mb-3 text-lg font-semibold text-foreground">
                Nenhum evento cadastrado
              </div>
              <div className="mb-6 text-muted-foreground">
                Crie o primeiro evento e vincule-o a um cliente para comecar a
                operacao.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    navigate(`/dashboard/events/${event.id}/items`)
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/dashboard/events/${event.id}/items`);
                    }
                  }}
                  className="group cursor-pointer rounded-lg border border-border/50 bg-card/50 p-5 text-left shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/70 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-1 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                        {event.eventName}
                      </div>
                      <div className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                        {event.client?.companyName ?? 'Cliente nao assignado'}
                      </div>
                    </div>
                    <span
                      className={`inline-flex flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClassName[event.status]}`}
                    >
                      {statusLabel[event.status]}
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-border/30 pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {formatDate(event.startDate)} ate{' '}
                        {formatDate(event.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {event.eventLocation}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border/30 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-amber-200/50 text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700 dark:border-amber-900/50 dark:hover:bg-amber-950"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingAction({ type: 'cancel', event });
                      }}
                      disabled={
                        event.status === 'CANCELLED' ||
                        cancellingId === event.id ||
                        Boolean(pendingAction)
                      }
                    >
                      {cancellingId === event.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-border/50 transition-colors hover:bg-primary/10 hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(event);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-destructive/30 text-destructive transition-colors hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingAction({ type: 'delete', event });
                      }}
                      disabled={
                        deletingId === event.id || Boolean(pendingAction)
                      }
                    >
                      {deletingId === event.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EventFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
            return;
          }
          setDialogOpen(open);
        }}
        event={editingEvent}
        clients={clients}
        onSubmit={handleSubmit}
        isLoading={createEvent.isPending || updateEvent.isPending}
      />

      <AlertDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === 'delete'
                ? 'Excluir evento?'
                : 'Cancelar evento?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === 'delete'
                ? `Esta acao removera permanentemente o evento "${pendingAction.event.eventName}".`
                : `Ao cancelar "${pendingAction?.event.eventName}", todos os itens reservados voltarao ao estoque.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId || cancellingId)}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPendingAction}
              disabled={Boolean(deletingId || cancellingId)}
            >
              {deletingId || cancellingId ? 'Processando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
