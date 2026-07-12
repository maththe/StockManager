import { Loader2, Search, X } from 'lucide-react';

import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';

import type { EventCatalogItem } from '../utils/utils';
import { CatalogCard } from './CatalogCard';
import { Card } from '~/components/ui/card';

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
  emptyHint?: string;
}

export function CatalogSection(props: CatalogSectionProps) {
  return (
    <Card className="flex h-full min-h-0 flex-1 flex-col bg-gradient-to-b from-background via-background to-muted/30 dark:from-background dark:via-card/40 dark:to-background">
      <div className="border-b border-border/60 px-4 py-5 sm:px-6">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={props.search}
              onChange={(e) => props.setSearch(e.target.value)}
              placeholder="Busque por nome ou categoria..."
              aria-label="Buscar itens por nome ou categoria"
              className="h-12 rounded-2xl border-border/70 bg-background pl-11 pr-10 shadow-sm transition-colors focus-visible:border-primary"
            />
            {/* Botão para limpar a busca (só aparece se houver texto) */}
            {props.search && (
              <button
                onClick={() => props.setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {props.categoryFilters.map((category) => {
              const isActive = props.activeCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={isActive}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                    isActive
                      ? 'border-foreground bg-foreground text-background shadow-sm'
                      : 'border-border/70 bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                  )}
                  onClick={() => props.setActiveCategoryId(category.id)}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {props.isLoading ? (
          <div className="flex h-full min-h-[240px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/60" />
          </div>
        ) : props.filteredCatalogItems.length === 0 ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-border/70 bg-muted/20 px-6 text-center animate-in fade-in duration-500">
            <div className="mb-4 rounded-2xl bg-background p-4 shadow-sm ring-1 ring-border/50">
              <Search className="h-7 w-7 text-muted-foreground/70" />
            </div>
            <div className="text-lg font-semibold text-foreground">
              Nenhum item encontrado
            </div>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {props.emptyHint ??
                'Ajuste sua busca ou os filtros de categoria. Itens já reservados ficam disponíveis na tela do evento.'}
            </p>
            {/* Adicional: um botão de atalho para limpar filtros se estiver vazio */}
            {(props.search || props.activeCategoryId) && (
              <button
                onClick={() => {
                  props.setSearch('');
                  props.setActiveCategoryId('all'); // ou o ID padrão correspondente a "Todas"
                }}
                className="mt-4 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 animate-in fade-in duration-300">
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
    </Card>
  );
}
