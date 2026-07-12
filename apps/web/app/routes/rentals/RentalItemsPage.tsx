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
import { useRental } from '~/services/tanStackQuery/rentals';
import { isRentalClosed } from './utils/rental-helpers';
import { RentalItemsCatalog } from './components/RentalItemsCatalog';

export default function RentalItemsPage() {
  const { rentalId } = useParams();
  const { data: rental, isLoading } = useRental(rentalId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/rentals">
            <Button
              variant="outline"
              size="icon"
              className="border-border/50 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Locação não encontrada
          </h1>
        </div>
        <Card className="border-destructive/30 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">
              Erro ao carregar locação
            </CardTitle>
            <CardDescription>
              A locação solicitada não existe ou não está disponível.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dashboard/rentals">
              <Button variant="outline" className="border-border/50">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para locações
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isRentalClosed(rental.status)) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link to={`/dashboard/rentals/${rental.id}`}>
            <Button
              variant="outline"
              size="icon"
              className="border-border/50 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Itens bloqueados
          </h1>
        </div>
        <Card className="border-amber-300/40 bg-amber-50/70 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle>Locação encerrada</CardTitle>
            <CardDescription>
              Itens só podem ser adicionados em locações em rascunho ou ativas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to={`/dashboard/rentals/${rental.id}`}>
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
      <RentalItemsCatalog rental={rental} />
    </div>
  );
}
