import { useMemo, useState } from 'react';
import {
  Ban,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Edit2,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  UserRound,
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
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { useClients } from '~/services/tanStackQuery/clients';
import {
  useCancelEvent,
  useCompleteEvent,
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  useUpdateEvent,
} from '~/services/tanStackQuery/events';
import { useUsers } from '~/services/tanStackQuery/users';
import type {
  CreateEventInput,
  Event,
  EventStatus,
  UpdateEventInput,
} from '~/types/event';

import { EventCompleteDialog } from './EventCompleteDialog';
import { EventFormDialog } from './EventFormDialog';
import {
  eventStatusClassName,
  eventStatusLabel,
  formatEventDate,
} from '../utils/utils';

const statusFilters: { value: EventStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PLANNING', label: 'Planejamento' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluídos' },
  { value: 'CANCELLED', label: 'Cancelados' },
];

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export function EventsList() {
  const navigate = useNavigate();
  const today = startOfDay(new Date());
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: 'cancel' | 'complete' | 'delete';
    event: Event;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL');

  const { data: events = [], isLoading } = useEvents();
  const { data: clients = [] } = useClients();
  const { data: users = [] } = useUsers();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const cancelEvent = useCancelEvent();
  const completeEvent = useCompleteEvent();

  const currentPeriod = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    return {
      label: new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric',
      }).format(today),
      start: new Date(year, month, 1).getTime(),
      end: new Date(year, month + 1, 0, 23, 59, 59, 999).getTime(),
    };
  }, [today]);

  const periodEvents = useMemo(
    () =>
      events.filter((event) => {
        const eventStart = new Date(event.startDate).getTime();
        const eventEnd = new Date(event.endDate).getTime();
        return eventStart <= currentPeriod.end && eventEnd >= currentPeriod.start;
      }),
    [events, currentPeriod],
  );

  const stats = useMemo(
    () => ({
      total: periodEvents.length,
      active: periodEvents.filter((event) => event.status === 'IN_PROGRESS')
        .length,
      planning: periodEvents.filter((event) => event.status === 'PLANNING')
        .length,
      completed: periodEvents.filter((event) => event.status === 'COMPLETED')
        .length,
    }),
    [periodEvents],
  );

  const filteredEvents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return periodEvents.filter((event) => {
      const matchesStatus =
        statusFilter === 'ALL' || event.status === statusFilter;
      if (!matchesStatus) return false;
      if (!search) return true;
      const haystack = [
        event.eventName,
        event.eventLocation,
        event.client?.companyName ?? '',
        event.responsible?.name ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [periodEvents, searchTerm, statusFilter]);

  const handleOpenDialog = (event?: Event) => {
    setEditingEvent(event ?? null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingEvent(null);
    setDialogOpen(false);
  };

  const handleSubmit = async (data: CreateEventInput | UpdateEventInput) => {
    if (editingEvent) {
      await updateEvent.mutateAsync({ id: editingEvent.id, data });
    } else {
      await createEvent.mutateAsync(data as CreateEventInput);
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

  const handleComplete = async (id: string) => {
    try {
      setCompletingId(id);
      await completeEvent.mutateAsync(id);
    } finally {
      setCompletingId(null);
    }
  };

  const handleConfirmPendingAction = async () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'delete') {
      await handleDelete(pendingAction.event.id);
    } else if (pendingAction.type === 'complete') {
      await handleComplete(pendingAction.event.id);
    } else {
      await handleCancel(pendingAction.event.id);
    }

    setPendingAction(null);
  };

  const renderEventActions = (event: Event) => {
    if (event.status === 'CANCELLED') {
      return (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border/30 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-destructive/30 text-destructive transition-colors hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              setPendingAction({ type: 'delete', event });
            }}
            disabled={deletingId === event.id || Boolean(pendingAction)}
            aria-label={`Excluir ${event.eventName}`}
          >
            {deletingId === event.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      );
    }

    return (
      <div className="mt-4 flex flex-wrap gap-2 border-t border-border/30 pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-emerald-200/50 text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900/50 dark:hover:bg-emerald-950"
          onClick={(e) => {
            e.stopPropagation();
            setPendingAction({ type: 'complete', event });
          }}
          disabled={
            event.status === 'COMPLETED' ||
            completingId === event.id ||
            Boolean(pendingAction)
          }
          aria-label={`Concluir ${event.eventName}`}
        >
          {completingId === event.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
        </Button>
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
            event.status === 'COMPLETED' ||
            cancellingId === event.id ||
            Boolean(pendingAction)
          }
          aria-label={`Cancelar ${event.eventName}`}
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
          aria-label={`Editar ${event.eventName}`}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderEventCard = (event: Event) => {
    const isLocked =
      event.status === 'CANCELLED' || event.status === 'COMPLETED';
    const openEvent = () => {
      if (isLocked) return;
      navigate(`/dashboard/events/${event.id}/items`);
    };

    return (
    <div
      key={event.id}
      role="button"
      tabIndex={isLocked ? -1 : 0}
      aria-disabled={isLocked}
      onClick={openEvent}
      onKeyDown={(e) => {
        if (isLocked) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openEvent();
        }
      }}
      className={`group rounded-xl border border-border/50 bg-card/50 p-5 text-left shadow-sm backdrop-blur-sm transition-all duration-200 focus:outline-none ${
        isLocked
          ? 'cursor-not-allowed opacity-70'
          : 'cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/70 hover:shadow-lg focus:ring-2 focus:ring-primary/30'
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div
            className={`line-clamp-1 text-lg font-bold text-foreground transition-colors ${
              isLocked ? '' : 'group-hover:text-primary'
            }`}
          >
            {event.eventName}
          </div>
          <div className="mt-2 line-clamp-1 text-sm text-muted-foreground">
            {event.client?.companyName ?? 'Cliente não associado'}
          </div>
        </div>
        <span
          className={`inline-flex flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${eventStatusClassName[event.status]}`}
        >
          {eventStatusLabel[event.status]}
        </span>
      </div>

      <div className="space-y-2 border-t border-border/30 pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {formatEventDate(event.startDate)} até {formatEventDate(event.endDate)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">{event.eventLocation}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserRound className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {event.responsible?.name ?? 'Sem responsável definido'}
          </span>
        </div>
      </div>

      {renderEventActions(event)}
    </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <CalendarRange className="h-4 w-4 text-primary" />
        Período:{' '}
        <span className="capitalize text-foreground">{currentPeriod.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-primary">
              Total
            </CardDescription>
            <CardTitle className="mt-2 text-3xl font-bold text-primary">
              {stats.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-secondary/30 bg-gradient-to-br from-secondary/10 to-secondary/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Em planejamento
            </CardDescription>
            <CardTitle className="mt-2 text-3xl font-bold text-secondary">
              {stats.planning}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-accent">
              Em andamento
            </CardDescription>
            <CardTitle className="mt-2 text-3xl font-bold text-accent">
              {stats.active}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60 bg-gradient-to-br from-card to-muted/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Concluídos
            </CardDescription>
            <CardTitle className="mt-2 text-3xl font-bold text-foreground">
              {stats.completed}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border border-border/50 bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Todos os eventos</CardTitle>
            <CardDescription className="mt-1">
              Gerencie, edite ou abra os itens reservados de cada evento.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/calendar')}
              className="border-border/60"
            >
              <CalendarRange className="mr-2 h-4 w-4" />
              Ver calendário
            </Button>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-primary to-secondary font-medium text-white shadow-md transition-all hover:shadow-lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Novo Evento
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome, cliente, local ou responsável..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as EventStatus | 'ALL')
              }
            >
              <SelectTrigger aria-label="Filtrar por status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                Crie o primeiro evento e vincule-o a um cliente para começar a
                operação.
              </div>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-primary to-secondary font-medium text-white shadow-md transition-all hover:shadow-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Novo Evento
              </Button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
              Nenhum evento encontrado com os filtros atuais.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredEvents.map((event) => renderEventCard(event))}
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
        users={users}
        onSubmit={handleSubmit}
        isLoading={createEvent.isPending || updateEvent.isPending}
      />

      <AlertDialog
        open={Boolean(pendingAction) && pendingAction?.type !== 'complete'}
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
                ? `Esta ação removerá permanentemente o evento "${pendingAction.event.eventName}".`
                : `Ao cancelar "${pendingAction?.event.eventName}", todos os itens reservados voltarão ao estoque.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={Boolean(deletingId || cancellingId)}
            >
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

      <EventCompleteDialog
        open={pendingAction?.type === 'complete'}
        event={pendingAction?.type === 'complete' ? pendingAction.event : null}
        isLoading={Boolean(completingId)}
        onConfirm={handleConfirmPendingAction}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
