import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  useCreateEventItem,
  useDeleteEventItem,
  useEventItems,
  useUpdateEventItem,
} from "~/services/tanStackQuery/events";
import { useItems } from "~/services/tanStackQuery/Itens/items";
import type { Event } from "~/types/event";

interface EventItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
}

export function EventItemsDialog({ open, onOpenChange, event }: EventItemsDialogProps) {
  const { data: eventItems = [], isLoading } = useEventItems(event?.id);
  const { data: items = [] } = useItems();

  const createEventItem = useCreateEventItem();
  const updateEventItem = useUpdateEventItem();
  const deleteEventItem = useDeleteEventItem();

  const [selectedItemId, setSelectedItemId] = useState("");
  const [plannedQuantity, setPlannedQuantity] = useState<number>(1);

  const availableItems = useMemo(() => {
    const usedIds = new Set(eventItems.map((eventItem) => eventItem.itemId));
    return items.filter((item) => !usedIds.has(item.id));
  }, [eventItems, items]);

  const handleAdd = async () => {
    if (!event?.id || !selectedItemId || plannedQuantity <= 0) {
      return;
    }

    await createEventItem.mutateAsync({
      eventId: event.id,
      data: {
        itemId: selectedItemId,
        plannedQuantity,
      },
    });

    setSelectedItemId("");
    setPlannedQuantity(1);
  };

  const handleUpdateQuantity = async (eventItemId: string, value: number) => {
    if (!event?.id || value <= 0) {
      return;
    }

    await updateEventItem.mutateAsync({
      eventId: event.id,
      eventItemId,
      data: {
        plannedQuantity: value,
      },
    });
  };

  const handleRemove = async (eventItemId: string) => {
    if (!event?.id) {
      return;
    }

    await deleteEventItem.mutateAsync({
      eventId: event.id,
      eventItemId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-2xl bg-white/90 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>Itens do evento</DialogTitle>
          <DialogDescription>
            {event ? `Gerencie os itens de \"${event.eventName}\".` : "Selecione um evento."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_140px_auto]">
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="h-10 rounded-md border bg-white px-3 text-sm"
          >
            <option value="">Selecione um item</option>
            {availableItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.availableQuantity} disponíveis)
              </option>
            ))}
          </select>

          <input
            type="number"
            min={1}
            value={plannedQuantity}
            onChange={(e) => setPlannedQuantity(Number(e.target.value))}
            className="h-10 rounded-md border px-3 text-sm"
            placeholder="Quantidade"
          />

          <Button onClick={handleAdd} disabled={!selectedItemId || createEventItem.isPending || !event?.id}>
            {createEventItem.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Adicionar
          </Button>
        </div>

        <div className="max-h-80 space-y-3 overflow-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : eventItems.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum item adicionado a este evento.
            </div>
          ) : (
            eventItems.map((eventItem) => (
              <div key={eventItem.id} className="grid items-center gap-3 rounded-xl border p-3 md:grid-cols-[1fr_140px_auto]">
                <div>
                  <div className="font-medium">{eventItem.item.name}</div>
                  <div className="text-xs text-muted-foreground">SKU: {eventItem.item.skuCode}</div>
                </div>

                <input
                  type="number"
                  min={1}
                  defaultValue={eventItem.plannedQuantity}
                  className="h-10 rounded-md border px-3 text-sm"
                  onBlur={(e) => handleUpdateQuantity(eventItem.id, Number(e.target.value))}
                />

                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleRemove(eventItem.id)}
                  disabled={deleteEventItem.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
