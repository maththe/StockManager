import { ArrowLeft, Building2, CalendarDays, MapPin, UserRound } from 'lucide-react';
import { Link } from 'react-router';
import type { Event } from '~/types/event';
import {
  eventStatusClassName,
  eventStatusLabel,
  formatEventDate,
} from '../utils/utils';

interface EventItemsHeaderProps {
  event: Event | null;
}

export function EventItemsHeader({ event }: EventItemsHeaderProps) {
  return (
    <header className="border-b border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-4 py-5 dark:from-background dark:via-card dark:to-muted/20 sm:px-6">
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          to="/dashboard/events"
          className="flex items-center gap-1 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Eventos
        </Link>
        <span>/</span>
        <span className="truncate font-medium text-foreground">
          {event?.eventName ?? '...'}
        </span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {event?.eventName ?? 'Carregando...'}
            </h1>
            {event?.status && (
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${eventStatusClassName[event.status]}`}
              >
                {eventStatusLabel[event.status]}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            {event?.client?.companyName && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 flex-shrink-0 text-primary/60" />
                {event.client.companyName}
              </span>
            )}
            {event?.eventLocation && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0 text-primary/60" />
                {event.eventLocation}
              </span>
            )}
            {event?.startDate && event?.endDate && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 flex-shrink-0 text-primary/60" />
                {formatEventDate(event.startDate)} – {formatEventDate(event.endDate)}
              </span>
            )}
            {event?.responsible?.name && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserRound className="h-4 w-4 flex-shrink-0 text-primary/60" />
                {event.responsible.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
