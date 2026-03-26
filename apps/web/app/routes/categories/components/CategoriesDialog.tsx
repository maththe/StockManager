import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { CategoriesForm } from "./CategoriesForm";
import type { Category } from "~/types/category";


interface CategoriesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
}

export function CategoriesDialog({
  isOpen,
  onClose,
  category,
}: CategoriesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl bg-card/75 dark:bg-card/60 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>
            {category ? "Editar Categoria" : "Criar Nova Categoria"}
          </DialogTitle>
          <DialogDescription>
            {category
              ? "Atualize as informações da categoria"
              : "Preencha os dados da nova categoria para organizar seus itens"}
          </DialogDescription>
        </DialogHeader>

        <CategoriesForm
          category={category}
          onSubmitSuccess={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
