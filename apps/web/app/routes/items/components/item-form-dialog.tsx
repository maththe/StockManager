import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { InputForm } from "~/components/Form/InputForm";
import { Label } from "~/components/ui/label";
import { Loader2 } from "lucide-react";
import type { CreateItemInput, UpdateItemInput, Item } from "~/types/item";
import { useCategories } from "~/services/tanStackQuery/Itens/categories";

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
  onSubmit: (data: CreateItemInput | UpdateItemInput) => Promise<void>;
  isLoading?: boolean;
}

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
  isLoading = false,
}: ItemFormDialogProps) {
  const form = useForm({
    defaultValues: item
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
          categoryId: "",
        },
  });

  const { data: categories = [] } = useCategories();

  const handleSubmit = async (data: any) => {
    await onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Editar Item" : "Novo Item"}</DialogTitle>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="availableQuantity">Quantidade Disponível</Label>
                <InputForm
                  name="availableQuantity"
                  type="number"
                  placeholder="0"
                  required
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
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="categoryId">Categoria</Label>
              <select
                {...form.register("categoryId")}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
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
