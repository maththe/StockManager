import { useState } from "react";
import { Edit2, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { useCategories } from "~/services/tanStackQuery/Itens/categories";
import { useCreateItem, useDeleteItem, useItems, useUpdateItem } from "~/services/tanStackQuery/Itens/items";
import type { CreateItemInput, Item, UpdateItemInput } from "~/types/item";
import { ItemFormDialog } from "./ItemFormDialog";


export function ItemsList() {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useItems(search || undefined);
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar itens..."
                className="w-64 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-primary to-secondary text-white shadow-sm"
            >
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
            <div className="py-12 text-center text-muted-foreground">
              <div className="mb-2 text-lg font-semibold">Nenhum item encontrado</div>
              <div>Clique em "Novo Item" para adicionar produtos ao seu estoque.</div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Disponível</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className={index % 2 === 0 ? "bg-background/30" : "bg-muted/10 hover:bg-muted/20"}
                    >
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-sm">{getCategoryName(item.categoryId)}</TableCell>
                      <TableCell className="text-right">{item.totalQuantity}</TableCell>
                      <TableCell className="text-right">{item.availableQuantity}</TableCell>
                      <TableCell className="text-right">R$ {item.unitCost}</TableCell>
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
        onOpenChange={(open: any) => {
          if (!open) {
            handleCloseDialog();
          }
        }}
        item={selectedItem}
        onSubmit={handleSubmit}
        isLoading={createItem.isPending || updateItem.isPending}
      />
    </div>
  );
}
