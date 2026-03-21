import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react";
import { useItems, useUpdateItem, useDeleteItem, useCreateItem } from "~/services/tanStackQuery/Itens/items";
import { useCategories } from "~/services/tanStackQuery/Itens/categories";
import type { Item } from "~/types/item";
import { ItemFormDialog } from "./item-form-dialog";
import CategoriesForm from "~/routes/categories/CategoriesForm";

export function ItemsList() {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const { data: items = [], isLoading } = useItems();
  const { data: categories = [] } = useCategories();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  

  const getCategoryName = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId)?.name || "-";
  };

  const handleCategoryOpenModal = () => {
    setIsCategoryModalOpen(true);
  };

  const handleOpenDialog = (item?: Item) => {
    if (item) {
      setSelectedItem(item);
    } else {
      setSelectedItem(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedItem(null);
    setDialogOpen(false);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedItem) {
        await updateItem.mutateAsync({
          id: selectedItem.id,
          data,
        });
      } else {
        await createItem.mutateAsync(data);
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja deletar este item?")) {
      try {
        setDeletingId(id);
        await deleteItem.mutateAsync(id);
      } catch (error) {
        console.error("Error deleting item:", error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-transparent shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Gerenciar Itens</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Total de {items.length} item{items.length !== 1 ? "ns" : ""}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <input
                type="text"
                placeholder="Pesquisar itens..."
                className="px-3 py-2 rounded-lg border border-input bg-background text-sm w-64 focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <Button onClick={() => handleCategoryOpenModal()} className="bg-gradient-to-r from-primary/80 to-secondary/80 text-white shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>

            <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-primary to-secondary text-white shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Novo Item
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-lg font-semibold mb-2">Nenhum item encontrado</div>
              <div>Clique em "Novo Item" para adicionar produtos ao seu estoque.</div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Disponível</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={item.id} className={i % 2 === 0 ? "bg-white/50" : "bg-muted/5 hover:bg-muted/10"}>
                      <TableCell className="font-mono text-sm">{item.skuCode}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{getCategoryName(item.categoryId)}</TableCell>
                      <TableCell className="text-right">{item.totalQuantity}</TableCell>
                      <TableCell className="text-right">{item.availableQuantity}</TableCell>
                      <TableCell className="text-right">
                        R$ {item.unitCost}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(item)}
                            className="hover:bg-muted/50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ItemFormDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        item={selectedItem}
        onSubmit={handleSubmit}
        isLoading={createItem.isPending || updateItem.isPending}
      />

      <CategoriesForm isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} />
    </div>
  );
}
