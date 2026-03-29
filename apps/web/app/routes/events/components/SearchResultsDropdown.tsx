import { ChevronRight } from 'lucide-react';
import { ItemThumbnail } from './ItemThumbnail';
import type { EventCatalogItem } from '../utils/utils';

interface SearchResultsDropdownProps {
  searchResults: EventCatalogItem[];
  categoryMap: Map<string, string>;
  openQuantityDialog: (item: EventCatalogItem) => void;
}

export function SearchResultsDropdown({
  searchResults,
  categoryMap,
  openQuantityDialog,
}: SearchResultsDropdownProps) {
  return (
    <div className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-20 overflow-hidden rounded-3xl border border-border/70 bg-background shadow-2xl">
      <div className="border-b border-border/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Resultados rapidos
      </div>
      <div className="max-h-80 overflow-y-auto p-2">
        {searchResults.map((item) => {
          const categoryName =
            categoryMap.get(item.categoryId) ?? 'Sem categoria';

          return (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-muted/60"
              onClick={() => openQuantityDialog(item)}
            >
              <div className="h-14 w-14 overflow-hidden rounded-2xl border border-border/60 bg-muted">
                <ItemThumbnail item={item} categoryName={categoryName} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">
                  {item.name}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {categoryName} | Estoque disponivel: {item.availableQuantity}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
