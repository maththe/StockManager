import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  MapPin,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router';

import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { cn } from '~/lib/utils';
import { useEvents } from '~/services/tanStackQuery/events';
import type { Event, EventStatus } from '~/types/event';

const statusLabel: Record<EventStatus, string> = {
  PLANNING: 'Planejamento',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

const statusClassName: Record<EventStatus, string> = {
  PLANNING:
    'bg-secondary/10 text-secondary ring-1 ring-secondary/30 dark:bg-secondary/20',
  IN_PROGRESS:
    'bg-primary/10 text-primary ring-1 ring-primary/30 dark:bg-primary/20',
  COMPLETED:
    'bg-accent/10 text-accent ring-1 ring-accent/30 dark:bg-accent/20',
  CANCELLED:
    'bg-destructive/10 text-destructive ring-1 ring-destructive/30 dark:bg-destructive/20',
};

const statusDotClassName: Record<EventStatus, string> = {
  PLANNING: 'bg-secondary',
  IN_PROGRESS: 'bg-primary',
  COMPLETED: 'bg-accent',
  CANCELLED: 'bg-destructive',
};

const statusPillClassName: Record<EventStatus, string> = {
  PLANNING: 'bg-secondary/15 text-secondary',
  IN_PROGRESS: 'bg-primary/15 text-primary',
  COMPLETED: 'bg-accent/15 text-accent',
  CANCELLED: 'bg-destructive/10 text-destructive/70 line-through',
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
  const eventEnd = event.endDate
    ? startOfDay(new Date(event.endDate)).getTime()
    : eventStart;

  return eventStart <= currentDay && eventEnd >= currentDay;
};

export function CalendarView() {
  const navigate = useNavigate();
  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: events = [], isLoading } = useEvents();

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
            startOfDay(new Date(event.endDate ?? event.startDate)).getTime() >=
              today.getTime(),
        )
        .sort(
          (firstEvent, secondEvent) =>
            new Date(firstEvent.startDate).getTime() -
            new Date(secondEvent.startDate).getTime(),
        )
        .slice(0, 5),
    [events, today],
  );

  const goToToday = () => {
    setCurrentMonth(startOfMonth(today));
    setSelectedDate(today);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-border/50 bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-border/40 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarRange className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-bold">
                Agenda Mensal
              </CardTitle>
            </div>
            <CardDescription className="mt-2 text-sm text-muted-foreground">
              Clique em um dia para ver os eventos programados.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map(
              (status) => (
                <div
                  key={status}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${statusDotClassName[status]}`}
                  />
                  {statusLabel[status]}
                </div>
              ),
            )}
          </div>
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
                      Calendário
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
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => setSelectedDate(startOfDay(day))}
                        className={cn(
                          'group relative min-h-24 rounded-xl border p-2 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30',
                          isCurrentMonth
                            ? 'border-border/60 bg-card/80'
                            : 'border-border/30 bg-muted/30 text-muted-foreground/70',
                          isWeekend && !isSelected && 'bg-muted/20',
                          isSelected &&
                            'border-primary/60 bg-primary/10 shadow-sm ring-1 ring-primary/30',
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                              isToday
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : isSelected
                                  ? 'text-primary'
                                  : '',
                            )}
                          >
                            {day.getDate()}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] font-bold text-primary">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                'flex items-center gap-1 rounded-md px-2 py-1 text-[0.68rem] font-medium',
                                statusPillClassName[event.status],
                              )}
                            >
                              <span className="truncate">{event.eventName}</span>
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
                        Selecione outro dia para visualizar os eventos.
                      </div>
                    ) : (
                      selectedDayEvents.map((event) => {
                        const isLocked =
                          event.status === 'CANCELLED' ||
                          event.status === 'COMPLETED';
                        return (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() =>
                            navigate(`/dashboard/events/${event.id}`)
                          }
                          className={`w-full rounded-xl border border-border/50 bg-card/70 p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                            isLocked ? 'opacity-75' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-foreground">
                                {event.eventName}
                              </div>
                              <div className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <UserRound className="h-3 w-3 flex-shrink-0" />
                                {event.client?.companyName ??
                                  'Cliente não associado'}
                              </div>
                            </div>
                            <span
                              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${statusClassName[event.status]}`}
                            >
                              {statusLabel[event.status]}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">
                              {formatDate(event.startDate)}
                              {event.endDate && ` → ${formatDate(event.endDate)}`}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">
                              {event.eventLocation}
                            </span>
                          </div>
                        </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/50 bg-background/60 p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                    <CalendarDays className="h-5 w-5 text-primary" />
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
                          className="flex w-full items-start gap-3 rounded-xl border border-border/50 bg-card/70 p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-primary/15 to-secondary/15 px-2.5 py-1.5 text-center text-primary ring-1 ring-primary/20">
                            <div className="text-[0.65rem] font-semibold uppercase">
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
                              {event.endDate && ` → ${formatDate(event.endDate)}`}
                            </div>
                            <div className="mt-1.5 inline-flex">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[0.6rem] font-semibold ${statusClassName[event.status]}`}
                              >
                                {statusLabel[event.status]}
                              </span>
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
    </div>
  );
}
