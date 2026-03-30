import type { EventItem } from '~/types/event';
import type { Item } from '~/types/item';

export type EventCatalogItem = Item & {
  imageUrl?: string | null;
  image?: string | null;
};

export type SelectedEventItem = EventItem & {
  inventoryItem?: EventCatalogItem;
};

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function getItemImage(item: {
  imageUrl?: string | null;
  image?: string | null;
}) {
  return item.imageUrl ?? item.image ?? null;
}

export function getItemInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function getPlannedQuantityBounds(eventItem: EventItem) {
  const minimum = Math.max(
    1,
    eventItem.shippedQuantity,
    eventItem.returnedQuantity,
  );
  const maximum = eventItem.item.availableQuantity + eventItem.plannedQuantity;
  return { minimum, maximum };
}

export function getPlannedQuantityError(eventItem: EventItem, value: string) {
  const nextValue = Number(value);
  const { minimum, maximum } = getPlannedQuantityBounds(eventItem);
  if (!Number.isFinite(nextValue) || !Number.isInteger(nextValue))
    return 'Informe um numero inteiro.';
  if (nextValue < minimum)
    return `A quantidade minima para este item e ${minimum}.`;
  if (nextValue > maximum)
    return `Estoque insuficiente. O maximo permitido e ${maximum}.`;
  return null;
}
