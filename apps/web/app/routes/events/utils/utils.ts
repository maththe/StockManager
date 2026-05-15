import type { EventItem, EventStatus } from '~/types/event';
import type { Item } from '~/types/item';

export const eventStatusLabel: Record<EventStatus, string> = {
  PLANNING: 'Planejamento',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export const eventStatusClassName: Record<EventStatus, string> = {
  PLANNING:
    'bg-secondary/10 text-secondary ring-1 ring-secondary/30 dark:bg-secondary/20 dark:text-secondary',
  IN_PROGRESS:
    'bg-primary/10 text-primary ring-1 ring-primary/30 dark:bg-primary/20 dark:text-primary',
  COMPLETED:
    'bg-accent/10 text-accent ring-1 ring-accent/30 dark:bg-accent/20 dark:text-accent',
  CANCELLED:
    'bg-destructive/10 text-destructive ring-1 ring-destructive/30 dark:bg-destructive/20 dark:text-destructive',
};

export const formatEventDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));

export type EventCatalogItem = Item & {
  imageUrl?: string | null;
  image?: string | null;
  thumbnailImageUrl?: string | null;
  modalImageUrl?: string | null;
};

export type SelectedEventItem = EventItem & {
  inventoryItem?: EventCatalogItem;
};

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export type ItemImageVariant = 'thumbnail' | 'modal';

export function getItemImage(
  item: {
    imageUrl?: string | null;
    image?: string | null;
    thumbnailImageUrl?: string | null;
    modalImageUrl?: string | null;
  },
  variant: ItemImageVariant = 'thumbnail',
) {
  if (variant === 'modal') {
    return (
      item.modalImageUrl ??
      item.imageUrl ??
      item.image ??
      item.thumbnailImageUrl ??
      null
    );
  }

  return (
    item.thumbnailImageUrl ??
    item.imageUrl ??
    item.image ??
    item.modalImageUrl ??
    null
  );
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
