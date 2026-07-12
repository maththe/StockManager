import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  MapPin,
  Play,
  Plus,
  Search,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router';

import { StatCard } from '~/components/StatCard';
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
import { useCreateEvent, useEvents } from '~/services/tanStackQuery/events';
import { useUsers } from '~/services/tanStackQuery/users';
import type {
  CreateEventInput,
  Event,
  EventStatus,
  UpdateEventInput,
} from '~/types/event';

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL');
  const [periodOffset, setPeriodOffset] = useState<number | 'all'>(0);

  const { data: events = [], isLoading } = useEvents(searchTerm.trim());
  const { data: clients = [] } = useClients();
  const { data: users = [] } = useUsers();
  const createEvent = useCreateEvent();

  const currentPeriod = useMemo(() => {
    if (periodOffset === 'all') return null;

    const reference = new Date(
      today.getFullYear(),
      today.getMonth() + periodOffset,
      1,
    );
    const year = reference.getFullYear();
    const month = reference.getMonth();
    return {
      label: new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric',
      }).format(reference),
      start: new Date(year, month, 1).getTime(),
      end: new Date(year, month + 1, 0, 23, 59, 59, 999).getTime(),
    };
  }, [today, periodOffset]);

  const periodEvents = useMemo(() => {
    if (!currentPeriod) {
      return [...events].sort(
        (left, right) =>
          new Date(right.startDate).getTime() -
          new Date(left.startDate).getTime(),
      );
    }

    return events.filter((event) => {
      const eventStart = new Date(event.startDate).getTime();
      const eventEnd = new Date(event.endDate ?? event.startDate).getTime();
      return eventStart <= currentPeriod.end && eventEnd >= currentPeriod.start;
    });
  }, [events, currentPeriod]);

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

  const filteredEvents = useMemo(
    () =>
      periodEvents.filter(
        (event) => statusFilter === 'ALL' || event.status === statusFilter,
      ),
    [periodEvents, statusFilter],
  );

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSubmit = async (
    data: CreateEventInput | UpdateEventInput,
  ) => {
    await createEvent.mutateAsync(data as CreateEventInput);
    handleCloseDialog();
  };

  const renderEventCard = (event: Event) => {
    const isLocked =
      event.status === 'CANCELLED' || event.status === 'COMPLETED';
    const openEvent = () => {
      navigate(`/dashboard/events/${event.id}`);
    };

    return (
    <div
      key={event.id}
      role="button"
      tabIndex={0}
      onClick={openEvent}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openEvent();
        }
      }}
      className={`group cursor-pointer rounded-xl border border-border/50 bg-card/50 p-5 text-left shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/70 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30 ${
        isLocked ? 'opacity-75' : ''
      }`}
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
          className={`inline-flex flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${eventStatusClassName[event.status]}`}
        >
          {eventStatusLabel[event.status]}
        </span>
      </div>

      <div className="space-y-2 border-t border-border/30 pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {formatEventDate(event.startDate)}
            {event.endDate && ` até ${formatEventDate(event.endDate)}`}
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

    </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <CalendarRange className="h-4 w-4 text-primary" />
        Período:
        {currentPeriod ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                setPeriodOffset((current) =>
                  current === 'all' ? -1 : current - 1,
                )
              }
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-32 text-center capitalize text-foreground">
              {currentPeriod.label}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                setPeriodOffset((current) =>
                  current === 'all' ? 1 : current + 1,
                )
              }
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <span className="text-foreground">Todos os períodos</span>
        )}
        <div className="flex items-center gap-2">
          {periodOffset !== 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 border-border/60 text-xs"
              onClick={() => setPeriodOffset(0)}
            >
              Hoje
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 border-border/60 text-xs"
            onClick={() =>
              setPeriodOffset((current) => (current === 'all' ? 0 : 'all'))
            }
          >
            {periodOffset === 'all' ? 'Ver mês atual' : 'Todos os períodos'}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total"
          value={stats.total}
          icon={CalendarDays}
          tone="primary"
        />
        <StatCard
          label="Em planejamento"
          value={stats.planning}
          icon={ClipboardList}
          tone="secondary"
        />
        <StatCard
          label="Em andamento"
          value={stats.active}
          icon={Play}
          tone="accent"
        />
        <StatCard
          label="Concluídos"
          value={stats.completed}
          icon={CheckCircle2}
          tone="muted"
        />
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
          ) : events.length === 0 && !searchTerm.trim() ? (
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
          ) : periodEvents.length === 0 && events.length > 0 && currentPeriod ? (
            <div className="rounded-xl border border-dashed border-border/60 py-12 text-center">
              <div className="text-sm text-muted-foreground">
                Nenhum evento em{' '}
                <span className="font-semibold capitalize text-foreground">
                  {currentPeriod.label}
                </span>
                . Use as setas para navegar entre os meses ou veja todos os
                períodos.
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 border-border/60"
                onClick={() => setPeriodOffset('all')}
              >
                Ver todos os períodos
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
        event={null}
        clients={clients}
        users={users}
        onSubmit={handleSubmit}
        isLoading={createEvent.isPending}
      />
    </div>
  );
}
