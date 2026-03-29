import { Plus } from 'lucide-react';

import { Button } from '~/components/ui/button';

import type { EventCatalogItem } from '../utils/utils';
import { ItemThumbnail } from './ItemThumbnail';

interface CatalogCardProps {
  item: EventCatalogItem;
  categoryName: string;
  openQuantityDialog: (item: EventCatalogItem) => void;
  isBusy: boolean;
}

export function CatalogCard({
  item,
  categoryName,
  openQuantityDialog,
  isBusy,
}: CatalogCardProps) {
  return (
    <article className="group overflow-hidden rounded-[28px] border border-border/70 bg-background shadow-[0_10px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <ItemThumbnail
          item={item}
          categoryName={categoryName}
          className="transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-4 top-4 rounded-full bg-background/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground shadow-sm">
          {categoryName}
        </div>
      </div>
      <div className="flex min-h-[40%] flex-col justify-between gap-4 p-4">
        <div>
          <h4 className="line-clamp-2 text-base font-semibold text-foreground">
            {item.name}
          </h4>
          <p className="mt-2 text-sm text-muted-foreground">
            Estoque disponivel:{' '}
            <span className="font-semibold text-foreground">
              {item.availableQuantity}
            </span>
          </p>
        </div>
        <Button
          type="button"
          className="h-10 rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-sm hover:opacity-90"
          onClick={() => openQuantityDialog(item)}
          disabled={item.availableQuantity <= 0 || isBusy}
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>
    </article>
  );
}
