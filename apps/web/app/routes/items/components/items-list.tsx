import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react";
import { useItems, useUpdateItem, useDeleteItem, useCreateItem } from "~/services/tanStackQuery/Itens/items";
import { useCategories } from "~/services/tanStackQuery/Itens/categories";
import type { Item } from "~/types/item";
import { ItemFormDialog } from "./item-form-dialog";

export function ItemsList() {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useItems();
  const { data: categories = [] } = useCategories();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const getCategoryName = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId)?.name || "-";
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
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciar Itens</CardTitle>
            <CardDescription>
              Total de {items.length} item{items.length !== 1 ? "ns" : ""}
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Item
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum item cadastrado. Crie um novo para começar.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
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
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.skuCode}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{getCategoryName(item.categoryId)}</TableCell>
                      <TableCell className="text-right">{item.totalQuantity}</TableCell>
                      <TableCell className="text-right">{item.availableQuantity}</TableCell>
                      <TableCell className="text-right">
                        R$ {item.unitCost.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(item)}
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
    </div>
  );
}
