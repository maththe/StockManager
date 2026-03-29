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
      <Card>
        <CardHeader>
          <CardTitle>Evento nao encontrado</CardTitle>
          <CardDescription>
            O evento solicitado nao existe ou nao esta disponivel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/dashboard/events">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para eventos
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div >
      <EventItemsDialog event={event} />
    </div>
  );
}
