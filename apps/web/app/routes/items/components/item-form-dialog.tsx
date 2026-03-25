import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { InputForm } from "~/components/Form/InputForm";
import { Label } from "~/components/ui/label";
import { Loader2 } from "lucide-react";
import type { CreateItemInput, UpdateItemInput, Item } from "~/types/item";
import { useCategories } from "~/services/tanStackQuery/Itens/categories";
import { SelectForm } from "~/components/Form/SelectForm";

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
  initialCategoryId?: string | null;
  onSubmit: (data: CreateItemInput | UpdateItemInput) => Promise<void>;
  isLoading?: boolean;
}

function getDefaultValues(item?: Item | null, initialCategoryId?: string | null) {
  return item
    ? {
      skuCode: item.skuCode,
      name: item.name,
      totalQuantity: item.totalQuantity,
      availableQuantity: item.availableQuantity,
      unitCost: item.unitCost,
      categoryId: item.categoryId,
    }
    : {
      skuCode: "",
      name: "",
      totalQuantity: 0,
      availableQuantity: 0,
      unitCost: 0,
      categoryId: initialCategoryId ?? "",
    };
}

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
  initialCategoryId,
  onSubmit,
  isLoading = false,
}: ItemFormDialogProps) {
  const form = useForm({
    defaultValues: getDefaultValues(item, initialCategoryId),
  });

  const { data: categories = [] } = useCategories();

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(item, initialCategoryId));
    }
  }, [form, initialCategoryId, item, open]);

  const handleSubmit = async (data: any) => {
    await onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-card/75 dark:bg-card/60 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>{item ? "Editar Item" : "Novo Item"}</DialogTitle>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="skuCode">Código SKU</Label>
              <InputForm
                name="skuCode"
                placeholder="EX: SKU-001"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Item</Label>
              <InputForm
                name="name"
                placeholder="Nome do item"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="totalQuantity">Quantidade Total</Label>
                <InputForm
                  name="totalQuantity"
                  type="number"
                  placeholder="0"
                  required
                  registerOptions={{ valueAsNumber: true }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="availableQuantity">Quantidade Disponível</Label>
                <InputForm
                  name="availableQuantity"
                  type="number"
                  placeholder="0"
                  required
                  registerOptions={{ valueAsNumber: true }}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unitCost">Custo Unitário</Label>
              <InputForm
                name="unitCost"
                type="number"
                placeholder="0.00"
                step="0.01"
                required
                registerOptions={{ valueAsNumber: true }}
              />
            </div>

            <div className="grid gap-2">
              <SelectForm
                name="categoryId"
                label="Categoria"
                options={categories.map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                }))}
                placeholder="Selecione uma categoria"
                required
              />
            </div>

            <DialogFooter className="pt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-secondary text-white" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {item ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
