import { useState } from "react";

import { ItemModal } from "./components/ItemModal";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import type { Item, CreateItemInput, UpdateItemInput } from "~/types/item";
import { useCategories } from "~/services/tanStackQuery/Itens/categories";
import { useItems, useCreateItem, useUpdateItem, useDeleteItem } from "~/services/tanStackQuery/Itens/items";

export default function ItemsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | undefined>();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { data: items = [], isLoading: isItemsLoading } = useItems();
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const handleOpenModal = (item?: Item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(undefined);
  };

  const handleSubmit = async (data: CreateItemInput | UpdateItemInput) => {
    try {
      if (selectedItem) {
        await updateItem.mutateAsync({
          id: selectedItem.id,
          data,
        });
      } else {
        await createItem.mutateAsync(data as CreateItemInput);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error submitting item:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja deletar este item?")) {
      setIsDeleting(id);
      try {
        await deleteItem.mutateAsync(id);
      } catch (error) {
        console.error("Error deleting item:", error);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const isLoading = isItemsLoading || isCategoriesLoading;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Itens</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerenciar itens do estoque
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Itens</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum item cadastrado ainda
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Qtd. Total</TableHead>
                    <TableHead>Qtd. Disponível</TableHead>
                    <TableHead>Custo Unitário</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.skuCode}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.totalQuantity}</TableCell>
                      <TableCell>{item.availableQuantity}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(item.unitCost))}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenModal(item)}
                          disabled={isDeleting === item.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting === item.id}
                        >
                          {isDeleting === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ItemModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        item={selectedItem}
        onSubmit={handleSubmit}
        isLoading={createItem.isPending || updateItem.isPending}
        categories={categories}
      />
    </div>
  );
}
