import { Loader2, Package } from 'lucide-react';
import type { SelectedRentalItem } from '../utils/rental-helpers';
import { RentalSelectedItemCard } from './RentalSelectedItemCard';

interface RentalSelectedItemsSectionProps {
  groupedSelectedItems: Array<{
    categoryName: string;
    items: SelectedRentalItem[];
  }>;
  categoryMap: Map<string, string>;
  quantityDrafts: Record<string, string>;
  savingItemId: string | null;
  removingItemId: string | null;
  isBusy: boolean;
  isLoading: boolean;
  onDraftChange: (rentalItemId: string, value: string) => void;
  onStepQuantity: (rentalItem: SelectedRentalItem, direction: -1 | 1) => void;
  onSaveQuantity: (rentalItem: SelectedRentalItem) => void;
  onRemoveItem: (rentalItemId: string) => void;
}

export function RentalSelectedItemsSection({
  groupedSelectedItems,
  categoryMap,
  quantityDrafts,
  savingItemId,
  removingItemId,
  isBusy,
  isLoading,
  onDraftChange,
  onStepQuantity,
  onSaveQuantity,
  onRemoveItem,
}: RentalSelectedItemsSectionProps) {
  const totalItems = groupedSelectedItems.reduce(
    (count, group) => count + group.items.length,
    0,
  );

  const totalUnits = groupedSelectedItems.reduce(
    (count, group) =>
      count +
      group.items.reduce(
        (sum, rentalItem) => sum + (rentalItem.quantity ?? 0),
        0,
      ),
    0,
  );

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-gradient-to-b from-muted/30 via-background to-background dark:from-card/70 dark:via-background dark:to-background">
      <header className="border-b border-border/60 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex gap-2 items-center">
              <h3 className="text-lg font-semibold text-foreground">
                Itens reservados
              </h3>
              <div className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                Agrupado por categoria
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalItems}{' '}
              {totalItems === 1 ? 'item reservado' : 'itens reservados'}
              {totalUnits > 0 && (
                <>
                  {' • '}
                  <span className="font-medium text-foreground">
                    {totalUnits}
                  </span>{' '}
                  {totalUnits === 1 ? 'unidade' : 'unidades'}
                </>
              )}
            </p>
          </div>
        </div>
      </header>

      <div
        className="flex-1 overflow-y-auto px-4 py-4 sm:px-6"
        aria-live="polite"
      >
        {isLoading ? (
          <div
            className="flex h-full min-h-0 items-center justify-center py-12"
            aria-busy="true"
          >
            <Loader2 className="size-8 animate-spin text-muted-foreground/60" />
          </div>
        ) : groupedSelectedItems.length === 0 ? (
          <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-background/70 px-6 py-12 text-center sm:px-10 animate-in fade-in duration-500">
            <div className="mb-4 rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/20">
              <Package className="size-8 text-primary" />
            </div>
            <div className="text-lg font-semibold text-foreground">
              Nenhum item reservado
            </div>
            <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
              Use o catálogo para localizar o item, revisar o estoque
              disponível e definir a quantidade a reservar para a locação.
            </p>
          </div>
        ) : (
          <div className="space-y-5 animate-in fade-in duration-300">
            {groupedSelectedItems.map((group) => (
              <div key={group.categoryName} className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <span className="h-px flex-1 bg-border/60" />
                  <div className="rounded-full border border-border/70 bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {group.categoryName}
                  </div>
                  <span className="h-px flex-1 bg-border/60" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {group.items.map((rentalItem) => (
                    <RentalSelectedItemCard
                      key={rentalItem.id}
                      rentalItem={rentalItem}
                      categoryName={
                        (rentalItem.inventoryItem
                          ? categoryMap.get(rentalItem.inventoryItem.categoryId)
                          : undefined) ?? group.categoryName
                      }
                      draftValue={
                        quantityDrafts[rentalItem.id] ??
                        String(rentalItem.quantity)
                      }
                      isSaving={savingItemId === rentalItem.id}
                      isRemoving={removingItemId === rentalItem.id}
                      isBusy={isBusy}
                      onDraftChange={onDraftChange}
                      onStepQuantity={onStepQuantity}
                      onSaveQuantity={onSaveQuantity}
                      onRemoveItem={onRemoveItem}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
