import { CalendarRange } from 'lucide-react';
import { EventsList } from './components/EventsList';

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border/40 pb-5">
        <h1 className="text-3xl font-bold text-foreground">Eventos</h1>
        <p className="mt-1.5 max-w-xl text-muted-foreground">
          Acompanhe o ciclo completo dos seus eventos
        </p>
      </div>
      <EventsList />
    </div>
  );
}
