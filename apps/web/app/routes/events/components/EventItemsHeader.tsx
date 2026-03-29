import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import type { Event } from '~/types/event';

interface EventItemsHeaderProps {
  event: Event | null;
}

export function EventItemsHeader({ event }: EventItemsHeaderProps) {
  return (
    <header className="border-b border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-4 py-5 dark:from-background dark:via-card dark:to-muted/20 sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link to="/dashboard/events">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Adicionar itens ao evento
            </h1>

            {event?.eventName && (
              <p className="mt-1 text-sm text-muted-foreground">
                Evento selecionado: <span className="font-medium text-foreground">{event.eventName}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}