import { Loader2, Plus } from 'lucide-react';

import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { ItemThumbnail } from './ItemThumbnail';
import type { EventCatalogItem } from '../utils/utils';

interface EventItemsQuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeItem: EventCatalogItem | null;
  activeQuantity: string;
  onActiveQuantityChange: (value: string) => void;
  categoryMap: Map<string, string>;
  canConfirmAdd: boolean;
  isCreating: boolean;
  onConfirmAdd: () => void;
}

export function EventItemsQuantityDialog(
  props: EventItemsQuantityDialogProps,
) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden border border-border/60 bg-background p-0">
        <div className="grid gap-0 sm:grid-cols-[0.92fr_1.08fr]">
          <div className="min-h-72 bg-muted">
            {props.activeItem && (
              <ItemThumbnail
                item={props.activeItem}
                categoryName={
                  props.categoryMap.get(props.activeItem.categoryId) ??
                  'Sem categoria'
                }
              />
            )}
          </div>
          <div className="p-6">
            <DialogHeader className="gap-3">
              <DialogTitle className="text-xl">
                Quantidade desejada?
              </DialogTitle>
              <DialogDescription className="leading-6">
                Confirme quantas unidades deste item devem ser reservadas para o
                evento antes de adicionar na lista.
              </DialogDescription>
            </DialogHeader>
            {props.activeItem && (
              <div className="mt-6 space-y-5">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {props.activeItem.name}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {props.categoryMap.get(props.activeItem.categoryId) ??
                      'Sem categoria'}
                  </div>
                </div>
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Estoque disponivel
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-foreground">
                    {props.activeItem.availableQuantity}
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="event-item-quantity"
                    className="text-sm font-medium text-foreground"
                  >
                    Quantidade
                  </label>
                  <Input
                    id="event-item-quantity"
                    type="number"
                    min={1}
                    max={props.activeItem.availableQuantity}
                    value={props.activeQuantity}
                    onChange={(currentEvent) =>
                      props.onActiveQuantityChange(currentEvent.target.value)
                    }
                    className="h-12 rounded-2xl text-center text-lg font-semibold"
                  />
                  <div className="text-xs text-muted-foreground">
                    Informe um numero inteiro entre 1 e{' '}
                    {props.activeItem.availableQuantity}.
                  </div>
                </div>
              </div>
            )}
          </div>
          <p className="px-6 pb-2 text-xs leading-relaxed text-muted-foreground sm:col-span-2">
            Selecione um item disponivel do seu estoque, informe a quantidade
            necessaria e adicione ao evento.
          </p>
        </div>
        <DialogFooter className="border-t border-border/60 bg-background px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => props.onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
            onClick={props.onConfirmAdd}
            disabled={!props.canConfirmAdd || props.isCreating}
          >
            {props.isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
