import { ArrowLeft, Edit2, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {
  useCategories,
  useDeleteCategory,
} from '~/services/tanStackQuery/Itens/categories';
import {
  useCreateItem,
  useDeleteItem,
  useItems,
  useUpdateItem,
} from '~/services/tanStackQuery/Itens/items';
import type { CreateItemInput, Item, UpdateItemInput } from '~/types/item';
import { ItemFormDialog } from '~/routes/items/components/ItemFormDialog';

export default function CategoryDetailsPage() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: categories = [] } = useCategories();
  const { data: items = [], isLoading } = useItems();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const category = categories.find((cat) => cat.id === categoryId);
  const categoryItems = items.filter((item) => item.categoryId === categoryId);

  const filteredItems = categoryItems.filter((item) =>
    [item.name].some((value) =>
      value.toLowerCase().includes(search.trim().toLowerCase()),
    ),
  );

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
      console.error('Error saving item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este item?')) {
      try {
        setDeletingId(id);
        await deleteItem.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting item:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (!category) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/inventory')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
          <p className="text-destructive">Categoria não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="border-border/50 hover:bg-muted"
            onClick={() => navigate('/dashboard/inventory')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {category.description}
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-primary to-secondary text-white font-medium shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
        >
          <Plus className="mr-2 h-5 w-5" />
          Novo Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">
              Total de Itens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {categoryItems.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-accent uppercase tracking-wider">
              Quantidade Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">
              {categoryItems.reduce(
                (sum, item) => sum + item.availableQuantity,
                0,
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-secondary/30 bg-gradient-to-br from-secondary/10 to-secondary/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-secondary uppercase tracking-wider">
              Valor em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-secondary">
              R${' '}
              {categoryItems
                .reduce(
                  (sum, item) =>
                    sum + item.availableQuantity * Number(item.unitCost),
                  0,
                )
                .toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card className="border border-border/50 bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">Itens</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {categoryItems.length} item
              {categoryItems.length !== 1 ? 'ns' : ''} nesta categoria
            </CardDescription>
          </div>

          <div className="w-full sm:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome..."
              className="w-full sm:w-80 rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : categoryItems.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-3 text-lg font-semibold text-foreground">
                Nenhum item nesta categoria
              </div>
              <div className="text-muted-foreground">
                Clique em "Novo Item" para adicionar um item.
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/50 bg-gradient-to-b from-muted/5 to-background shadow-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-muted/30">
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="text-right font-semibold hidden sm:table-cell">
                      Quantidade
                    </TableHead>
                    <TableHead className="text-right font-semibold hidden md:table-cell">
                      Disponível
                    </TableHead>
                    <TableHead className="text-right font-semibold hidden lg:table-cell">
                      Custo Unit.
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Subtotal
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-border/30 hover:bg-muted/20 transition-colors py-4"
                    >
                      <TableCell className="font-semibold text-foreground">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                        {item.totalQuantity}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground hidden md:table-cell">
                        {item.availableQuantity}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground hidden lg:table-cell">
                        R$ {Number(item.unitCost).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        R${' '}
                        {(
                          item.availableQuantity * Number(item.unitCost)
                        ).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(item)}
                            className="border-border/50 hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
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
        onOpenChange={(open) => {
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
