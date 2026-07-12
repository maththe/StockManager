import { ImageOff } from 'lucide-react';
import { cn } from '~/lib/utils';
import {
  getItemImage,
  getItemInitials,
  type ItemImageVariant,
} from '../utils/utils';

interface ItemThumbnailProps {
  item: {
    name: string;
    imageUrl?: string | null;
  };
  categoryName?: string;
  className?: string;
  variant?: ItemImageVariant;
}

export function ItemThumbnail({
  item,
  categoryName,
  className,
  variant = 'thumbnail',
}: ItemThumbnailProps) {
  const image = getItemImage(item, variant);
  if (image)
    return (
      <img
        src={image}
        alt={item.name}
        className={cn('h-full w-full', className)}
      />
    );

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/15 via-background to-secondary/20 text-center',
        className,
      )}
    >
      <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-background/80 text-sm font-semibold shadow-sm">
        {getItemInitials(item.name)}
      </div>
      <div className="px-3 text-xs font-medium text-foreground">
        {item.name}
      </div>
      {categoryName && (
        <div className="mt-1 flex items-center gap-1 px-3 text-[11px] text-muted-foreground">
          <ImageOff className="h-3 w-3" />
          {categoryName}
        </div>
      )}
    </div>
  );
}
