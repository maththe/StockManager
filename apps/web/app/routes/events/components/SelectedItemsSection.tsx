import { Loader2, Package } from 'lucide-react';
import { SelectedGroup } from './SelectedGroup';
import type { SelectedEventItem } from '../utils/utils';

interface SelectedItemsSectionProps {
  groupedSelectedItems: Array<{
    categoryName: string;
    items: SelectedEventItem[];
  }>;
  categoryMap: Map<string, string>;
  quantityDrafts: Record<string, string>;
  savingItemId: string | null;
  removingItemId: string | null;
  isBusy: boolean;
  isLoading: boolean;
  onDraftChange: (eventItemId: string, value: string) => void;
  onStepQuantity: (eventItem: SelectedEventItem, direction: -1 | 1) => void;
  onSaveQuantity: (eventItem: SelectedEventItem) => void;
  onRemoveItem: (eventItemId: string) => void;
}

export function SelectedItemsSection({
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
}: SelectedItemsSectionProps) {
  const totalItems = groupedSelectedItems.reduce(
    (count, group) => count + group.items.length,
    0,
  );

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-gradient-to-b from-muted/30 via-background to-background dark:from-card/70 dark:via-background dark:to-background">
      <header className="border-b border-border/60 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex gap-2 items-center">
              <h3 className="text-lg font-semibold text-foreground">
                Itens Selecionados
              </h3>
              <div className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                Agrupado por categoria
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalItems}{' '}
              {totalItems === 1 ? 'item reservado' : 'itens reservados'}
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
              Nenhum item selecionado
            </div>
            <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
              Use o catálogo ao lado para localizar o item pela imagem, revisar
              o estoque e definir a quantidade antes de adicionar.
            </p>
          </div>
        ) : (
          <div className="space-y-5 animate-in fade-in duration-300">
            {groupedSelectedItems.map((group) => (
              <SelectedGroup
                key={group.categoryName}
                group={group}
                categoryMap={categoryMap}
                quantityDrafts={quantityDrafts}
                savingItemId={savingItemId}
                removingItemId={removingItemId}
                isBusy={isBusy}
                onDraftChange={onDraftChange}
                onStepQuantity={onStepQuantity}
                onSaveQuantity={onSaveQuantity}
                onRemoveItem={onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
