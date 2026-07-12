import { AlertTriangle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { QuantityControl } from '~/components/Form/QuantityInput';
import { Button } from '~/components/ui/button';
import { ItemThumbnail } from '~/routes/events/components/ItemThumbnail';
import {
  type SelectedRentalItem,
  getRentalQuantityBounds,
  getRentalQuantityError,
} from '../utils/rental-helpers';

interface RentalSelectedItemCardProps {
  rentalItem: SelectedRentalItem;
  categoryName: string;
  draftValue: string;
  isSaving: boolean;
  isRemoving: boolean;
  isBusy: boolean;
  onDraftChange: (rentalItemId: string, value: string) => void;
  onStepQuantity: (rentalItem: SelectedRentalItem, direction: -1 | 1) => void;
  onSaveQuantity: (rentalItem: SelectedRentalItem) => void;
  onRemoveItem: (rentalItemId: string) => void;
}

export function RentalSelectedItemCard(props: RentalSelectedItemCardProps) {
  const error = getRentalQuantityError(props.rentalItem, props.draftValue);
  const isDirty = Number(props.draftValue) !== props.rentalItem.quantity;
  const { minimum, maximum } = getRentalQuantityBounds(props.rentalItem);

  const draftNumber = Number(props.draftValue);
  const isFixedQuantity = minimum === maximum;
  const atMinimum = !isFixedQuantity && draftNumber <= minimum;
  const atMaximum = !isFixedQuantity && draftNumber >= maximum;

  return (
    <article className="group rounded-3xl border border-border/70 bg-background/92 p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="aspect-square w-full max-w-28 shrink-0 self-start overflow-hidden rounded-2xl border border-border/60 bg-muted">
          <ItemThumbnail
            item={props.rentalItem.inventoryItem ?? props.rentalItem.item}
            categoryName={props.categoryName}
          />
        </div>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {props.rentalItem.item.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Estoque livre agora:{' '}
                <span className="font-semibold tabular-nums text-foreground">
                  {props.rentalItem.item.availableQuantity}
                </span>
                {props.rentalItem.returnedQuantity > 0 && (
                  <>
                    {' • '}Devolvido:{' '}
                    <span className="font-semibold tabular-nums text-foreground">
                      {props.rentalItem.returnedQuantity}
                    </span>
                  </>
                )}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => props.onRemoveItem(props.rentalItem.id)}
              disabled={props.isRemoving || props.isBusy}
              aria-label={`Remover ${props.rentalItem.item.name}`}
            >
              {props.isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>

          <QuantityControl
            eventItem={props.rentalItem}
            draftValue={props.draftValue}
            minimum={minimum}
            maximum={maximum}
            isDirty={isDirty}
            error={error}
            isSaving={props.isSaving}
            isBusy={props.isBusy}
            onStepQuantity={props.onStepQuantity}
            onDraftChange={props.onDraftChange}
            onSaveQuantity={props.onSaveQuantity}
          />

          {/* Status + limites */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {error ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 font-medium text-destructive">
                <AlertTriangle className="h-3 w-3" />
                {error}
              </span>
            ) : isDirty ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Alteração pendente
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 font-medium text-accent">
                <CheckCircle2 className="h-3 w-3" />
                Quantidade confirmada
              </span>
            )}

            {isFixedQuantity ? (
              <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                Quantidade fixa: {minimum}
              </span>
            ) : (
              <>
                {atMinimum && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                    Mínimo: {minimum}
                  </span>
                )}
                {atMaximum && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                    Máximo: {maximum}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
