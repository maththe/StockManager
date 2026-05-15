import { useState } from 'react';
import { Edit2, Eye, Loader2, Plus, Trash2, Upload } from 'lucide-react';
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
import { useCategories } from '~/services/tanStackQuery/Itens/categories';
import {
  useCreateItem,
  useDeleteItem,
  useItems,
  useUpdateItem,
} from '~/services/tanStackQuery/Itens/items';
import type { CreateItemInput, Item, UpdateItemInput } from '~/types/item';
import { ItemFormDialog } from './ItemFormDialog';
import { ItemImageRemoveDialog } from './ItemImageRemoveDialog';
import { ItemImageUploadDialog } from './ItemImageUploadDialog';
import { ItemImageViewDialog } from './ItemImageViewDialog';

interface ItemsListProps {
  categoryId?: string;
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  showCategoryColumn?: boolean;
  showSubtotalColumn?: boolean;
  showImageAction?: boolean;
  cardClassName?: string;
  tableWrapperClassName?: string;
}

export function ItemsList({
  categoryId,
  title = 'Gerenciar Itens',
  description,
  searchPlaceholder = 'Pesquisar itens...',
  emptyTitle = 'Nenhum item encontrado',
  emptyDescription = 'Clique em "Novo Item" para adicionar produtos ao seu estoque.',
  showCategoryColumn = true,
  showSubtotalColumn = false,
  showImageAction = true,
  cardClassName = 'bg-transparent shadow-none',
  tableWrapperClassName = 'overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm',
}: ItemsListProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<Item | null>(null);
  const [isRemovingImage, setIsRemovingImage] = useState(false);
  const [confirmRemoveImageOpen, setConfirmRemoveImageOpen] = useState(false);
  const [uploadingItem, setUploadingItem] = useState<Item | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { data: items = [], isLoading } = useItems(search.trim() || undefined);
  const { data: categories = [] } = useCategories();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const scopedItems = categoryId
    ? items.filter((item) => item.categoryId === categoryId)
    : items;

  const getCategoryName = (itemCategoryId: string) => {
    return categories.find((cat) => cat.id === itemCategoryId)?.name || '-';
  };

  const handleOpenDialog = (item?: Item) => {
    setSelectedItem(item ?? null);
    setDialogOpen(true);
  };

  const handleOpenImageAction = (item: Item) => {
    if (item.imageUrl) {
      setViewingItem(item);
      return;
    }

    setUploadingItem(item);
  };

  const handleRemoveImage = async () => {
    if (!viewingItem || isRemovingImage) {
      return;
    }

    try {
      setIsRemovingImage(true);
      await updateItem.mutateAsync({
        id: viewingItem.id,
        data: { imageUrl: null },
      });
      setConfirmRemoveImageOpen(false);
      setViewingItem(null);
    } catch {
    } finally {
      setIsRemovingImage(false);
    }
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

  const handleUploadImage = async (imageDataUrl: string) => {
    if (!uploadingItem) {
      return;
    }

    try {
      setIsUploadingImage(true);
      await updateItem.mutateAsync({
        id: uploadingItem.id,
        data: {
          imageUrl: imageDataUrl,
        },
      });
      setUploadingItem(null);
    } catch {
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este item?')) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteItem.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const resolvedDescription =
    description ??
    `Total de ${scopedItems.length} item${scopedItems.length !== 1 ? 'ns' : ''}`;

  return (
    <div className="space-y-6">
      <Card className={cardClassName}>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {resolvedDescription}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
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
          ) : scopedItems.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <div className="mb-2 text-lg font-semibold">{emptyTitle}</div>
              <div>{emptyDescription}</div>
            </div>
          ) : (
            <div className={tableWrapperClassName}>
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Disponivel</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    {showSubtotalColumn && (
                      <TableHead className="text-right">Subtotal</TableHead>
                    )}
                    <TableHead className="text-center">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedItems.map((item, index) => (
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
                      {showSubtotalColumn && (
                        <TableCell className="text-right">
                          R${' '}
                          {(item.availableQuantity * Number(item.unitCost)).toFixed(
                            2,
                          )}
                        </TableCell>
                      )}
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
                          {showImageAction && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenImageAction(item)}
                              className="hover:bg-muted/50"
                              title={
                                item.imageUrl ? 'Visualizar imagem' : 'Enviar imagem'
                              }
                            >
                              {item.imageUrl ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                            </Button>
                          )}
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
        initialCategoryId={categoryId}
        onSubmit={handleSubmit}
        isLoading={createItem.isPending || updateItem.isPending}
      />

      <ItemImageViewDialog
        item={viewingItem}
        onOpenChange={(open) => {
          if (!open) {
            setViewingItem(null);
          }
        }}
        onRequestRemove={() => setConfirmRemoveImageOpen(true)}
        isRemoving={isRemovingImage}
      />

      <ItemImageUploadDialog
        item={uploadingItem}
        onOpenChange={(open) => {
          if (!open) {
            setUploadingItem(null);
          }
        }}
        onSubmit={handleUploadImage}
        isSaving={isUploadingImage}
      />

      <ItemImageRemoveDialog
        open={confirmRemoveImageOpen}
        onOpenChange={setConfirmRemoveImageOpen}
        item={viewingItem}
        onConfirm={handleRemoveImage}
        isRemoving={isRemovingImage}
      />
    </div>
  );
}
