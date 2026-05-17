import { useEffect, useMemo, useState } from 'react';

import { useCategories } from '~/services/tanStackQuery/Itens/categories';
import { useItems } from '~/services/tanStackQuery/Itens/items';
import {
  useCreateEventItem,
  useEventItems,
} from '~/services/tanStackQuery/events';
import type { Event } from '~/types/event';

import { CatalogSection } from './CatalogSection';
import { EventItemsHeader } from './EventItemsHeader';
import { EventItemsQuantityDialog } from './EventItemsQuantityDialog';
import { type EventCatalogItem, normalizeText } from '../utils/utils';

interface EventItemsDialogProps {
  event: Event | null;
}

export function EventItemsDialog({ event }: EventItemsDialogProps) {
  const { data: eventItems = [] } = useEventItems(event?.id);
  const { data: items = [], isLoading: isLoadingItems } = useItems();
  const { data: categories = [] } = useCategories();

  const createEventItem = useCreateEventItem();

  const [search, setSearch] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<'all' | string>(
    'all',
  );
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<EventCatalogItem | null>(null);
  const [activeQuantity, setActiveQuantity] = useState('1');

  useEffect(() => {
    setSearch('');
    setActiveCategoryId('all');
    setQuantityDialogOpen(false);
    setActiveItem(null);
    setActiveQuantity('1');
  }, [event?.id]);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const selectedIds = useMemo(
    () => new Set(eventItems.map((eventItem) => eventItem.itemId)),
    [eventItems],
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

  const isBusy = createEventItem.isPending;

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
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden border border-border/60 bg-background">
        <EventItemsHeader event={event} />

        <div className="flex min-h-0 flex-1">
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
