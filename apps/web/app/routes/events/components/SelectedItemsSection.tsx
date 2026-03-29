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

export function SelectedItemsSection(props: SelectedItemsSectionProps) {
  const totalItems = props.groupedSelectedItems.reduce(
    (count, group) => count + group.items.length,
    0,
  );

  return (
    <section className="flex min-h-[420px] flex-col border-b border-border/60 bg-gradient-to-b from-muted/30 via-background to-background xl:min-h-0 xl:border-r xl:border-b-0 dark:from-card/70 dark:via-background dark:to-background">
      <div className="border-b border-border/60 px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Itens Selecionados
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalItems}{' '}
              {totalItems === 1 ? 'item reservado' : 'itens reservados'}
            </p>
          </div>
          <div className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            Agrupado por categoria
          </div>
        </div>
      </div>
      <div className="flex-1 px-4 py-4 xl:min-h-0 xl:overflow-y-auto">
        {props.isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center xl:h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : props.groupedSelectedItems.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-background/70 px-8 text-center xl:h-full">
            <div className="mb-4 rounded-2xl bg-primary/10 p-4">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div className="text-lg font-semibold text-foreground">
              Nenhum item selecionado
            </div>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Use o catalogo ao lado para localizar o item pela imagem, revisar
              o estoque e definir a quantidade antes de adicionar.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {props.groupedSelectedItems.map((group) => (
              <SelectedGroup
                key={group.categoryName}
                group={group}
                categoryMap={props.categoryMap}
                quantityDrafts={props.quantityDrafts}
                savingItemId={props.savingItemId}
                removingItemId={props.removingItemId}
                isBusy={props.isBusy}
                onDraftChange={props.onDraftChange}
                onStepQuantity={props.onStepQuantity}
                onSaveQuantity={props.onSaveQuantity}
                onRemoveItem={props.onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
