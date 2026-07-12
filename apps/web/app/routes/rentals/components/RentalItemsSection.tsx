import { useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Package,
  PackagePlus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router';

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  useDeleteRentalItem,
  useUpdateRentalItem,
} from '~/services/tanStackQuery/rentals';
import type { Rental, RentalItem } from '~/types/rental';

import { isRentalClosed, summarizeRentalItems } from '../utils/rental-helpers';

interface RentalItemsSectionProps {
  rental: Rental;
}

export function RentalItemsSection({ rental }: RentalItemsSectionProps) {
  const navigate = useNavigate();
  const closed = isRentalClosed(rental.status);
  const { totalUnits, returnedUnits, pending } = summarizeRentalItems(rental);
  const hasItems = rental.rentalItems.length > 0;

  return (
    <Card className="border border-border/60 bg-card/50 shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b border-border/40 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Package className="h-5 w-5 text-primary" />
            Itens reservados
          </CardTitle>
          <CardDescription className="mt-1">
            {!hasItems
              ? 'Nenhum item reservado ainda nesta locação.'
              : `${rental.rentalItems.length} ${rental.rentalItems.length === 1 ? 'item reservado' : 'itens reservados'} • ${totalUnits} ${totalUnits === 1 ? 'unidade' : 'unidades'} no total`}
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasItems && (
            <div className="flex flex-wrap gap-2 text-xs">
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
          <Button
            onClick={() => navigate(`/dashboard/rentals/${rental.id}/items`)}
            disabled={closed}
            className="bg-gradient-to-r from-primary to-secondary font-medium text-white shadow-md transition-all hover:shadow-lg disabled:opacity-60"
          >
            <PackagePlus className="mr-2 h-4 w-4" />
            Selecionar itens
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          {rental.rentalItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/40 px-6 py-12 text-center">
              <div className="mb-4 rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/20">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <div className="text-lg font-semibold text-foreground">
                Nenhum item reservado
              </div>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {closed
                  ? 'Nenhum item foi adicionado a esta locação.'
                  : 'Abra o catálogo para adicionar itens do estoque a esta locação.'}
              </p>
              {!closed && (
                <Button
                  onClick={() =>
                    navigate(`/dashboard/rentals/${rental.id}/items`)
                  }
                  className="mt-5 bg-gradient-to-r from-primary to-secondary font-medium text-white shadow-md transition-all hover:shadow-lg"
                >
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Selecionar itens
                </Button>
              )}
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
      </CardContent>
    </Card>
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
              onClick={() => setConfirmingDelete(true)}
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

      <AlertDialog
        open={confirmingDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmingDelete(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item da locação?</AlertDialogTitle>
            <AlertDialogDescription>
              {`O item "${rentalItem.item.name}" será removido desta locação e as unidades pendentes voltarão ao estoque.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRentalItem.isPending}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await deleteRentalItem.mutateAsync({
                  rentalId: rental.id,
                  rentalItemId: rentalItem.id,
                });
                setConfirmingDelete(false);
              }}
              disabled={deleteRentalItem.isPending}
            >
              {deleteRentalItem.isPending ? 'Removendo...' : 'Remover item'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
