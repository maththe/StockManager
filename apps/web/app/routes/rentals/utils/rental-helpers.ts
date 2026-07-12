import type { Rental, RentalItem, RentalStatus } from '~/types/rental';
import type { Item } from '~/types/item';

export const rentalStatusLabel: Record<RentalStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Em locação',
  RETURNED: 'Devolvida',
  CANCELLED: 'Cancelada',
};

export const rentalStatusDescription: Record<RentalStatus, string> = {
  DRAFT: 'Reserva sendo montada. Itens já estão separados no estoque.',
  ACTIVE: 'Itens entregues ao cliente. Aguardando devolução.',
  RETURNED: 'Locação finalizada. Itens retornaram ao estoque.',
  CANCELLED: 'Locação cancelada. Itens devolvidos ao estoque.',
};

export const rentalStatusClassName: Record<RentalStatus, string> = {
  DRAFT: 'bg-secondary/10 text-secondary ring-1 ring-secondary/30',
  ACTIVE: 'bg-primary/10 text-primary ring-1 ring-primary/30',
  RETURNED: 'bg-accent/10 text-accent ring-1 ring-accent/30',
  CANCELLED: 'bg-destructive/10 text-destructive ring-1 ring-destructive/30',
};

export const rentalLifecycleOrder: RentalStatus[] = [
  'DRAFT',
  'ACTIVE',
  'RETURNED',
];

export const isRentalClosed = (status: RentalStatus) =>
  status === 'RETURNED' || status === 'CANCELLED';

export const toDateTimeLocal = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

export const toIsoString = (value: string) => new Date(value).toISOString();

export const formatRentalDate = (value?: string | null) => {
  if (!value) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

export type SelectedRentalItem = RentalItem & {
  inventoryItem?: Item;
};

export function getRentalQuantityBounds(rentalItem: RentalItem) {
  const minimum = Math.max(1, rentalItem.returnedQuantity);
  const maximum = rentalItem.item.availableQuantity + rentalItem.quantity;
  return { minimum, maximum };
}

export function getRentalQuantityError(rentalItem: RentalItem, value: string) {
  const nextValue = Number(value);
  const { minimum, maximum } = getRentalQuantityBounds(rentalItem);
  if (!Number.isFinite(nextValue) || !Number.isInteger(nextValue))
    return 'Informe um número inteiro.';
  if (nextValue < minimum)
    return `A quantidade mínima para este item é ${minimum}.`;
  if (nextValue > maximum)
    return `Estoque insuficiente. O máximo permitido é ${maximum}.`;
  return null;
}

export function groupRentalItemsByCategory(
  rentalItems: RentalItem[],
  itemMap: Map<string, Item>,
  categoryMap: Map<string, string>,
) {
  const groups = new Map<string, SelectedRentalItem[]>();

  for (const rentalItem of rentalItems) {
    const inventoryItem = itemMap.get(rentalItem.itemId);
    const categoryName = inventoryItem
      ? (categoryMap.get(inventoryItem.categoryId) ?? 'Sem categoria')
      : 'Sem categoria';

    const entry: SelectedRentalItem = { ...rentalItem, inventoryItem };
    const current = groups.get(categoryName) ?? [];
    current.push(entry);
    groups.set(categoryName, current);
  }

  return Array.from(groups.entries())
    .map(([categoryName, categoryItems]) => ({
      categoryName,
      items: categoryItems.sort((left, right) =>
        left.item.name.localeCompare(right.item.name),
      ),
    }))
    .sort((left, right) => left.categoryName.localeCompare(right.categoryName));
}

export const summarizeRentalItems = (rental: Rental) => {
  const totalUnits = rental.rentalItems.reduce(
    (total, current) => total + current.quantity,
    0,
  );
  const returnedUnits = rental.rentalItems.reduce(
    (total, current) => total + current.returnedQuantity,
    0,
  );
  return { totalUnits, returnedUnits, pending: totalUnits - returnedUnits };
};
