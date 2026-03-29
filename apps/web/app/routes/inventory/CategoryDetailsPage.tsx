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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/inventory')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{category.name}</h1>
            {category.description && (
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-primary to-secondary text-white shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Itens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{categoryItems.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quantidade Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {categoryItems.reduce(
                (sum, item) => sum + item.availableQuantity,
                0,
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
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
      <Card className="bg-transparent shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Itens</CardTitle>
              <CardDescription>
                {categoryItems.length} item
                {categoryItems.length !== 1 ? 'ns' : ''}
              </CardDescription>
            </div>

            <div className="hidden sm:block">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por nome..."
                className="w-64 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : categoryItems.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <div className="mb-2 text-lg font-semibold">
                Nenhum item nesta categoria
              </div>
              <div>Clique em "Novo Item" para adicionar um item.</div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Disponível</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className={
                        index % 2 === 0
                          ? 'bg-background/30'
                          : 'bg-muted/10 hover:bg-muted/20'
                      }
                    >
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">
                        {item.totalQuantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.availableQuantity}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {Number(item.unitCost).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R${' '}
                        {(
                          item.availableQuantity * Number(item.unitCost)
                        ).toFixed(2)}
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
