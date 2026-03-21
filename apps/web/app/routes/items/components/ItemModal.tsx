import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { ItemForm } from "./ItemForm";
import type { Item, CreateItemInput, UpdateItemInput } from "~/types/item";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: Item;
  onSubmit: (data: CreateItemInput | UpdateItemInput) => Promise<void>;
  isLoading?: boolean;
  categories: Array<{ id: string; name: string }>;
}

export function ItemModal({
  isOpen,
  onClose,
  item,
  onSubmit,
  isLoading = false,
  categories,
}: ItemModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl bg-white/70 dark:bg-[#071427]/60 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>
            {item ? "Editar Item" : "Criar Novo Item"}
          </DialogTitle>
          <DialogDescription>
            {item
              ? "Atualize as informações do item"
              : "Preencha os dados do novo item para adicionar ao estoque"}
          </DialogDescription>
        </DialogHeader>

        <ItemForm
          item={item}
          onSubmit={onSubmit}
          isLoading={isLoading}
          categories={categories}
        />
      </DialogContent>
    </Dialog>
  );
}
