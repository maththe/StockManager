import type { SelectedEventItem } from '../utils/utils';
import { SelectedItemCard } from './SelectedItemCard';

interface SelectedGroupProps {
  group: { categoryName: string; items: SelectedEventItem[] };
  categoryMap: Map<string, string>;
  quantityDrafts: Record<string, string>;
  savingItemId: string | null;
  removingItemId: string | null;
  isBusy: boolean;
  onDraftChange: (eventItemId: string, value: string) => void;
  onStepQuantity: (eventItem: SelectedEventItem, direction: -1 | 1) => void;
  onSaveQuantity: (eventItem: SelectedEventItem) => void;
  onRemoveItem: (eventItemId: string) => void;
}

export function SelectedGroup(props: SelectedGroupProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-2">
        <span className="h-px flex-1 bg-border/60" />
        <div className="rounded-full border border-border/70 bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {props.group.categoryName}
        </div>
        <span className="h-px flex-1 bg-border/60" />
      </div>

      {/* GRID AQUI */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {props.group.items.map((eventItem) => (
          <SelectedItemCard
            key={eventItem.id}
            eventItem={eventItem}
            categoryName={
              (eventItem.inventoryItem
                ? props.categoryMap.get(eventItem.inventoryItem.categoryId)
                : undefined) ?? props.group.categoryName
            }
            draftValue={
              props.quantityDrafts[eventItem.id] ??
              String(eventItem.plannedQuantity)
            }
            isSaving={props.savingItemId === eventItem.id}
            isRemoving={props.removingItemId === eventItem.id}
            isBusy={props.isBusy}
            onDraftChange={props.onDraftChange}
            onStepQuantity={props.onStepQuantity}
            onSaveQuantity={props.onSaveQuantity}
            onRemoveItem={props.onRemoveItem}
          />
        ))}
      </div>
    </div>
  );
}
