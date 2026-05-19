import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { useEvents } from '~/services/tanStackQuery/events';
import { EventItemsDialog } from './components/EventItemsDialog';

export default function EventReservedItemsPage() {
  const { eventId } = useParams();
  const { data: events = [], isLoading: isLoadingEvents } = useEvents();

  const event = events.find((currentEvent) => currentEvent.id === eventId);

  if (isLoadingEvents) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/events">
            <Button
              variant="outline"
              size="icon"
              className="border-border/50 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Evento não encontrado
          </h1>
        </div>
        <Card className="border-destructive/30 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">
              Erro ao carregar evento
            </CardTitle>
            <CardDescription>
              O evento solicitado não existe ou não está disponível.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dashboard/events">
              <Button variant="outline" className="border-border/50">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para eventos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (event.status !== 'PLANNING') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link to={`/dashboard/events/${event.id}`}>
            <Button variant="outline" size="icon" className="border-border/50 hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Itens bloqueados</h1>
        </div>
        <Card className="border-amber-300/40 bg-amber-50/70 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle>Evento fora do planejamento</CardTitle>
            <CardDescription>
              Itens só podem ser adicionados, editados ou removidos enquanto o evento está em planejamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to={`/dashboard/events/${event.id}`}>
              <Button variant="outline" className="border-border/50">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para detalhes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EventItemsDialog event={event} />
    </div>
  );
}
