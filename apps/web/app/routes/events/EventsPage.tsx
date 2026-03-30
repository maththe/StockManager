import { EventsList } from './components/EventsList';

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Eventos</h1>
        <p className="text-muted-foreground">
          Gerencie seus eventos e itens reservados
        </p>
      </div>
      <EventsList />
    </div>
  );
}
