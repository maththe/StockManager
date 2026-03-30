import { useEffect, useMemo, useState } from 'react';
import { Package, Search } from 'lucide-react';

import { useCategories } from '~/services/tanStackQuery/Itens/categories';
import { useItems } from '~/services/tanStackQuery/Itens/items';
import {
  useCreateEventItem,
  useDeleteEventItem,
  useEventItems,
  useUpdateEventItem,
} from '~/services/tanStackQuery/events';
import type { Event } from '~/types/event';

import { CatalogSection } from './CatalogSection';
import { EventItemsHeader } from './EventItemsHeader';
import { EventItemsQuantityDialog } from './EventItemsQuantityDialog';
import { SelectedItemsSection } from './SelectedItemsSection';
import {
  type EventCatalogItem,
  type SelectedEventItem,
  normalizeText,
  getPlannedQuantityBounds,
  getPlannedQuantityError,
} from '../utils/utils';
import { cn } from '~/lib/utils'; // Assumindo que você tem esse utilitário (clsx + twMerge)

interface EventItemsDialogProps {
  event: Event | null;
}

export function EventItemsDialog({ event }: EventItemsDialogProps) {
  const { data: eventItems = [], isLoading: isLoadingEventItems } =
    useEventItems(event?.id);
  const { data: items = [], isLoading: isLoadingItems } = useItems();
  const { data: categories = [] } = useCategories();

  const createEventItem = useCreateEventItem();
  const updateEventItem = useUpdateEventItem();
  const deleteEventItem = useDeleteEventItem();

  const [search, setSearch] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<'all' | string>(
    'all',
  );
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<EventCatalogItem | null>(null);
  const [activeQuantity, setActiveQuantity] = useState('1');
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>(
    {},
  );
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [activeScreen, setActiveScreen] = useState<'catalog' | 'selected'>(
    'catalog',
  );

  useEffect(() => {
    setSearch('');
    setActiveCategoryId('all');
    setQuantityDialogOpen(false);
    setActiveItem(null);
    setActiveQuantity('1');
    setActiveScreen('catalog');
  }, [event?.id]);

  useEffect(() => {
    setQuantityDrafts(
      Object.fromEntries(
        eventItems.map((eventItem) => [
          eventItem.id,
          String(eventItem.plannedQuantity),
        ]),
      ),
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
    if (!normalizedSearch) return true;
    const categoryName = categoryMap.get(item.categoryId) ?? 'Sem categoria';
    return [item.name, categoryName].some((value) =>
      normalizeText(value).includes(normalizedSearch),
    );
  };

  const filteredCatalogItems = useMemo(
    () =>
      catalogItems.filter(
        (item) =>
          (activeCategoryId === 'all' ||
            item.categoryId === activeCategoryId) &&
          matchesSearch(item),
      ),
    [activeCategoryId, catalogItems, normalizedSearch],
  );

  const searchResults = useMemo(
    () =>
      normalizedSearch ? catalogItems.filter(matchesSearch).slice(0, 6) : [],
    [catalogItems, normalizedSearch],
  );

  const groupedSelectedItems = useMemo(() => {
    const groups = new Map<string, SelectedEventItem[]>();

    for (const eventItem of selectedItems) {
      const inventoryItem = eventItem.inventoryItem;
      const categoryName = inventoryItem
        ? (categoryMap.get(inventoryItem.categoryId) ?? 'Sem categoria')
        : 'Sem categoria';

      const current = groups.get(categoryName) ?? [];
      current.push(eventItem);
      groups.set(categoryName, current);
    }

    return Array.from(groups.entries())
      .map(([categoryName, categoryItems]) => ({
        categoryName,
        items: categoryItems.sort((left, right) =>
          left.item.name.localeCompare(right.item.name),
        ),
      }))
      .sort((left, right) =>
        left.categoryName.localeCompare(right.categoryName),
      );
  }, [categoryMap, selectedItems]);

  const categoryFilters = useMemo(() => {
    const usedCategoryIds = new Set(
      catalogItems.map((item) => item.categoryId),
    );

    return [
      { id: 'all', label: 'Todos' },
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
    createEventItem.isPending ||
    updateEventItem.isPending ||
    deleteEventItem.isPending;

  const openQuantityDialog = (item: EventCatalogItem) => {
    setActiveItem(item);
    setActiveQuantity('1');
    setQuantityDialogOpen(true);
  };

  const handleConfirmAdd = async () => {
    if (!event?.id || !activeItem || !canConfirmAdd) return;

    await createEventItem.mutateAsync({
      eventId: event.id,
      data: { itemId: activeItem.id, plannedQuantity: activeQuantityNumber },
    });

    setQuantityDialogOpen(false);
    setActiveItem(null);
    setActiveQuantity('1');
    setSearch('');
    setActiveScreen('selected');
  };

  const handleDraftChange = (eventItemId: string, value: string) =>
    setQuantityDrafts((current) => ({ ...current, [eventItemId]: value }));

  const handleStepQuantity = (
    eventItem: SelectedEventItem,
    direction: -1 | 1,
  ) => {
    const currentValue = Number(
      quantityDrafts[eventItem.id] ?? eventItem.plannedQuantity,
    );
    const { minimum, maximum } = getPlannedQuantityBounds(eventItem);

    handleDraftChange(
      eventItem.id,
      String(Math.min(maximum, Math.max(minimum, currentValue + direction))),
    );
  };

  const handleSaveQuantity = async (eventItem: SelectedEventItem) => {
    if (!event?.id) return;

    const nextValue =
      quantityDrafts[eventItem.id] ?? String(eventItem.plannedQuantity);
    const error = getPlannedQuantityError(eventItem, nextValue);

    if (error || Number(nextValue) === eventItem.plannedQuantity) return;

    try {
      setSavingItemId(eventItem.id);
      await updateEventItem.mutateAsync({
        eventId: event.id,
        eventItemId: eventItem.id,
        data: { plannedQuantity: Number(nextValue) },
      });
    } finally {
      setSavingItemId(null);
    }
  };

  const handleRemoveItem = async (eventItemId: string) => {
    if (!event?.id) return;

    try {
      setRemovingItemId(eventItemId);
      await deleteEventItem.mutateAsync({ eventId: event.id, eventItemId });
    } finally {
      setRemovingItemId(null);
    }
  };

  const totalSelectedItems = selectedItems.length;

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden border border-border/60 bg-background">
        <EventItemsHeader event={event} />

        {/* Navigation Tabs */}
        <div className="border-b border-border/60 bg-muted/20 px-4 py-3 sm:px-6">
          <div
            role="tablist"
            aria-label="Visualização de Itens"
            className="flex flex-wrap items-center gap-2"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeScreen === 'catalog'}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                activeScreen === 'catalog'
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border/70 bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground',
              )}
              onClick={() => setActiveScreen('catalog')}
            >
              <Search className="h-4 w-4" />
              Catálogo
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold',
                  activeScreen === 'catalog' ? 'bg-background/20' : 'bg-muted',
                )}
              >
                {filteredCatalogItems.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeScreen === 'selected'}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                activeScreen === 'selected'
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border/70 bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground',
              )}
              onClick={() => setActiveScreen('selected')}
            >
              <Package className="h-4 w-4" />
              Selecionados
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold',
                  activeScreen === 'selected' ? 'bg-background/20' : 'bg-muted',
                )}
              >
                {totalSelectedItems}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex min-h-0 flex-1">
          {activeScreen === 'selected' ? (
            <SelectedItemsSection
              groupedSelectedItems={groupedSelectedItems}
              categoryMap={categoryMap}
              quantityDrafts={quantityDrafts}
              savingItemId={savingItemId}
              removingItemId={removingItemId}
              isBusy={isBusy}
              isLoading={isLoadingEventItems || isLoadingItems}
              onDraftChange={handleDraftChange}
              onStepQuantity={handleStepQuantity}
              onSaveQuantity={handleSaveQuantity}
              onRemoveItem={handleRemoveItem}
            />
          ) : (
            <CatalogSection
              search={search}
              setSearch={setSearch}
              searchResults={searchResults}
              categoryMap={categoryMap}
              categoryFilters={categoryFilters}
              activeCategoryId={activeCategoryId}
              setActiveCategoryId={setActiveCategoryId}
              filteredCatalogItems={filteredCatalogItems}
              openQuantityDialog={openQuantityDialog}
              isLoading={isLoadingItems}
              isBusy={isBusy}
            />
          )}
        </div>
      </div>

      <EventItemsQuantityDialog
        open={quantityDialogOpen}
        onOpenChange={setQuantityDialogOpen}
        activeItem={activeItem}
        activeQuantity={activeQuantity}
        onActiveQuantityChange={setActiveQuantity}
        categoryMap={categoryMap}
        canConfirmAdd={canConfirmAdd}
        isCreating={createEventItem.isPending}
        onConfirmAdd={handleConfirmAdd}
      />
    </>
  );
}
