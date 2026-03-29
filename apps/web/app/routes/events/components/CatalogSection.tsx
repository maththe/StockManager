import { Loader2, Search } from 'lucide-react';

import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';

import type { EventCatalogItem } from '../utils/utils';
import { CatalogCard } from './CatalogCard';
import { SearchResultsDropdown } from './SearchResultsDropdown';

interface CatalogSectionProps {
  search: string;
  setSearch: (value: string) => void;
  searchResults: EventCatalogItem[];
  categoryMap: Map<string, string>;
  categoryFilters: Array<{ id: string; label: string }>;
  activeCategoryId: 'all' | string;
  setActiveCategoryId: (value: 'all' | string) => void;
  filteredCatalogItems: EventCatalogItem[];
  openQuantityDialog: (item: EventCatalogItem) => void;
  isLoading: boolean;
  isBusy: boolean;
}

export function CatalogSection(props: CatalogSectionProps) {
  return (
    <section className="flex min-h-[420px] flex-col bg-gradient-to-b from-background via-background to-muted/30 xl:min-h-0 dark:from-background dark:via-card/40 dark:to-background">
      <div className="border-b border-border/60 px-4 py-5 sm:px-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={props.search}
              onChange={(currentEvent) =>
                props.setSearch(currentEvent.target.value)
              }
              placeholder="Busque por nome ou categoria..."
              className="h-12 rounded-2xl border-border/70 bg-background pl-11 pr-4 shadow-sm"
            />
            {props.searchResults.length > 0 && (
              <SearchResultsDropdown
                searchResults={props.searchResults}
                categoryMap={props.categoryMap}
                openQuantityDialog={props.openQuantityDialog}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {props.categoryFilters.map((category) => (
              <button
                key={category.id}
                type="button"
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition',
                  props.activeCategoryId === category.id
                    ? 'border-foreground bg-foreground text-background shadow-sm'
                    : 'border-border/70 bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                )}
                onClick={() => props.setActiveCategoryId(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 px-4 py-6 sm:px-6 xl:min-h-0 xl:overflow-y-auto">
        {props.isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center xl:h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : props.filteredCatalogItems.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-border/70 bg-muted/20 px-10 text-center xl:h-full">
            <div className="mb-4 rounded-2xl bg-background p-4 shadow-sm">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="text-lg font-semibold text-foreground">
              Nenhum item disponivel
            </div>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Ajuste a busca ou os filtros de categoria. Itens ja selecionados
              aparecem na coluna da esquerda.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {props.filteredCatalogItems.map((item) => (
              <CatalogCard
                key={item.id}
                item={item}
                categoryName={
                  props.categoryMap.get(item.categoryId) ?? 'Sem categoria'
                }
                openQuantityDialog={props.openQuantityDialog}
                isBusy={props.isBusy}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
