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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[min(88vh,920px)] max-w-[min(96vw,1280px)] flex-col gap-0 overflow-hidden rounded-2xl bg-card/95 p-0 backdrop-blur-md"
        >
          <div className="grid min-h-0 flex-1 gap-6 overflow-hidden px-6 py-5 grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)]">
            {/* Painel de Adição - Melhoria de Layout e Responsividade */}
            <div className="space-y-5 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-6 shadow-sm flex flex-col h-full">
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

            {/* Painel de Itens Vinculados - Layout Responsivo */}
            <div className="flex min-h-0 flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-base font-bold">
                    <div className="rounded-lg bg-muted p-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    Itens Vinculados
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {eventItems.length} {eventItems.length === 1 ? "item" : "itens"} adicionado{eventItems.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-white shadow-sm flex flex-col">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center flex-col gap-3 py-8">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground font-medium">Carregando itens...</span>
                  </div>
                ) : eventItems.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-8 text-center flex-col gap-2">
                    <div className="rounded-full bg-muted p-4">
                      <Package className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <div className="text-sm font-semibold text-foreground">Nenhum item adicionado</div>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Selecione um item no painel lateral e clique em "Adicionar ao Evento"
                    </p>
                  </div>
                ) : (
                  <div className="overflow-y-auto h-full">
                    <div className="divide-y">
                      {eventItems.map((eventItem) => {
                        const currentDraft = draftQuantities[eventItem.id] ?? String(eventItem.plannedQuantity);
                        const error = getPlannedQuantityError(eventItem, currentDraft);
                        const isUpdating = updatingItemId === eventItem.id;
                        const isDeleting = deletingItemId === eventItem.id;
                        const { minimum, maximum } = getPlannedQuantityBounds(eventItem);
                        const hasChanged = currentDraft !== String(eventItem.plannedQuantity);
                        const isLowStock = eventItem.item.availableQuantity < 5;

                        return (
                          <div
                            key={eventItem.id}
                            className={`p-4 transition-all ${error ? "bg-destructive/5" : "hover:bg-muted/30"}`}
                          >
                            {/* Item Header */}
                            <div className="mb-3">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-semibold text-foreground truncate text-sm">
                                    {eventItem.item.name}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-0.5">SKU: {eventItem.item.skuCode}</p>
                                </div>
                                {isLowStock && (
                                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                                    <TrendingDown className="h-3 w-3" />
                                    Baixo
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Item Info Grid */}
                            <div className="grid grid-cols-2 gap-2.5 mb-3">
                              <div className="rounded-lg bg-primary/10 p-3">
                                <div className="text-xs font-medium text-primary mb-1">Estoque</div>
                                <div className={`text-lg font-bold ${isLowStock ? "text-destructive" : "text-primary"}`}>
                                  {eventItem.item.availableQuantity}
                                </div>
                              </div>
                              <div className="rounded-lg bg-muted p-3">
                                <div className="text-xs font-medium text-muted-foreground mb-1">Máximo</div>
                                <div className="text-lg font-bold text-foreground">{maximum}</div>
                              </div>
                            </div>

                            {/* Quantity Input and Actions */}
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-foreground" htmlFor={`quantity-${eventItem.id}`}>
                                Quantidade Planejada
                              </label>
                              <div className="flex gap-2">
                                <input
                                  id={`quantity-${eventItem.id}`}
                                  type="number"
                                  min={minimum}
                                  max={maximum}
                                  value={currentDraft}
                                  onChange={(e) =>
                                    setDraftQuantities((current) => ({
                                      ...current,
                                      [eventItem.id]: e.target.value,
                                    }))
                                  }
                                  disabled={isUpdating || isDeleting}
                                  className={`flex-1 h-9 rounded-lg border px-3 text-sm font-medium transition focus:outline-none focus:ring-2 shadow-sm ${error
                                    ? "border-destructive/30 bg-destructive/5 focus:border-destructive focus:ring-destructive/30"
                                    : hasChanged
                                      ? "border-primary/30 bg-primary/5 focus:border-primary focus:ring-primary/30"
                                      : "border-border bg-white focus:border-primary focus:ring-primary/30"
                                    }`}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateQuantity(eventItem)}
                                  disabled={isUpdating || isDeleting || Boolean(error) || !hasChanged}
                                  className="h-9 px-3 transition"
                                  title="Salvar alterações"
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 transition"
                                  onClick={() => handleRemove(eventItem.id)}
                                  disabled={isUpdating || isDeleting}
                                  title="Remover item"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              {error && (
                                <div className="flex items-start gap-2 text-xs text-destructive font-medium bg-destructive/10 rounded-lg p-2.5">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                  <span>{error}</span>
                                </div>
                              )}
                              {hasChanged && !error && (
                                <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                                  Modificado - clique em salvar para confirmar
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="-mx-0 -mb-0 rounded-none border-t bg-background px-6 py-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
