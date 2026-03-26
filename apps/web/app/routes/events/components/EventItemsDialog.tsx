import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Check,
  ChevronRight,
  ImageOff,
  Loader2,
  Minus,
  Package,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { useCategories } from "~/services/tanStackQuery/Itens/categories";
import { useItems } from "~/services/tanStackQuery/Itens/items";
import {
  useCreateEventItem,
  useDeleteEventItem,
  useEventItems,
  useUpdateEventItem,
} from "~/services/tanStackQuery/events";
import type { Event, EventItem } from "~/types/event";
import type { Item } from "~/types/item";

interface EventItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
}

type EventCatalogItem = Item & {
  imageUrl?: string | null;
  image?: string | null;
};

type SelectedEventItem = EventItem & {
  inventoryItem?: EventCatalogItem;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getItemImage(item: { imageUrl?: string | null; image?: string | null }) {
  return item.imageUrl ?? item.image ?? null;
}

function getItemInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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
    return `A quantidade minima para este item e ${minimum}.`;
  }

  if (nextValue > maximum) {
    return `Estoque insuficiente. O maximo permitido e ${maximum}.`;
  }

  return null;
}

function ItemThumbnail({
  item,
  categoryName,
  className,
}: {
  item: { name: string; imageUrl?: string | null; image?: string | null };
  categoryName: string;
  className?: string;
}) {
  const image = getItemImage(item);

  if (image) {
    return (
      <img
        src={image}
        alt={item.name}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/15 via-background to-secondary/20 text-center",
        className,
      )}
    >
      <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-background/80 text-sm font-semibold shadow-sm">
        {getItemInitials(item.name)}
      </div>
      <div className="px-3 text-xs font-medium text-foreground">{item.name}</div>
      <div className="mt-1 flex items-center gap-1 px-3 text-[11px] text-muted-foreground">
        <ImageOff className="h-3 w-3" />
        {categoryName}
      </div>
    </div>
  );
}

export function EventItemsDialog({ open, onOpenChange, event }: EventItemsDialogProps) {
  const { data: eventItems = [], isLoading: isLoadingEventItems } = useEventItems(event?.id);
  const { data: items = [], isLoading: isLoadingItems } = useItems();
  const { data: categories = [] } = useCategories();
  const createEventItem = useCreateEventItem();
  const updateEventItem = useUpdateEventItem();
  const deleteEventItem = useDeleteEventItem();

  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<"all" | string>("all");
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<EventCatalogItem | null>(null);
  const [activeQuantity, setActiveQuantity] = useState("1");
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({});
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setActiveCategoryId("all");
      setQuantityDialogOpen(false);
      setActiveItem(null);
      setActiveQuantity("1");
    }
  }, [open]);

  useEffect(() => {
    setQuantityDrafts(
      Object.fromEntries(eventItems.map((eventItem) => [eventItem.id, String(eventItem.plannedQuantity)])),
    );
  }, [eventItems]);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const itemMap = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const selectedItems = useMemo<SelectedEventItem[]>(
    () =>
      eventItems.map((eventItem) => ({
        ...eventItem,
        inventoryItem: itemMap.get(eventItem.itemId),
      })),
    [eventItems, itemMap],
  );

  const selectedIds = useMemo(
    () => new Set(selectedItems.map((eventItem) => eventItem.itemId)),
    [selectedItems],
  );

  const catalogItems = useMemo(
    () => items.filter((item) => !selectedIds.has(item.id)),
    [items, selectedIds],
  );

  const normalizedSearch = normalizeText(search);

  const matchesSearch = (item: EventCatalogItem) => {
    if (!normalizedSearch) {
      return true;
    }

    const categoryName = categoryMap.get(item.categoryId) ?? "Sem categoria";
    return [item.name, categoryName].some((value) => normalizeText(value).includes(normalizedSearch));
  };

  const filteredCatalogItems = useMemo(
    () =>
      catalogItems.filter((item) => {
        const matchesCategory = activeCategoryId === "all" || item.categoryId === activeCategoryId;
        return matchesCategory && matchesSearch(item);
      }),
    [activeCategoryId, catalogItems, normalizedSearch],
  );

  const searchResults = useMemo(
    () => (normalizedSearch ? catalogItems.filter(matchesSearch).slice(0, 6) : []),
    [catalogItems, normalizedSearch],
  );

  const groupedSelectedItems = useMemo(() => {
    const groups = new Map<string, SelectedEventItem[]>();

    for (const eventItem of selectedItems) {
      const inventoryItem = eventItem.inventoryItem;
      const categoryName = inventoryItem
        ? categoryMap.get(inventoryItem.categoryId) ?? "Sem categoria"
        : "Sem categoria";

      const current = groups.get(categoryName) ?? [];
      current.push(eventItem);
      groups.set(categoryName, current);
    }

    return Array.from(groups.entries())
      .map(([categoryName, categoryItems]) => ({
        categoryName,
        items: categoryItems.sort((left, right) => left.item.name.localeCompare(right.item.name)),
      }))
      .sort((left, right) => left.categoryName.localeCompare(right.categoryName));
  }, [categoryMap, selectedItems]);

  const categoryFilters = useMemo(() => {
    const usedCategoryIds = new Set(catalogItems.map((item) => item.categoryId));
    return [
      { id: "all", label: "Todos" },
      ...categories
        .filter((category) => usedCategoryIds.has(category.id))
        .map((category) => ({ id: category.id, label: category.name })),
    ];
  }, [catalogItems, categories]);

  const activeItemAvailableQuantity = activeItem?.availableQuantity ?? 0;
  const activeQuantityNumber = Number(activeQuantity);
  const canConfirmAdd =
    Boolean(event?.id) &&
    Boolean(activeItem) &&
    Number.isInteger(activeQuantityNumber) &&
    activeQuantityNumber > 0 &&
    activeQuantityNumber <= activeItemAvailableQuantity;

  const isBusy =
    createEventItem.isPending || updateEventItem.isPending || deleteEventItem.isPending;

  const openQuantityDialog = (item: EventCatalogItem) => {
    setActiveItem(item);
    setActiveQuantity("1");
    setQuantityDialogOpen(true);
  };

  const handleConfirmAdd = async () => {
    if (!event?.id || !activeItem || !canConfirmAdd) {
      return;
    }

    await createEventItem.mutateAsync({
      eventId: event.id,
      data: {
        itemId: activeItem.id,
        plannedQuantity: activeQuantityNumber,
      },
    });

    setQuantityDialogOpen(false);
    setActiveItem(null);
    setActiveQuantity("1");
    setSearch("");
  };

  const handleDraftChange = (eventItemId: string, value: string) => {
    setQuantityDrafts((current) => ({
      ...current,
      [eventItemId]: value,
    }));
  };

  const handleStepQuantity = (eventItem: SelectedEventItem, direction: -1 | 1) => {
    const currentValue = Number(quantityDrafts[eventItem.id] ?? eventItem.plannedQuantity);
    const { minimum, maximum } = getPlannedQuantityBounds(eventItem);
    const nextValue = Math.min(maximum, Math.max(minimum, currentValue + direction));

    handleDraftChange(eventItem.id, String(nextValue));
  };

  const handleSaveQuantity = async (eventItem: SelectedEventItem) => {
    if (!event?.id) {
      return;
    }

    const nextValue = quantityDrafts[eventItem.id] ?? String(eventItem.plannedQuantity);
    const error = getPlannedQuantityError(eventItem, nextValue);

    if (error || Number(nextValue) === eventItem.plannedQuantity) {
      return;
    }

    try {
      setSavingItemId(eventItem.id);
      await updateEventItem.mutateAsync({
        eventId: event.id,
        eventItemId: eventItem.id,
        data: {
          plannedQuantity: Number(nextValue),
        },
      });
    } finally {
      setSavingItemId(null);
    }
  };

  const handleRemoveItem = async (eventItemId: string) => {
    if (!event?.id) {
      return;
    }

    try {
      setRemovingItemId(eventItemId);
      await deleteEventItem.mutateAsync({
        eventId: event.id,
        eventItemId,
      });
    } finally {
      setRemovingItemId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[92vh] max-w-[min(1380px,96vw)] gap-0 overflow-hidden border border-foreground/10 bg-background p-0"
        >
          <DialogHeader className="border-b border-border/60 bg-[radial-gradient(circle_at_top_left,_rgba(193,225,193,0.22),_transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(246,244,237,0.92))] px-6 py-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Boxes className="h-3.5 w-3.5" />
                  Curadoria visual do estoque
                </div>
                <DialogTitle className="text-2xl font-semibold tracking-tight">
                  Adicionar itens ao evento
                </DialogTitle>
                <DialogDescription className="max-w-3xl text-sm leading-6">
                  Como os itens nao possuem SKU visivel, a selecao prioriza miniaturas, agrupamento por categoria e confirmacao de quantidade antes de incluir no evento.
                </DialogDescription>
              </div>

              {event && (
                <div className="rounded-2xl border border-border/60 bg-background/85 px-4 py-3 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Evento
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{event.eventName}</div>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="grid max-h-[calc(92vh-92px)] min-h-[680px] overflow-hidden lg:grid-cols-[minmax(320px,0.37fr)_minmax(0,0.63fr)]">
            <section className="flex min-h-0 flex-col border-b border-border/60 bg-[linear-gradient(180deg,rgba(244,241,232,0.9),rgba(255,255,255,0.96))] lg:border-r lg:border-b-0">
              <div className="border-b border-border/60 px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Itens Selecionados</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedItems.length} {selectedItems.length === 1 ? "item reservado" : "itens reservados"}
                    </p>
                  </div>
                  <div className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                    Agrupado por categoria
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {isLoadingEventItems || isLoadingItems ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : groupedSelectedItems.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-background/70 px-8 text-center">
                    <div className="mb-4 rounded-2xl bg-primary/10 p-4">
                      <Package className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-lg font-semibold text-foreground">Nenhum item selecionado</div>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                      Use o catalogo ao lado para localizar o item pela imagem, revisar o estoque e definir a quantidade antes de adicionar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {groupedSelectedItems.map((group) => (
                      <div key={group.categoryName} className="space-y-3">
                        <div className="flex items-center gap-2 px-2">
                          <span className="h-px flex-1 bg-border/60" />
                          <div className="rounded-full border border-border/70 bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {group.categoryName}
                          </div>
                          <span className="h-px flex-1 bg-border/60" />
                        </div>

                        <div className="space-y-3">
                          {group.items.map((eventItem) => {
                            const inventoryItem = eventItem.inventoryItem;
                            const draftValue = quantityDrafts[eventItem.id] ?? String(eventItem.plannedQuantity);
                            const error = getPlannedQuantityError(eventItem, draftValue);
                            const isDirty = Number(draftValue) !== eventItem.plannedQuantity;
                            const isSaving = savingItemId === eventItem.id;
                            const { minimum, maximum } = getPlannedQuantityBounds(eventItem);
                            const categoryName = inventoryItem
                              ? categoryMap.get(inventoryItem.categoryId) ?? "Sem categoria"
                              : group.categoryName;

                            return (
                              <article
                                key={eventItem.id}
                                className="rounded-3xl border border-border/70 bg-background/92 p-3 shadow-sm"
                              >
                                <div className="flex gap-3">
                                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-muted">
                                    <ItemThumbnail item={inventoryItem ?? eventItem.item} categoryName={categoryName} />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <div className="text-sm font-semibold text-foreground">{eventItem.item.name}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                          Estoque livre agora: {eventItem.item.availableQuantity}
                                        </div>
                                      </div>

                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => handleRemoveItem(eventItem.id)}
                                        disabled={removingItemId === eventItem.id || isBusy}
                                      >
                                        {removingItemId === eventItem.id ? (
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
                                          onClick={() => handleStepQuantity(eventItem, -1)}
                                          disabled={Number(draftValue) <= minimum || isBusy}
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                        <Input
                                          value={draftValue}
                                          onChange={(currentEvent) =>
                                            handleDraftChange(eventItem.id, currentEvent.target.value)
                                          }
                                          className="h-9 w-16 border-0 bg-transparent px-2 text-center text-sm font-semibold shadow-none focus-visible:ring-0"
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon-sm"
                                          onClick={() => handleStepQuantity(eventItem, 1)}
                                          disabled={Number(draftValue) >= maximum || isBusy}
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </div>

                                      <Button
                                        type="button"
                                        size="sm"
                                        className="rounded-full bg-foreground text-background hover:bg-foreground/90"
                                        onClick={() => handleSaveQuantity(eventItem)}
                                        disabled={!isDirty || Boolean(error) || isSaving || isBusy}
                                      >
                                        {isSaving ? (
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
                                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
                                          Quantidade confirmada
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="flex min-h-0 flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,244,0.9))]">
              <div className="border-b border-border/60 px-6 py-5">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(currentEvent) => setSearch(currentEvent.target.value)}
                      placeholder="Busque por nome ou categoria..."
                      className="h-12 rounded-2xl border-border/70 bg-background pl-11 pr-4 shadow-sm"
                    />

                    {searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-20 overflow-hidden rounded-3xl border border-border/70 bg-background shadow-2xl">
                        <div className="border-b border-border/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Resultados rapidos
                        </div>
                        <div className="max-h-80 overflow-y-auto p-2">
                          {searchResults.map((item) => {
                            const categoryName = categoryMap.get(item.categoryId) ?? "Sem categoria";
                            return (
                              <button
                                key={item.id}
                                type="button"
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-muted/60"
                                onClick={() => openQuantityDialog(item)}
                              >
                                <div className="h-14 w-14 overflow-hidden rounded-2xl border border-border/60 bg-muted">
                                  <ItemThumbnail item={item} categoryName={categoryName} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-semibold text-foreground">{item.name}</div>
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {categoryName} � Estoque disponivel: {item.availableQuantity}
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {categoryFilters.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition",
                          activeCategoryId === category.id
                            ? "border-foreground bg-foreground text-background shadow-sm"
                            : "border-border/70 bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                        )}
                        onClick={() => setActiveCategoryId(category.id)}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                {isLoadingItems ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredCatalogItems.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center rounded-[2rem] border border-dashed border-border/70 bg-muted/20 px-10 text-center">
                    <div className="mb-4 rounded-2xl bg-background p-4 shadow-sm">
                      <Search className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div className="text-lg font-semibold text-foreground">Nenhum item disponivel</div>
                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                      Ajuste a busca ou os filtros de categoria. Itens ja selecionados aparecem na coluna da esquerda.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredCatalogItems.map((item) => {
                      const categoryName = categoryMap.get(item.categoryId) ?? "Sem categoria";

                      return (
                        <article
                          key={item.id}
                          className="group overflow-hidden rounded-[28px] border border-border/70 bg-background shadow-[0_10px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                            <ItemThumbnail item={item} categoryName={categoryName} className="transition duration-300 group-hover:scale-[1.03]" />
                            <div className="absolute left-4 top-4 rounded-full bg-background/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground shadow-sm">
                              {categoryName}
                            </div>
                          </div>

                          <div className="flex min-h-[40%] flex-col justify-between gap-4 p-4">
                            <div>
                              <h4 className="line-clamp-2 text-base font-semibold text-foreground">
                                {item.name}
                              </h4>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Estoque disponivel: <span className="font-semibold text-foreground">{item.availableQuantity}</span>
                              </p>
                            </div>

                            <Button
                              type="button"
                              className="h-10 rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-sm hover:opacity-90"
                              onClick={() => openQuantityDialog(item)}
                              disabled={item.availableQuantity <= 0 || isBusy}
                            >
                              <Plus className="h-4 w-4" />
                              Adicionar
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          <DialogFooter className="border-t border-border/60 bg-background px-6 py-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={quantityDialogOpen} onOpenChange={setQuantityDialogOpen}>
        <DialogContent className="max-w-lg overflow-hidden border border-border/60 bg-background p-0">
          <div className="grid gap-0 sm:grid-cols-[0.92fr_1.08fr]">
            <div className="min-h-72 bg-muted">
              {activeItem && (
                <ItemThumbnail
                  item={activeItem}
                  categoryName={activeItem ? categoryMap.get(activeItem.categoryId) ?? "Sem categoria" : "Sem categoria"}
                />
              )}
            </div>

            <div className="p-6">
              <DialogHeader className="gap-3">
                <DialogTitle className="text-xl">Quantidade desejada?</DialogTitle>
                <DialogDescription className="leading-6">
                  Confirme quantas unidades deste item devem ser reservadas para o evento antes de adicionar na lista.
                </DialogDescription>
              </DialogHeader>

              {activeItem && (
                <div className="mt-6 space-y-5">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{activeItem.name}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {categoryMap.get(activeItem.categoryId) ?? "Sem categoria"}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Estoque disponivel
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-foreground">
                      {activeItem.availableQuantity}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="event-item-quantity" className="text-sm font-medium text-foreground">
                      Quantidade
                    </label>
                    <Input
                      id="event-item-quantity"
                      type="number"
                      min={1}
                      max={activeItem.availableQuantity}
                      value={activeQuantity}
                      onChange={(currentEvent) => setActiveQuantity(currentEvent.target.value)}
                      className="h-12 rounded-2xl text-center text-lg font-semibold"
                    />
                    <div className="text-xs text-muted-foreground">
                      Informe um numero inteiro entre 1 e {activeItem.availableQuantity}.
                    </div>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Selecione um item disponível do seu estoque, informe a quantidade necessária e adicione ao evento.
            </p>
          </div>

          <DialogFooter className="border-t border-border/60 bg-background px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuantityDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
              onClick={handleConfirmAdd}
              disabled={!canConfirmAdd || createEventItem.isPending}
            >
              {createEventItem.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
