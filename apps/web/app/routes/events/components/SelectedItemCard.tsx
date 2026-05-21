import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PackageX,
  Trash2,
} from 'lucide-react';
import { QuantityControl } from '~/components/Form/QuantityInput';
import { Button } from '~/components/ui/button';
import { ItemThumbnail } from './ItemThumbnail';
import {
  type SelectedEventItem,
  getPlannedQuantityError,
  getPlannedQuantityBounds,
} from '../utils/utils';

interface SelectedItemCardProps {
  eventItem: SelectedEventItem;
  categoryName: string;
  draftValue: string;
  isSaving: boolean;
  isRemoving: boolean;
  isBusy: boolean;
  onDraftChange: (eventItemId: string, value: string) => void;
  onStepQuantity: (eventItem: SelectedEventItem, direction: -1 | 1) => void;
  onSaveQuantity: (eventItem: SelectedEventItem) => void;
  onRemoveItem: (eventItemId: string) => void;
}

export function SelectedItemCard(props: SelectedItemCardProps) {
  const error = getPlannedQuantityError(props.eventItem, props.draftValue);
  const isDirty = Number(props.draftValue) !== props.eventItem.plannedQuantity;
  const { minimum, maximum } = getPlannedQuantityBounds(props.eventItem);

  const missingQuantity =
    props.eventItem.divergences
      ?.filter((divergence) => divergence.type === 'MISSING')
      .reduce((total, divergence) => total + divergence.quantity, 0) ?? 0;
  const damagedQuantity =
    props.eventItem.divergences
      ?.filter((divergence) => divergence.type === 'DAMAGED')
      .reduce((total, divergence) => total + divergence.quantity, 0) ?? 0;
  const divergenceNotes = props.eventItem.divergences?.find(
    (divergence) => divergence.notes,
  )?.notes;
  const hasDivergences = missingQuantity > 0 || damagedQuantity > 0;

  const draftNumber = Number(props.draftValue);
  const isFixedQuantity = minimum === maximum;
  const atMinimum = !isFixedQuantity && draftNumber <= minimum;
  const atMaximum = !isFixedQuantity && draftNumber >= maximum;

  return (
    <article className="group rounded-3xl border border-border/70 bg-background/92 p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="aspect-square w-full max-w-28 shrink-0 self-start overflow-hidden rounded-2xl border border-border/60 bg-muted">
          <ItemThumbnail
            item={props.eventItem.inventoryItem ?? props.eventItem.item}
            categoryName={props.categoryName}
          />
        </div>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {props.eventItem.item.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Estoque livre agora:{' '}
                <span className="font-semibold tabular-nums text-foreground">
                  {props.eventItem.item.availableQuantity}
                </span>
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => props.onRemoveItem(props.eventItem.id)}
              disabled={props.isRemoving || props.isBusy}
              aria-label={`Remover ${props.eventItem.item.name}`}
            >
              {props.isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>

          <QuantityControl
            eventItem={props.eventItem}
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

          {/* Divergências */}
          {hasDivergences && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-destructive/20 bg-destructive/5">
              <div className="flex items-center gap-2 border-b border-destructive/10 px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                <span className="text-xs font-semibold text-destructive">
                  Divergências registradas
                </span>
              </div>
              <div className="flex flex-col gap-2 p-3">
                <div className="flex flex-wrap gap-2">
                  {missingQuantity > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                      <PackageX className="h-3.5 w-3.5" />
                      Faltantes
                      <span className="tabular-nums">{missingQuantity}</span>
                    </span>
                  )}
                  {damagedQuantity > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Avariados
                      <span className="tabular-nums">{damagedQuantity}</span>
                    </span>
                  )}
                </div>
                {divergenceNotes && (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {divergenceNotes}
                  </p>
                )}
              </div>
            </div>
          )}

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