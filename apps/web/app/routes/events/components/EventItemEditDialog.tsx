import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

import { QuantityField } from '~/components/Form/QuantityInput';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';

import { ItemThumbnail } from './ItemThumbnail';
import {
  getPlannedQuantityBounds,
  getPlannedQuantityError,
  type SelectedEventItem,
} from '../utils/utils';

interface EventItemEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventItem: SelectedEventItem | null;
  categoryName: string;
  isSaving: boolean;
  onSave: (eventItemId: string, plannedQuantity: number) => Promise<void>;
}

export function EventItemEditDialog({
  open,
  onOpenChange,
  eventItem,
  categoryName,
  isSaving,
  onSave,
}: EventItemEditDialogProps) {
  const [draft, setDraft] = useState('1');

  useEffect(() => {
    if (eventItem) setDraft(String(eventItem.plannedQuantity));
  }, [eventItem]);

  if (!eventItem) return null;

  const { minimum, maximum } = getPlannedQuantityBounds(eventItem);
  const error = getPlannedQuantityError(eventItem, draft);
  const draftNumber = Number(draft);
  const isDirty = draftNumber !== eventItem.plannedQuantity;
  const canSave = !error && isDirty && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    await onSave(eventItem.id, draftNumber);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden border border-border/60 bg-background p-0">
        <div className="flex items-center gap-4 border-b border-border/60 bg-muted/30 p-5">
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-border/40 bg-background">
            <ItemThumbnail
              item={eventItem.inventoryItem ?? eventItem.item}
              categoryName={categoryName}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {categoryName}
            </div>
            <div className="mt-1 truncate text-lg font-bold text-foreground">
              {eventItem.item.name}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Reservado atualmente:{' '}
              <span className="font-semibold text-foreground">
                {eventItem.plannedQuantity}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Alterar quantidade</DialogTitle>
            <DialogDescription>
              Ajuste a quantidade reservada deste item para o evento.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label
              htmlFor="event-item-edit-quantity"
              className="text-sm font-medium text-foreground"
            >
              Nova quantidade
            </label>
            <QuantityField
              id="event-item-edit-quantity"
              value={draft}
              minimum={minimum}
              maximum={maximum}
              disabled={isSaving}
              className="mt-2"
              onChange={setDraft}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                Mínimo: {minimum}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                Máximo: {maximum}
              </span>
              {error && (
                <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-destructive">
                  {error}
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 bg-background px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
            onClick={handleSave}
            disabled={!canSave}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
