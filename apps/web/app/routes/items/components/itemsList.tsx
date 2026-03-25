import { useMemo, useState } from "react";
import { ArrowLeft, Edit2, FolderOpen, Loader2, Package, Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { useCategories, useDeleteCategory } from "~/services/tanStackQuery/Itens/categories";
import { useCreateItem, useDeleteItem, useItems, useUpdateItem } from "~/services/tanStackQuery/Itens/items";
import type { CreateItemInput, Item, UpdateItemInput } from "~/types/item";
import CategoriesForm from "~/routes/categories/CategoriesForm";
import { ItemFormDialog } from "./item-form-dialog";

export function ItemsList() {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const { data: items = [], isLoading } = useItems();
  const { data: categories = [] } = useCategories();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const deleteCategory = useDeleteCategory();

  const getCategoryName = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId)?.name || "-";
  };

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return items;
    }

    return items.filter((item) =>
      [item.name, item.skuCode, getCategoryName(item.categoryId)].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [items, search, categories]);

  const categoryCards = useMemo(
    () =>
      categories.map((category) => {
        const categoryItems = filteredItems.filter((item) => item.categoryId === category.id);

        return {
          ...category,
          itemsCount: categoryItems.length,
          availableQuantity: categoryItems.reduce((total, item) => total + item.availableQuantity, 0),
        };
      }),
    [categories, filteredItems],
  );

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? null;
  const categoryItems = selectedCategoryId
    ? filteredItems.filter((item) => item.categoryId === selectedCategoryId)
    : [];

  const handleCategoryOpenModal = () => {
    setIsCategoryModalOpen(true);
  };

  const handleOpenDialog = (item?: Item, categoryId?: string) => {
    if (item) {
      setSelectedItem(item);
      setSelectedCategoryId(item.categoryId);
    } else {
      setSelectedItem(null);
      if (categoryId) {
        setSelectedCategoryId(categoryId);
      }
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

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) {
      return;
    }

    try {
      setDeletingCategoryId(categoryId);
      await deleteCategory.mutateAsync(categoryId);
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(null);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setDeletingCategoryId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-transparent shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Gerenciar Itens</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {selectedCategory
                ? `Categoria ${selectedCategory.name} com ${categoryItems.length} item${categoryItems.length !== 1 ? "ns" : ""}`
                : `Total de ${items.length} item${items.length !== 1 ? "ns" : ""}`}
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

            <Button onClick={handleCategoryOpenModal} className="bg-gradient-to-r from-primary/80 to-secondary/80 text-white shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>

            <Button
              onClick={() => handleOpenDialog(undefined, selectedCategoryId ?? undefined)}
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
          ) : selectedCategory ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/70 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setSelectedCategoryId(null)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para categorias
                  </Button>
                  <div>
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <FolderOpen className="h-4 w-4" />
                      {selectedCategory.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {categoryItems.length} item{categoryItems.length !== 1 ? "ns" : ""} listado{categoryItems.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleOpenDialog(undefined, selectedCategory.id)}
                  className="bg-gradient-to-r from-primary to-secondary text-white shadow-sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Item nesta categoria
                </Button>
              </div>

              {categoryItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center text-muted-foreground">
                  <div className="mb-2 text-lg font-semibold">Nenhum item nesta categoria</div>
                  <div>Crie um novo item para {selectedCategory.name} ou ajuste a pesquisa.</div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Disponivel</TableHead>
                        <TableHead className="text-right">Custo Unit.</TableHead>
                        <TableHead className="text-center">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryItems.map((item, index) => (
                        <TableRow key={item.id} className={index % 2 === 0 ? "bg-background/30" : "bg-muted/10 hover:bg-muted/20"}>
                          <TableCell className="font-mono text-sm">{item.skuCode}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
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
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {categoryCards.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className="rounded-2xl border border-border/80 bg-card/70 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold">{category.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {category.description || "Sem descricao cadastrada."}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <Package className="h-5 w-5" />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id);
                        }}
                        disabled={deletingCategoryId === category.id}
                      >
                        {deletingCategoryId === category.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div>
                      <div className="text-3xl font-semibold">{category.itemsCount}</div>
                      <div className="text-sm text-muted-foreground">itens</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{category.availableQuantity}</div>
                      <div className="text-xs text-muted-foreground">disponiveis</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ItemFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
          }
        }}
        item={selectedItem}
        initialCategoryId={selectedCategoryId}
        onSubmit={handleSubmit}
        isLoading={createItem.isPending || updateItem.isPending}
      />

      <CategoriesForm isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} />
    </div>
  );
}
