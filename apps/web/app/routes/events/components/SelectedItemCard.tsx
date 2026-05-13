import { Check, Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
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

  return (
    <article className="rounded-3xl border border-border/70 bg-background/92 p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="aspect-square w-full max-w-28 shrink-0 self-start overflow-hidden rounded-2xl border border-border/60 bg-muted">
          <ItemThumbnail
            item={props.eventItem.inventoryItem ?? props.eventItem.item}
            categoryName={props.categoryName}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">
                {props.eventItem.item.name}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Estoque livre agora: {props.eventItem.item.availableQuantity}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => props.onRemoveItem(props.eventItem.id)}
              disabled={props.isRemoving || props.isBusy}
            >
              {props.isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex w-full max-w-xs items-center rounded-2xl border border-border/70 bg-muted/30 p-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => props.onStepQuantity(props.eventItem, -1)}
                disabled={Number(props.draftValue) <= minimum || props.isBusy}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                value={props.draftValue}
                onChange={(currentEvent) =>
                  props.onDraftChange(
                    props.eventItem.id,
                    currentEvent.target.value,
                  )
                }
                className="h-9 min-w-0 flex-1 border-0 bg-transparent px-2 text-center text-sm font-semibold shadow-none focus-visible:ring-0"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => props.onStepQuantity(props.eventItem, 1)}
                disabled={Number(props.draftValue) >= maximum || props.isBusy}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 sm:w-auto"
              onClick={() => props.onSaveQuantity(props.eventItem)}
              disabled={
                !isDirty || Boolean(error) || props.isSaving || props.isBusy
              }
            >
              {props.isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
          {(missingQuantity > 0 || damagedQuantity > 0) && (
            <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-xs">
              <div className="flex flex-wrap gap-2">
                {missingQuantity > 0 && (
                  <span className="rounded-full bg-destructive/10 px-2.5 py-1 font-medium text-destructive">
                    Faltantes: {missingQuantity}
                  </span>
                )}
                {damagedQuantity > 0 && (
                  <span className="rounded-full bg-destructive/10 px-2.5 py-1 font-medium text-destructive">
                    Avariados: {damagedQuantity}
                  </span>
                )}
              </div>
              {divergenceNotes && (
                <p className="mt-2 text-muted-foreground">{divergenceNotes}</p>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
              Min: {minimum}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
              Max: {maximum}
            </span>
            {error ? (
              <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-destructive">
                {error}
              </span>
            ) : isDirty ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                Alteracao pendente
              </span>
            ) : (
              <span className="rounded-full bg-accent/15 px-2.5 py-1 text-accent">
                Quantidade confirmada
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
