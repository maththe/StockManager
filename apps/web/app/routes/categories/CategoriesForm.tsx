import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {  useNavigate } from "react-router";
import { InputForm } from "~/components/Form/InputForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { useCreateCategory } from "~/services/tanStackQuery/Itens/categories";


interface CategoriesFormProps {
  isOpen: boolean;
  onClose: () => void;
}



export function CategoriesForm({
    isOpen,
    onClose
}: CategoriesFormProps
) {
    const form = useForm();
    const navigate = useNavigate();
    const {mutateAsync: createCategory} = useCreateCategory();

    const onSubmit = async() => {
        const payload = {
            name: form.getValues("name"),
            description: form.getValues("description")
        };
        try {   
            await createCategory(payload);        
            navigate("/dashboard");
        }
        catch (error) {
            console.error("Error logging in:", error);
        }}



    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] rounded-2xl bg-white/75 dark:bg-[#071427]/60 backdrop-blur-md">
                <DialogHeader>
                    <DialogTitle>
                        Criar Nova Categoria
                    </DialogTitle>
                    <DialogDescription>
                        Preencha os dados da nova categoria para adicionar ao estoque
                    </DialogDescription>
                </DialogHeader>
    
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 py-2">
            <div className="grid gap-3">
              <InputForm name="name" label="Nome" />
              <InputForm name="description" label="Descrição" />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="mt-2 inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-md shadow-sm hover:opacity-95">
                Criar Categoria
              </button>
            </div>
        </form>
      </FormProvider>
            
            </DialogContent>
        </Dialog>
      
    )
  }


export default CategoriesForm