import { useEffect, useMemo, useState } from 'react';

import { useCategories } from '~/services/tanStackQuery/Itens/categories';
import { useItems } from '~/services/tanStackQuery/Itens/items';
import {
  useCreateRentalItem,
  useDeleteRentalItem,
  useUpdateRentalItem,
} from '~/services/tanStackQuery/rentals';
import type { Rental } from '~/types/rental';
import type { Item } from '~/types/item';

import { CatalogSection } from '~/routes/events/components/CatalogSection';
import { EventItemsQuantityDialog } from '~/routes/events/components/EventItemsQuantityDialog';
import { matchesSearch } from '~/lib/search';
import { RentalItemsHeader } from './RentalItemsHeader';
import { RentalSelectedItemsSection } from './RentalSelectedItemsSection';
import {
  type SelectedRentalItem,
  getRentalQuantityBounds,
  getRentalQuantityError,
  groupRentalItemsByCategory,
} from '../utils/rental-helpers';

interface RentalItemsCatalogProps {
  rental: Rental;
}

export function RentalItemsCatalog({ rental }: RentalItemsCatalogProps) {
  const { data: items = [], isLoading: isLoadingItems } = useItems();
  const { data: categories = [] } = useCategories();

  const createRentalItem = useCreateRentalItem();
  const updateRentalItem = useUpdateRentalItem();
  const deleteRentalItem = useDeleteRentalItem();

  const [search, setSearch] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<'all' | string>(
    'all',
  );
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [activeQuantity, setActiveQuantity] = useState('1');
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    setSearch('');
    setActiveCategoryId('all');
    setQuantityDialogOpen(false);
    setActiveItem(null);
    setActiveQuantity('1');
    setQuantityDrafts({});
  }, [rental.id]);

  const rentalItems = rental.rentalItems;

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const itemMap = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const groupedSelectedItems = useMemo(
    () => groupRentalItemsByCategory(rentalItems, itemMap, categoryMap),
    [rentalItems, itemMap, categoryMap],
  );

  const selectedIds = useMemo(
    () => new Set(rentalItems.map((rentalItem) => rentalItem.itemId)),
    [rentalItems],
  );

  const catalogItems = useMemo(
    () => items.filter((item) => !selectedIds.has(item.id)),
    [items, selectedIds],
  );

  const matchesItemSearch = (item: Item) =>
    matchesSearch(
      [item.name, categoryMap.get(item.categoryId) ?? 'Sem categoria'],
      search,
    );

  const filteredCatalogItems = useMemo(
    () =>
      catalogItems.filter(
        (item) =>
          (activeCategoryId === 'all' ||
            item.categoryId === activeCategoryId) &&
          matchesItemSearch(item),
      ),
    [activeCategoryId, catalogItems, search, categoryMap],
  );

  const searchResults = useMemo(
    () =>
      search.trim() ? catalogItems.filter(matchesItemSearch).slice(0, 6) : [],
    [catalogItems, search, categoryMap],
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
    Boolean(activeItem) &&
    Number.isInteger(activeQuantityNumber) &&
    activeQuantityNumber > 0 &&
    activeQuantityNumber <= activeItemAvailableQuantity;

  const isBusy =
    createRentalItem.isPending ||
    updateRentalItem.isPending ||
    deleteRentalItem.isPending;

  const savingItemId = updateRentalItem.isPending
    ? (updateRentalItem.variables?.rentalItemId ?? null)
    : null;
  const removingItemId = deleteRentalItem.isPending
    ? (deleteRentalItem.variables?.rentalItemId ?? null)
    : null;

  const openQuantityDialog = (item: Item) => {
    setActiveItem(item);
    setActiveQuantity('1');
    setQuantityDialogOpen(true);
  };

  const handleConfirmAdd = async () => {
    if (!activeItem || !canConfirmAdd) return;

    await createRentalItem.mutateAsync({
      rentalId: rental.id,
      data: { itemId: activeItem.id, quantity: activeQuantityNumber },
    });

    setQuantityDialogOpen(false);
    setActiveItem(null);
    setActiveQuantity('1');
    setSearch('');
  };

  const handleDraftChange = (rentalItemId: string, value: string) => {
    setQuantityDrafts((current) => ({ ...current, [rentalItemId]: value }));
  };

  const clearDraft = (rentalItemId: string) => {
    setQuantityDrafts((current) => {
      const { [rentalItemId]: _removed, ...rest } = current;
      return rest;
    });
  };

  const handleStepQuantity = (
    rentalItem: SelectedRentalItem,
    direction: -1 | 1,
  ) => {
    const { minimum, maximum } = getRentalQuantityBounds(rentalItem);
    const draftNumber = Number(
      quantityDrafts[rentalItem.id] ?? rentalItem.quantity,
    );
    const baseValue = Number.isFinite(draftNumber)
      ? draftNumber
      : rentalItem.quantity;
    const nextValue = Math.min(
      maximum,
      Math.max(minimum, baseValue + direction),
    );
    handleDraftChange(rentalItem.id, String(nextValue));
  };

  const handleSaveQuantity = async (rentalItem: SelectedRentalItem) => {
    const draftValue =
      quantityDrafts[rentalItem.id] ?? String(rentalItem.quantity);
    if (getRentalQuantityError(rentalItem, draftValue)) return;

    await updateRentalItem.mutateAsync({
      rentalId: rental.id,
      rentalItemId: rentalItem.id,
      data: { quantity: Number(draftValue) },
    });
    clearDraft(rentalItem.id);
  };

  const handleRemoveItem = async (rentalItemId: string) => {
    await deleteRentalItem.mutateAsync({ rentalId: rental.id, rentalItemId });
    clearDraft(rentalItemId);
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden border border-border/60 bg-background">
        <RentalItemsHeader rental={rental} />

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
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
            emptyHint="Ajuste sua busca ou os filtros de categoria. Itens já reservados ficam disponíveis na tela da locação."
          />

          <div className="flex min-h-[24rem] flex-col border-t border-border/60 lg:min-h-0 lg:w-[26rem] lg:flex-shrink-0 lg:border-l lg:border-t-0 xl:w-[30rem]">
            <RentalSelectedItemsSection
              groupedSelectedItems={groupedSelectedItems}
              categoryMap={categoryMap}
              quantityDrafts={quantityDrafts}
              savingItemId={savingItemId}
              removingItemId={removingItemId}
              isBusy={isBusy}
              isLoading={false}
              onDraftChange={handleDraftChange}
              onStepQuantity={handleStepQuantity}
              onSaveQuantity={handleSaveQuantity}
              onRemoveItem={handleRemoveItem}
            />
          </div>
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
        isCreating={createRentalItem.isPending}
        onConfirmAdd={handleConfirmAdd}
        description="Confirme quantas unidades deste item devem ser reservadas para a locação antes de adicionar na lista."
      />
    </>
  );
}
