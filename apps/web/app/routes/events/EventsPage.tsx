import { EventsList } from "./components/EventsList";

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-cyan-100/60 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950/40">
      <div className="container mx-auto py-10 px-4 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Painel de Eventos</h1>
        <p className="text-muted-foreground">
          Organize cronogramas, clientes e status das locações.
        </p>
      </div>
      <div className="container mx-auto py-2 px-4">
        <EventsList />
      </div>
    </div>
  );
}
