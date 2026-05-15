import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import type { Item } from '~/types/item';

interface ItemImageViewDialogProps {
  item: Item | null;
  onOpenChange: (open: boolean) => void;
  onRequestRemove: () => void;
  isRemoving: boolean;
}

export function ItemImageViewDialog({
  item,
  onOpenChange,
  onRequestRemove,
  isRemoving,
}: ItemImageViewDialogProps) {
  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open && isRemoving) {
          return;
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Visualizacao da imagem</DialogTitle>
          {item && <DialogDescription>{item.name}</DialogDescription>}
        </DialogHeader>

        {item?.imageUrl && (
          <div className="flex justify-center">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="max-h-[70vh] max-w-full rounded-md object-contain"
            />
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRemoving}
          >
            Fechar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onRequestRemove}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Remover imagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
