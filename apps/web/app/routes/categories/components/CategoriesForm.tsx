import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { InputForm } from '~/components/Form/InputForm';
import { Button } from '~/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  useCreateCategory,
  useUpdateCategory,
} from '~/services/tanStackQuery/Itens/categories';
import type { Category } from '~/types/category';

interface CategoriesFormProps {
  category?: Category | null;
  onSubmitSuccess?: () => void;
}

export function CategoriesForm({
  category,
  onSubmitSuccess,
}: CategoriesFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm({
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
    },
  });

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (category) {
        await updateCategory.mutateAsync({
          id: category.id,
          data,
        });
      } else {
        await createCategory.mutateAsync(data);
      }
      form.reset();
      onSubmitSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid gap-3">
          <InputForm
            name="name"
            label="Nome"
            placeholder="Ex: Eletrônicos"
            disabled={isSubmitting}
          />
          <InputForm
            name="description"
            label="Descrição"
            placeholder="Descrição da categoria"
            disabled={isSubmitting}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:opacity-95"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {category ? 'Atualizar Categoria' : 'Criar Categoria'}
        </Button>
      </form>
    </FormProvider>
  );
}
