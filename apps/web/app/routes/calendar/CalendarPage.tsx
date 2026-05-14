import { CalendarView } from './components/CalendarView';

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Calendário</h1>
        <p className="text-muted-foreground">
          Visualize e navegue pelos eventos por dia, semana ou mês.
        </p>
      </div>
      <CalendarView />
    </div>
  );
}
