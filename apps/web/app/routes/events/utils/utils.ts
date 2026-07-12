import type {
  CompleteEventItemInput,
  Event,
  EventItem,
  EventStatus,
} from '~/types/event';
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

export type EventCatalogItem = Item;

export type SelectedEventItem = EventItem & {
  inventoryItem?: EventCatalogItem;
};

export type ItemImageVariant = 'thumbnail' | 'modal';

export function getItemImage(
  item: { imageUrl?: string | null },
  _variant: ItemImageVariant = 'thumbnail',
) {
  return item.imageUrl ?? null;
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
    return 'Informe um número inteiro.';
  if (nextValue < minimum)
    return `A quantidade mínima para este item é ${minimum}.`;
  if (nextValue > maximum)
    return `Estoque insuficiente. O máximo permitido é ${maximum}.`;
  return null;
}

export function groupEventItemsByCategory(
  eventItems: EventItem[],
  itemMap: Map<string, Item>,
  categoryMap: Map<string, string>,
) {
  const groups = new Map<string, SelectedEventItem[]>();

  for (const eventItem of eventItems) {
    const inventoryItem = itemMap.get(eventItem.itemId);
    const categoryName = inventoryItem
      ? (categoryMap.get(inventoryItem.categoryId) ?? 'Sem categoria')
      : 'Sem categoria';

    const entry: SelectedEventItem = { ...eventItem, inventoryItem };
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

export const getDivergenceQuantity = (
  eventItem: EventItem,
  type: 'MISSING' | 'DAMAGED',
) =>
  eventItem.divergences
    ?.filter((divergence) => divergence.type === type)
    .reduce((total, divergence) => total + divergence.quantity, 0) ?? 0;

export const buildCompletionDrafts = (event?: Event | null) =>
  Object.fromEntries(
    (event?.eventItems ?? []).map((eventItem) => [
      eventItem.id,
      {
        eventItemId: eventItem.id,
        returnedQuantity:
          eventItem.returnedQuantity ||
          Math.max(
            0,
            eventItem.plannedQuantity -
              getDivergenceQuantity(eventItem, 'MISSING') -
              getDivergenceQuantity(eventItem, 'DAMAGED'),
          ),
        missingQuantity: getDivergenceQuantity(eventItem, 'MISSING'),
        damagedQuantity: getDivergenceQuantity(eventItem, 'DAMAGED'),
        notes:
          eventItem.divergences?.find((divergence) => divergence.notes)
            ?.notes ?? '',
      },
    ]),
  ) as Record<string, CompleteEventItemInput>;
