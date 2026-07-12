import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Ban,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Edit2,
  Hash,
  Loader2,
  MapPin,
  MoreHorizontal,
  Play,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { useClients } from '~/services/tanStackQuery/clients';
import {
  useCancelRental,
  useCreateRentalGalpaoTask,
  useDeleteRental,
  useRental,
  useReturnRental,
  useUpdateRental,
} from '~/services/tanStackQuery/rentals';
import type {
  CreateRentalInput,
  UpdateRentalInput,
} from '~/types/rental';

import { RentalFormDialog } from './components/RentalFormDialog';
import { RentalItemsSection } from './components/RentalItemsSection';
import { RentalStatusStepper } from './components/RentalStatusStepper';
import {
  formatRentalDate,
  isRentalClosed,
  rentalStatusClassName,
  rentalStatusLabel,
  summarizeRentalItems,
} from './utils/rental-helpers';

type PendingAction = 'activate' | 'return' | 'cancel' | 'delete';

export default function RentalDetailsPage() {
  const { rentalId } = useParams();
  const navigate = useNavigate();

  const { data: rental, isLoading } = useRental(rentalId);
  const { data: clients = [] } = useClients();

  const updateRental = useUpdateRental();
  const cancelRental = useCancelRental();
  const returnRental = useReturnRental();
  const deleteRental = useDeleteRental();
  const createGalpaoTask = useCreateRentalGalpaoTask();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  const pending = rental ? summarizeRentalItems(rental).pending : 0;

  const confirmCopy = useMemo(() => {
    if (pendingAction === 'activate') {
      return {
        title: 'Ativar locação?',
        description:
          'Marca os itens como entregues ao cliente. Use esta opção quando os itens saírem do galpão.',
        confirmLabel: 'Ativar locação',
      };
    }
    if (pendingAction === 'return') {
      return {
        title: 'Marcar como devolvida?',
        description:
          'Todas as unidades pendentes serão consideradas devolvidas e voltarão ao estoque disponível.',
        confirmLabel: 'Confirmar devolução',
      };
    }
    if (pendingAction === 'cancel') {
      return {
        title: 'Cancelar locação?',
        description: `Os itens pendentes (${pending} ${pending === 1 ? 'unidade' : 'unidades'}) voltam ao estoque. Esta ação não pode ser desfeita.`,
        confirmLabel: 'Cancelar locação',
      };
    }
    return {
      title: 'Excluir locação?',
      description: `A locação ${rental?.rentalCode ?? ''} será removida permanentemente do histórico.`,
      confirmLabel: 'Excluir',
    };
  }, [pendingAction, pending, rental?.rentalCode]);

  const isProcessing =
    updateRental.isPending ||
    cancelRental.isPending ||
    returnRental.isPending ||
    deleteRental.isPending;

  const handleSubmitEdit = async (
    data: CreateRentalInput | UpdateRentalInput,
  ) => {
    if (!rental) return;
    await updateRental.mutateAsync({ id: rental.id, data });
    setEditDialogOpen(false);
  };

  const handleConfirmPendingAction = async () => {
    if (!rental || !pendingAction) return;

    if (pendingAction === 'activate') {
      await updateRental.mutateAsync({
        id: rental.id,
        data: { status: 'ACTIVE' },
      });
    } else if (pendingAction === 'return') {
      await returnRental.mutateAsync(rental.id);
    } else if (pendingAction === 'cancel') {
      await cancelRental.mutateAsync(rental.id);
    } else if (pendingAction === 'delete') {
      await deleteRental.mutateAsync(rental.id);
      navigate('/dashboard/rentals');
    }

    setPendingAction(null);
  };

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

  const closed = isRentalClosed(rental.status);
  const hasItems = rental.rentalItems.length > 0;
  const canActivate = rental.status === 'DRAFT' && hasItems;
  const canReturn = rental.status === 'ACTIVE';
  const canCancel = rental.status === 'DRAFT' || rental.status === 'ACTIVE';
  const canDelete =
    rental.status === 'CANCELLED' || (rental.status === 'DRAFT' && !hasItems);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-5 py-6 shadow-sm dark:from-background dark:via-card dark:to-muted/20 sm:px-7">
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link
            to="/dashboard/rentals"
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Locações
          </Link>
          <span>/</span>
          <span className="truncate font-medium text-foreground">
            {rental.rentalCode}
          </span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {rental.client.companyName}
              </h1>
              <span className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1 font-mono text-xs font-semibold text-foreground ring-1 ring-border/60">
                <Hash className="h-3 w-3 text-muted-foreground" />
                {rental.rentalCode}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${rentalStatusClassName[rental.status]}`}
              >
                {rentalStatusLabel[rental.status]}
              </span>
            </div>
            <div className="mt-3">
              <RentalStatusStepper status={rental.status} />
            </div>
          </div>

          {/* Ações — locações encerradas só permitem exclusão (se cancelada) */}
          <div className="flex flex-wrap items-center gap-2">
            {canActivate && (
              <Button
                type="button"
                size="sm"
                className="bg-gradient-to-r from-primary to-secondary font-medium text-white shadow-md transition-all hover:shadow-lg"
                onClick={() => setPendingAction('activate')}
                disabled={isProcessing || Boolean(pendingAction)}
              >
                <Play className="mr-2 h-4 w-4" />
                Ativar locação
              </Button>
            )}
            {canReturn && (
              <Button
                type="button"
                size="sm"
                className="bg-gradient-to-r from-primary to-secondary font-medium text-white shadow-md transition-all hover:shadow-lg"
                onClick={() => setPendingAction('return')}
                disabled={isProcessing || Boolean(pendingAction)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Marcar devolvida
              </Button>
            )}
            {canDelete && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setPendingAction('delete')}
                disabled={isProcessing || Boolean(pendingAction)}
              >
                {deleteRental.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Excluir
              </Button>
            )}
            {!closed && (
              <span
                title={
                  !hasItems
                    ? 'Adicione ao menos um item para gerar a tarefa de galpão.'
                    : undefined
                }
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-primary/40 text-primary transition-colors hover:bg-primary/10"
                  onClick={() => createGalpaoTask.mutate(rental.id)}
                  disabled={
                    !hasItems ||
                    createGalpaoTask.isPending ||
                    Boolean(pendingAction)
                  }
                >
                  {createGalpaoTask.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ClipboardList className="mr-2 h-4 w-4" />
                  )}
                  Gerar tarefa de galpão
                </Button>
              </span>
            )}
            {!closed && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-border/60"
                    aria-label="Mais ações"
                    disabled={isProcessing || Boolean(pendingAction)}
                  >
                    {cancelRental.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditDialogOpen(true)}>
                    <Edit2 />
                    Editar locação
                  </DropdownMenuItem>
                  {canCancel && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onSelect={() => setPendingAction('cancel')}
                      >
                        <Ban />
                        Cancelar locação
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/50 bg-card/60 p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Cliente
            </div>
            <div className="mt-1.5 truncate text-sm font-medium text-foreground">
              {rental.client.companyName}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 text-primary" />
              Retirada
            </div>
            <div className="mt-1.5 truncate text-sm font-medium text-foreground">
              {formatRentalDate(rental.startDate)}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 text-secondary" />
              Devolução {rental.returnedAt ? '(efetiva)' : '(prevista)'}
            </div>
            <div className="mt-1.5 truncate text-sm font-medium text-foreground">
              {formatRentalDate(rental.returnedAt ?? rental.expectedReturn)}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-accent" />
              Local
            </div>
            <div className="mt-1.5 truncate text-sm font-medium text-foreground">
              {rental.location || 'Não informado'}
            </div>
          </div>
        </div>

        {rental.notes && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-border/50 bg-card/60 p-3.5 text-sm shadow-sm">
            <StickyNote className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">{rental.notes}</p>
          </div>
        )}
      </div>

      {/* Itens */}
      <RentalItemsSection rental={rental} />

      <RentalFormDialog
        open={editDialogOpen}
        rental={rental}
        clients={clients}
        isLoading={updateRental.isPending}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleSubmitEdit}
      />

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCopy.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPendingAction}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processando...' : confirmCopy.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
