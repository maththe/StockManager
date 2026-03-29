import { Check, Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { ItemThumbnail } from './ItemThumbnail';
import { type SelectedEventItem, getPlannedQuantityError, getPlannedQuantityBounds } from '../utils/utils';

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

  return (
    <article className="rounded-3xl border border-border/70 bg-background/92 p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-muted">
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
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-2xl border border-border/70 bg-muted/30 p-1">
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
                className="h-9 w-16 border-0 bg-transparent px-2 text-center text-sm font-semibold shadow-none focus-visible:ring-0"
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
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
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
