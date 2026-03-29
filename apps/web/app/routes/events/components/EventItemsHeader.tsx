import { ArrowLeft, Boxes } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '~/components/ui/button';
import type { Event } from '~/types/event';

interface EventItemsHeaderProps {
  event: Event | null;
}

export function EventItemsHeader({ event }: EventItemsHeaderProps) {
  return (
    <div className="border-b border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-4 py-5 sm:px-6 dark:from-background dark:via-card dark:to-muted/20">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Boxes className="h-3.5 w-3.5" />
            Curadoria visual do estoque
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Adicionar itens ao evento
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {event && (
            <div className="rounded-2xl border border-border/60 bg-background/85 px-4 py-3 shadow-sm">
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Evento
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {event.eventName}
              </div>
            </div>
          )}
          <Link to="/dashboard/events">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
