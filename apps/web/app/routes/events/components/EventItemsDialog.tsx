import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save, Trash2, AlertCircle, CheckCircle2, Package, TrendingDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useItems } from "~/services/tanStackQuery/Itens/items";
import {
  useCreateEventItem,
  useDeleteEventItem,
  useEventItems,
  useUpdateEventItem,
} from "~/services/tanStackQuery/events";
import type { Event, EventItem } from "~/types/event";

interface EventItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
}

function toDraftMap(eventItems: EventItem[]) {
  return Object.fromEntries(eventItems.map((eventItem) => [eventItem.id, String(eventItem.plannedQuantity)]));
}

function getPlannedQuantityBounds(eventItem: EventItem) {
  const minimum = Math.max(1, eventItem.shippedQuantity, eventItem.returnedQuantity);
  const maximum = eventItem.item.availableQuantity + eventItem.plannedQuantity;
  return { minimum, maximum };
}

function getPlannedQuantityError(eventItem: EventItem, value: string) {
  const nextValue = Number(value);
  const { minimum, maximum } = getPlannedQuantityBounds(eventItem);

  if (!Number.isFinite(nextValue) || !Number.isInteger(nextValue)) {
    return "Informe um numero inteiro.";
  }

  if (nextValue < minimum) {
    if (eventItem.returnedQuantity > eventItem.shippedQuantity) {
      return `A quantidade planejada deve ser pelo menos ${minimum} para cobrir os itens retornados.`;
    }

    if (eventItem.shippedQuantity > 0) {
      return `A quantidade planejada deve ser pelo menos ${minimum} para cobrir os itens enviados.`;
    }

    return "A quantidade planejada deve ser maior que zero.";
  }

  if (nextValue > maximum) {
    return `Estoque insuficiente. O maximo permitido para este evento e ${maximum}.`;
  }

  return null;
}

export function EventItemsDialog({ open, onOpenChange, event }: EventItemsDialogProps) {
  const { data: eventItems = [], isLoading } = useEventItems(event?.id);
  const { data: items = [] } = useItems();

  const createEventItem = useCreateEventItem();
  const updateEventItem = useUpdateEventItem();
  const deleteEventItem = useDeleteEventItem();

  const [selectedItemId, setSelectedItemId] = useState("");
  const [plannedQuantity, setPlannedQuantity] = useState("1");
  const [draftQuantities, setDraftQuantities] = useState<Record<string, string>>({});
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedItemId("");
      setPlannedQuantity("1");
    }
  }, [event?.id, open]);

  useEffect(() => {
    setDraftQuantities(toDraftMap(eventItems));
  }, [eventItems]);

  const availableItems = useMemo(() => {
    const usedIds = new Set(eventItems.map((eventItem) => eventItem.itemId));
    return items.filter((item) => !usedIds.has(item.id));
  }, [eventItems, items]);

  const selectedAvailableItem = availableItems.find((item) => item.id === selectedItemId);
  const plannedQuantityValue = Number(plannedQuantity);
  const canAdd =
    Boolean(event?.id) &&
    Boolean(selectedItemId) &&
    Number.isFinite(plannedQuantityValue) &&
    plannedQuantityValue > 0 &&
    (!selectedAvailableItem || plannedQuantityValue <= selectedAvailableItem.availableQuantity);

  const handleAdd = async () => {
    if (!event?.id || !selectedItemId || !canAdd) {
      return;
    }

    await createEventItem.mutateAsync({
      eventId: event.id,
      data: {
        itemId: selectedItemId,
        plannedQuantity: plannedQuantityValue,
      },
    });

    setSelectedItemId("");
    setPlannedQuantity("1");
  };

  const handleUpdateQuantity = async (eventItem: EventItem) => {
    if (!event?.id) {
      return;
    }

    const nextDraftValue = draftQuantities[eventItem.id] ?? String(eventItem.plannedQuantity);
    const error = getPlannedQuantityError(eventItem, nextDraftValue);

    if (error) {
      setDraftQuantities((current) => ({
        ...current,
        [eventItem.id]: String(eventItem.plannedQuantity),
      }));
      return;
    }

    const nextValue = Number(nextDraftValue);

    if (nextValue === eventItem.plannedQuantity) {
      return;
    }

    try {
      setUpdatingItemId(eventItem.id);
      await updateEventItem.mutateAsync({
        eventId: event.id,
        eventItemId: eventItem.id,
        data: {
          plannedQuantity: nextValue,
        },
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemove = async (eventItemId: string) => {
    if (!event?.id) {
      return;
    }

    try {
      setDeletingItemId(eventItemId);
      await deleteEventItem.mutateAsync({
        eventId: event.id,
        eventItemId,
      });
    } finally {
      setDeletingItemId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
      >
        {/* Painel de Adição - Melhoria de Layout e Responsividade */}
        <div >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground">Adicionar Item</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Selecione um item disponível do seu estoque, informe a quantidade necessária e adicione ao evento.
            </p>
          </div>

          {/* Select Item - Melhorado */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-2" htmlFor="event-item-select">
              <Package className="h-3.5 w-3.5" />
              Selecione um Item
            </label>
            <select
              id="event-item-select"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="h-10 w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm font-medium shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 hover:border-primary/30"
            >
              <option value="">— Selecione um item</option>
              {availableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.availableQuantity}x)
                </option>
              ))}
            </select>
            {availableItems.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-accent/10 p-2.5 text-xs font-medium text-accent">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Todos os itens estão vinculados
              </div>
            )}
          </div>

          {/* Quantity Input - Melhorado */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-2" htmlFor="event-item-quantity">
              <div className="rounded-full bg-muted w-5 h-5 flex items-center justify-center text-xs font-bold">1</div>
              Quantidade
            </label>
            <input
              id="event-item-quantity"
              type="number"
              min={1}
              value={plannedQuantity}
              onChange={(e) => setPlannedQuantity(e.target.value)}
              className="h-10 w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm font-medium shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder-muted-foreground/50"
              placeholder="Ex: 10"
            />
            {selectedAvailableItem && (
              <div className={`flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg font-medium transition ${Number(plannedQuantity) <= selectedAvailableItem.availableQuantity
                ? "bg-accent/10 text-accent"
                : "bg-destructive/10 text-destructive"
                }`}>
                {Number(plannedQuantity) <= selectedAvailableItem.availableQuantity ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>
                  {Number(plannedQuantity) <= selectedAvailableItem.availableQuantity
                    ? `${selectedAvailableItem.availableQuantity} disponível`
                    : `Apenas ${selectedAvailableItem.availableQuantity} disponível`
                  }
                </span>
              </div>
            )}
          </div>

          {/* Add Button - Melhorado */}
          <div className="pt-2">
            <Button
              onClick={handleAdd}
              disabled={!canAdd || createEventItem.isPending}
              className="w-full h-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-medium shadow-md transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createEventItem.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Adicionar ao Evento
            </Button>
          </div>

          {/* Help Text */}
          {availableItems.length > 0 && (
            <div className="mt-auto pt-4 border-t border-primary/10">
              <p className="text-xs text-muted-foreground bg-primary/5 rounded-lg p-2.5 leading-relaxed">
                💡 <strong>Dica:</strong> Você pode adicionar múltiplos itens repetindo o processo.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="-mx-0 -mb-0 rounded-none border-t bg-background px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
