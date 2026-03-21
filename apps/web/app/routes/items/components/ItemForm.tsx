import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { InputForm } from "~/components/Form/InputForm";
import { SelectForm } from "~/components/Form/SelectForm";
import { Loader2 } from "lucide-react";
import type { Item, CreateItemInput, UpdateItemInput } from "~/types/item";

interface ItemFormProps {
  item?: Item;
  onSubmit: (data: CreateItemInput | UpdateItemInput) => Promise<void>;
  isLoading?: boolean;
  categories: Array<{ id: string; name: string }>;
}

export function ItemForm({ item, onSubmit, isLoading = false, categories }: ItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm({
    defaultValues: {
      skuCode: item?.skuCode || "",
      name: item?.name || "",
      totalQuantity: item?.totalQuantity || 0,
      availableQuantity: item?.availableQuantity || 0,
      unitCost: item?.unitCost || 0,
      categoryId: item?.categoryId || "",
    },
  });

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        totalQuantity: Number(data.totalQuantity),
        availableQuantity: Number(data.availableQuantity),
        unitCost: Number(data.unitCost),
      });
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <InputForm
            name="skuCode"
            label="Código SKU"
            placeholder="SKU-001"
            disabled={isSubmitting || isLoading}
          />
          <InputForm
            name="name"
            label="Nome do Item"
            placeholder="Cadeira de eventos"
            disabled={isSubmitting || isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputForm
            name="totalQuantity"
            label="Quantidade Total"
            type="number"
            placeholder="100"
            disabled={isSubmitting || isLoading}
          />
          <InputForm
            name="availableQuantity"
            label="Quantidade Disponível"
            type="number"
            placeholder="80"
            disabled={isSubmitting || isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputForm
            name="unitCost"
            label="Custo Unitário"
            type="number"
            step="0.01"
            placeholder="50.00"
            disabled={isSubmitting || isLoading}
          />
          <SelectForm
            name="categoryId"
            label="Categoria"
            disabled={isSubmitting || isLoading}
            options={categories.map(cat => ({
              value: cat.id,
              label: cat.name,
            }))}
          />
        </div>

        <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:opacity-95" disabled={isSubmitting || isLoading}>
          {(isSubmitting || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {item ? "Atualizar Item" : "Criar Item"}
        </Button>
      </form>
    </FormProvider>
  );
}
