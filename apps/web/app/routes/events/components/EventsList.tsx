import { useMemo, useState } from 'react';
import {
  Ban,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit2,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
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
import { cn } from '~/lib/utils';
import { useClients } from '~/services/tanStackQuery/clients';
import {
  useCancelEvent,
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  useUpdateEvent,
} from '~/services/tanStackQuery/events';
import type {
  CreateEventInput,
  Event,
  EventStatus,
  UpdateEventInput,
} from '~/types/event';

import { EventFormDialog } from './EventFormDialog';

const statusLabel: Record<EventStatus, string> = {
  PLANNING: 'Planejamento',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

const statusClassName: Record<EventStatus, string> = {
  PLANNING:
    'bg-secondary/10 text-secondary ring-1 ring-secondary/30 dark:bg-secondary/20 dark:text-secondary',
  IN_PROGRESS:
    'bg-primary/10 text-primary ring-1 ring-primary/30 dark:bg-primary/20 dark:text-primary',
  COMPLETED:
    'bg-accent/10 text-accent ring-1 ring-accent/30 dark:bg-accent/20 dark:text-accent',
  CANCELLED:
    'bg-destructive/10 text-destructive ring-1 ring-destructive/30 dark:bg-destructive/20 dark:text-destructive',
};

const statusDotClassName: Record<EventStatus, string> = {
  PLANNING: 'bg-secondary',
  IN_PROGRESS: 'bg-primary',
  COMPLETED: 'bg-accent',
  CANCELLED: 'bg-destructive',
};

const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));

const formatDayLabel = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);

const formatMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

const isSameDay = (firstDate: Date, secondDate: Date) =>
  startOfDay(firstDate).getTime() === startOfDay(secondDate).getTime();

const getCalendarDays = (month: Date) => {
  const firstDayOfMonth = startOfMonth(month);
  const firstCalendarDay = addDays(firstDayOfMonth, -firstDayOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) =>
    addDays(firstCalendarDay, index),
  );
};

const eventOverlapsDay = (event: Event, day: Date) => {
  const currentDay = startOfDay(day).getTime();
  const eventStart = startOfDay(new Date(event.startDate)).getTime();
  const eventEnd = startOfDay(new Date(event.endDate)).getTime();

  return eventStart <= currentDay && eventEnd >= currentDay;
};

const eventOverlapsMonth = (event: Event, month: Date) => {
  const monthStart = startOfMonth(month).getTime();
  const monthEnd = endOfMonth(month).getTime();
  const eventStart = startOfDay(new Date(event.startDate)).getTime();
  const eventEnd = startOfDay(new Date(event.endDate)).getTime();

  return eventStart <= monthEnd && eventEnd >= monthStart;
};

export function EventsList() {
  const navigate = useNavigate();
  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(today);
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

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth],
  );

  const selectedDayEvents = useMemo(
    () =>
      events
        .filter((event) => eventOverlapsDay(event, selectedDate))
        .sort(
          (firstEvent, secondEvent) =>
            new Date(firstEvent.startDate).getTime() -
            new Date(secondEvent.startDate).getTime(),
        ),
    [events, selectedDate],
  );

  const upcomingEvents = useMemo(
    () =>
      events
        .filter(
          (event) =>
            event.status !== 'CANCELLED' &&
            startOfDay(new Date(event.endDate)).getTime() >= today.getTime(),
        )
        .sort(
          (firstEvent, secondEvent) =>
            new Date(firstEvent.startDate).getTime() -
            new Date(secondEvent.startDate).getTime(),
        )
        .slice(0, 4),
    [events, today],
  );

  const stats = useMemo(
    () => ({
      total: events.length,
      active: events.filter((event) => event.status === 'IN_PROGRESS').length,
      planning: events.filter((event) => event.status === 'PLANNING').length,
      month: events.filter((event) => eventOverlapsMonth(event, currentMonth))
        .length,
    }),
    [currentMonth, events],
  );

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

  const handleConfirmPendingAction = async () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'delete') {
      await handleDelete(pendingAction.event.id);
    } else {
      await handleCancel(pendingAction.event.id);
    }

    setPendingAction(null);
  };

  const goToToday = () => {
    setCurrentMonth(startOfMonth(today));
    setSelectedDate(today);
  };

  const renderEventActions = (event: Event) => (
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

  const renderEventCard = (event: Event) => (
    <div
      key={event.id}
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/dashboard/events/${event.id}/items`)}
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
            {event.client?.companyName ?? 'Cliente não associado'}
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
            {formatDate(event.startDate)} até {formatDate(event.endDate)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">{event.eventLocation}</span>
        </div>
      </div>

      {renderEventActions(event)}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <Card className="border-primary/20 bg-gradient-to-br from-card to-muted/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Neste mês
            </CardDescription>
            <CardTitle className="mt-2 text-4xl font-bold text-foreground">
              {stats.month}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="overflow-hidden border border-border/50 bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-bold">
                Agenda de Eventos
              </CardTitle>
            </div>
            <CardDescription className="mt-2 text-sm text-muted-foreground">
              Visualize os eventos por mês, selecione um dia e gerencie os itens
              reservados.
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
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-2xl border border-border/50 bg-background/50 p-3 shadow-sm sm:p-5">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Calendário mensal
                    </div>
                    <h2 className="mt-1 text-2xl font-bold capitalize text-foreground">
                      {formatMonthLabel(currentMonth)}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentMonth(addMonths(currentMonth, -1))
                      }
                      aria-label="Mês anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" onClick={goToToday}>
                      Hoje
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentMonth(addMonths(currentMonth, 1))
                      }
                      aria-label="Próximo mês"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {weekdayLabels.map((weekday) => (
                    <div key={weekday} className="py-2">
                      {weekday}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => {
                    const dayEvents = events.filter((event) =>
                      eventOverlapsDay(event, day),
                    );
                    const isCurrentMonth =
                      day.getMonth() === currentMonth.getMonth();
                    const isToday = isSameDay(day, today);
                    const isSelected = isSameDay(day, selectedDate);

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => setSelectedDate(startOfDay(day))}
                        className={cn(
                          'min-h-24 rounded-xl border p-2 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30',
                          isCurrentMonth
                            ? 'border-border/60 bg-card/80'
                            : 'border-border/30 bg-muted/30 text-muted-foreground/70',
                          isSelected &&
                            'border-primary/60 bg-primary/10 shadow-sm ring-1 ring-primary/20',
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                              isToday && 'bg-primary text-primary-foreground',
                            )}
                          >
                            {day.getDate()}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className="flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 text-[0.68rem] font-medium text-foreground shadow-sm"
                            >
                              <span
                                className={`h-2 w-2 flex-shrink-0 rounded-full ${statusDotClassName[event.status]}`}
                              />
                              <span className="truncate">
                                {event.eventName}
                              </span>
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="px-2 text-[0.68rem] font-medium text-muted-foreground">
                              +{dayEvents.length - 2} evento(s)
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-border/50 bg-background/60 p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold capitalize text-foreground">
                      {formatDayLabel(selectedDate)}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedDayEvents.length === 0
                      ? 'Nenhum evento programado para este dia.'
                      : `${selectedDayEvents.length} evento(s) neste dia.`}
                  </p>

                  <div className="mt-4 space-y-3">
                    {selectedDayEvents.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/60 p-5 text-center text-sm text-muted-foreground">
                        Selecione outro dia ou crie um novo evento para ocupar a
                        agenda.
                      </div>
                    ) : (
                      selectedDayEvents.map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() =>
                            navigate(`/dashboard/events/${event.id}/items`)
                          }
                          className="w-full rounded-xl border border-border/50 bg-card/70 p-3 text-left transition hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-foreground">
                                {event.eventName}
                              </div>
                              <div className="mt-1 truncate text-xs text-muted-foreground">
                                {event.client?.companyName ??
                                  'Cliente não associado'}
                              </div>
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${statusClassName[event.status]}`}
                            >
                              {statusLabel[event.status]}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">
                              {event.eventLocation}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/50 bg-background/60 p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground">
                    Próximos eventos
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Atalhos para os compromissos mais próximos.
                  </p>

                  <div className="mt-4 space-y-3">
                    {upcomingEvents.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/60 p-5 text-center text-sm text-muted-foreground">
                        Nenhum próximo evento ativo encontrado.
                      </div>
                    ) : (
                      upcomingEvents.map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => {
                            setCurrentMonth(
                              startOfMonth(new Date(event.startDate)),
                            );
                            setSelectedDate(
                              startOfDay(new Date(event.startDate)),
                            );
                          }}
                          className="flex w-full items-start gap-3 rounded-xl border border-border/50 bg-card/70 p-3 text-left transition hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <div className="rounded-lg bg-primary/10 px-2 py-1 text-center text-primary">
                            <div className="text-xs font-semibold uppercase">
                              {new Intl.DateTimeFormat('pt-BR', {
                                month: 'short',
                              }).format(new Date(event.startDate))}
                            </div>
                            <div className="text-lg font-bold leading-none">
                              {new Date(event.startDate).getDate()}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-semibold text-foreground">
                              {event.eventName}
                            </div>
                            <div className="mt-1 truncate text-xs text-muted-foreground">
                              {formatDate(event.startDate)}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border/50 bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Todos os eventos</CardTitle>
          <CardDescription>
            Lista completa para editar, cancelar, excluir ou abrir os itens
            reservados.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {events.map((event) => renderEventCard(event))}
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
                ? `Esta ação removerá permanentemente o evento "${pendingAction.event.eventName}".`
                : `Ao cancelar "${pendingAction?.event.eventName}", todos os itens reservados voltarão ao estoque.`}
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
