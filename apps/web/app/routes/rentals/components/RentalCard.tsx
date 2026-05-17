import { type FormEvent, useMemo, useState } from 'react';
import {
  Ban,
  Building2,
  CalendarClock,
  CheckCircle2,
  Edit2,
  Hash,
  Loader2,
  MapPin,
  Package,
  PackagePlus,
  Play,
  RotateCcw,
  Save,
  StickyNote,
  Trash2,
} from 'lucide-react';

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
import { QuantityField } from '~/components/Form/QuantityInput';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import {
  useCancelRental,
  useCreateRentalItem,
  useDeleteRental,
  useDeleteRentalItem,
  useReturnRental,
  useUpdateRental,
  useUpdateRentalItem,
} from '~/services/tanStackQuery/rentals';
import type { Rental, RentalItem } from '~/types/rental';

import {
  formatRentalDate,
  isRentalClosed,
  rentalStatusClassName,
  rentalStatusLabel,
  summarizeRentalItems,
} from '../utils/rental-helpers';
import { RentalStatusStepper } from './RentalStatusStepper';

interface RentalCardProps {
  rental: Rental;
  inventoryItems: Array<{
    id: string;
    name: string;
    availableQuantity: number;
  }>;
  onEdit: (rental: Rental) => void;
}

export function RentalCard({
  rental,
  inventoryItems,
  onEdit,
}: RentalCardProps) {
  const updateRental = useUpdateRental();
  const cancelRental = useCancelRental();
  const returnRental = useReturnRental();
  const deleteRental = useDeleteRental();

  const [pendingAction, setPendingAction] = useState<
    'cancel' | 'return' | 'delete' | 'activate' | null
  >(null);

  const closed = isRentalClosed(rental.status);
  const { totalUnits, returnedUnits, pending } = summarizeRentalItems(rental);
  const hasItems = rental.rentalItems.length > 0;
  const canActivate = rental.status === 'DRAFT' && hasItems;
  const canReturn = rental.status === 'ACTIVE';
  const canCancel = rental.status === 'DRAFT' || rental.status === 'ACTIVE';
  const canDelete =
    rental.status === 'CANCELLED' || (rental.status === 'DRAFT' && !hasItems);

  const handleActivate = async () => {
    await updateRental.mutateAsync({
      id: rental.id,
      data: { status: 'ACTIVE' },
    });
    setPendingAction(null);
  };

  const handleConfirm = async () => {
    if (pendingAction === 'cancel') {
      await cancelRental.mutateAsync(rental.id);
    } else if (pendingAction === 'return') {
      await returnRental.mutateAsync(rental.id);
    } else if (pendingAction === 'delete') {
      await deleteRental.mutateAsync(rental.id);
    } else if (pendingAction === 'activate') {
      await handleActivate();
      return;
    }
    setPendingAction(null);
  };

  const confirmCopy = useMemo(() => {
    if (pendingAction === 'cancel') {
      return {
        title: 'Cancelar locação?',
        description: `Os itens pendentes (${pending} ${pending === 1 ? 'unidade' : 'unidades'}) voltam ao estoque. Esta ação não pode ser desfeita.`,
        confirmLabel: 'Cancelar locação',
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
    if (pendingAction === 'activate') {
      return {
        title: 'Ativar locação?',
        description:
          'Marca os itens como entregues ao cliente. Use esta opção quando os itens saírem do galpão.',
        confirmLabel: 'Ativar locação',
      };
    }
    return {
      title: 'Excluir locação?',
      description: `A locação ${rental.rentalCode} será removida permanentemente do histórico.`,
      confirmLabel: 'Excluir',
    };
  }, [pendingAction, pending, rental.rentalCode]);

  const isProcessing =
    updateRental.isPending ||
    cancelRental.isPending ||
    returnRental.isPending ||
    deleteRental.isPending;

  return (
    <article
      className={cn(
        'rounded-2xl border border-border/60 bg-card/60 shadow-sm transition hover:border-primary/40 hover:shadow-md',
        closed && 'opacity-80',
      )}
    >
      {/* Header */}
      <header className="space-y-4 border-b border-border/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1 font-mono text-xs font-semibold text-foreground ring-1 ring-border/60">
                <Hash className="h-3 w-3 text-muted-foreground" />
                {rental.rentalCode}
              </span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-semibold',
                  rentalStatusClassName[rental.status],
                )}
              >
                {rentalStatusLabel[rental.status]}
              </span>
            </div>
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              {rental.client.companyName}
            </div>
          </div>

          <RentalStatusStepper status={rental.status} />
        </div>

        {/* Info grid */}
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="flex items-start gap-2">
            <CalendarClock className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <div className="min-w-0">
              <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Retirada
              </div>
              <div className="truncate text-foreground">
                {formatRentalDate(rental.startDate)}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CalendarClock className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary" />
            <div className="min-w-0">
              <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Devolução {rental.returnedAt ? '(efetiva)' : '(prevista)'}
              </div>
              <div className="truncate text-foreground">
                {formatRentalDate(rental.returnedAt ?? rental.expectedReturn)}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
            <div className="min-w-0">
              <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Local
              </div>
              <div className="truncate text-foreground">
                {rental.location || 'Não informado'}
              </div>
            </div>
          </div>
        </div>

        {rental.notes && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-sm">
            <StickyNote className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">{rental.notes}</p>
          </div>
        )}
      </header>

      {/* Items management */}
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">
              Itens reservados
            </h4>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-bold text-muted-foreground">
              {rental.rentalItems.length}
            </span>
          </div>
          {hasItems && (
            <div className="flex gap-2 text-xs">
              <span className="rounded-md bg-muted/60 px-2 py-1 text-muted-foreground">
                Total:{' '}
                <span className="font-semibold text-foreground">
                  {totalUnits}
                </span>
              </span>
              <span className="rounded-md bg-accent/10 px-2 py-1 text-accent">
                Devolvido:{' '}
                <span className="font-semibold">{returnedUnits}</span>
              </span>
              <span className="rounded-md bg-primary/10 px-2 py-1 text-primary">
                Pendente: <span className="font-semibold">{pending}</span>
              </span>
            </div>
          )}
        </div>

        {!closed && <RentalItemForm rental={rental} items={inventoryItems} />}

        <div className="space-y-2">
          {rental.rentalItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-center text-sm text-muted-foreground">
              {closed
                ? 'Nenhum item foi adicionado a esta locação.'
                : 'Adicione itens do estoque para começar.'}
            </div>
          ) : (
            rental.rentalItems.map((rentalItem) => (
              <RentalItemRow
                key={rentalItem.id}
                rental={rental}
                rentalItem={rentalItem}
              />
            ))
          )}
        </div>
      </div>

      {/* Actions footer */}
      <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border/40 bg-muted/20 px-5 py-3">
        {canActivate && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-primary/40 text-primary hover:bg-primary/10"
            onClick={() => setPendingAction('activate')}
            disabled={isProcessing}
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Ativar locação
          </Button>
        )}

        {canReturn && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-accent/40 text-accent hover:bg-accent/10"
            onClick={() => setPendingAction('return')}
            disabled={isProcessing}
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Marcar devolvida
          </Button>
        )}

        {!closed && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(rental)}
            disabled={isProcessing}
          >
            <Edit2 className="mr-1.5 h-3.5 w-3.5" />
            Editar
          </Button>
        )}

        {canCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-amber-300/60 text-amber-600 hover:bg-amber-50 dark:border-amber-900/50 dark:hover:bg-amber-950"
            onClick={() => setPendingAction('cancel')}
            disabled={isProcessing}
          >
            <Ban className="mr-1.5 h-3.5 w-3.5" />
            Cancelar
          </Button>
        )}

        {canDelete && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => setPendingAction('delete')}
            disabled={isProcessing}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Excluir
          </Button>
        )}
      </footer>

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
            <AlertDialogAction onClick={handleConfirm} disabled={isProcessing}>
              {isProcessing ? 'Processando...' : confirmCopy.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

interface RentalItemFormProps {
  rental: Rental;
  items: Array<{ id: string; name: string; availableQuantity: number }>;
}

function RentalItemForm({ rental, items }: RentalItemFormProps) {
  const createRentalItem = useCreateRentalItem();
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const availableItems = useMemo(() => {
    const selectedIds = new Set(
      rental.rentalItems.map((rentalItem) => rentalItem.itemId),
    );
    return items.filter(
      (item) => !selectedIds.has(item.id) && item.availableQuantity > 0,
    );
  }, [items, rental.rentalItems]);

  const selectedItem = items.find((item) => item.id === itemId);
  const maxQuantity = selectedItem?.availableQuantity ?? 1;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!itemId) return;
    await createRentalItem.mutateAsync({
      rentalId: rental.id,
      data: { itemId, quantity: Number(quantity) },
    });
    setItemId('');
    setQuantity(1);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 md:grid-cols-[1fr_120px_auto]"
    >
      <select
        className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
        value={itemId}
        onChange={(event) => {
          setItemId(event.target.value);
          setQuantity(1);
        }}
        disabled={createRentalItem.isPending}
      >
        <option value="">Selecione um item do estoque</option>
        {availableItems.length === 0 ? (
          <option disabled>Nenhum item disponível no estoque</option>
        ) : (
          availableItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} • {item.availableQuantity} disp.
            </option>
          ))
        )}
      </select>
      <QuantityField
        value={quantity}
        minimum={1}
        maximum={maxQuantity}
        size="compact"
        className="min-w-[120px]"
        onChange={(value) => setQuantity(Number(value))}
        disabled={createRentalItem.isPending || !itemId}
        placeholder="Qtd"
      />
      <Button
        type="submit"
        disabled={
          createRentalItem.isPending ||
          !itemId ||
          quantity < 1 ||
          quantity > maxQuantity
        }
      >
        {createRentalItem.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PackagePlus className="h-4 w-4" />
        )}
        Adicionar
      </Button>
    </form>
  );
}

interface RentalItemRowProps {
  rental: Rental;
  rentalItem: RentalItem;
}

function RentalItemRow({ rental, rentalItem }: RentalItemRowProps) {
  const updateRentalItem = useUpdateRentalItem();
  const deleteRentalItem = useDeleteRentalItem();
  const [quantity, setQuantity] = useState(rentalItem.quantity);
  const [returnedQuantity, setReturnedQuantity] = useState(
    rentalItem.returnedQuantity,
  );

  const closed = isRentalClosed(rental.status);
  const showReturnField = rental.status === 'ACTIVE';
  const isDirty =
    quantity !== rentalItem.quantity ||
    returnedQuantity !== rentalItem.returnedQuantity;
  const isFullyReturned =
    rentalItem.returnedQuantity === rentalItem.quantity &&
    rentalItem.quantity > 0;

  const handleSave = () => {
    if (!isDirty) return;
    updateRentalItem.mutate({
      rentalId: rental.id,
      rentalItemId: rentalItem.id,
      data: {
        quantity: Number(quantity),
        returnedQuantity: Number(returnedQuantity),
      },
    });
  };

  return (
    <div className="grid gap-3 rounded-xl border border-border/60 bg-background/70 p-3 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-foreground">
            {rentalItem.item.name}
          </p>
          {isFullyReturned && (
            <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[0.65rem] font-semibold text-accent">
              <CheckCircle2 className="h-3 w-3" />
              Devolvido
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Estoque disponível agora: {rentalItem.item.availableQuantity} •{' '}
          Pendente: {rentalItem.quantity - rentalItem.returnedQuantity}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          Qtd
          <QuantityField
            value={quantity}
            minimum={1}
            size="compact"
            className="w-28"
            onChange={(value) => setQuantity(Number(value))}
            disabled={closed}
          />
        </label>
        {showReturnField && (
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            Devolvido
            <QuantityField
              value={returnedQuantity}
              minimum={0}
              maximum={quantity}
              size="compact"
              className="w-28"
              onChange={(value) => setReturnedQuantity(Number(value))}
              disabled={closed}
            />
          </label>
        )}
        {!closed && (
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || updateRentalItem.isPending}
              aria-label="Salvar alterações do item"
            >
              {updateRentalItem.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
            {rental.status === 'ACTIVE' && !isFullyReturned && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setReturnedQuantity(rentalItem.quantity);
                  updateRentalItem.mutate({
                    rentalId: rental.id,
                    rentalItemId: rentalItem.id,
                    data: { returnedQuantity: rentalItem.quantity },
                  });
                }}
                disabled={updateRentalItem.isPending}
                aria-label="Marcar item como totalmente devolvido"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() =>
                deleteRentalItem.mutate({
                  rentalId: rental.id,
                  rentalItemId: rentalItem.id,
                })
              }
              disabled={deleteRentalItem.isPending}
              aria-label="Remover item da locação"
            >
              {deleteRentalItem.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
