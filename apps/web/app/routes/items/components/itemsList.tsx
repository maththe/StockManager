import { type ChangeEvent, type DragEvent, useState } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
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
import { mutationError } from '~/services/tanStackQuery/mutationToast';
import type { CreateItemInput, Item, UpdateItemInput } from '~/types/item';
import { ItemFormDialog } from './ItemFormDialog';

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

const MAX_IMAGE_DIMENSION = 1280;
const MAX_IMAGE_SIZE_BYTES = 350 * 1024;
const MIN_IMAGE_QUALITY = 0.45;

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image-load-failed'));
    image.src = dataUrl;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('invalid-file-reader-result'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('file-read-failed'));
    reader.readAsDataURL(file);
  });
}

async function compressImage(file: File): Promise<string> {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(originalDataUrl);

  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(image.width, image.height),
  );
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('canvas-context-unavailable');
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  let quality = 0.82;
  let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

  while (
    compressedDataUrl.length > MAX_IMAGE_SIZE_BYTES * 1.37 &&
    quality > MIN_IMAGE_QUALITY
  ) {
    quality -= 0.08;
    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  return compressedDataUrl;
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
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

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
    setUploadPreview(null);
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

  const handleCloseUploadDialog = () => {
    setUploadingItem(null);
    setUploadPreview(null);
    setIsUploadingImage(false);
    setIsDragActive(false);
  };

  const handleProcessImageFile = async (file?: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      mutationError('Selecione um arquivo de imagem valido.', new Error('invalid-image-type'));
      setUploadPreview(null);
      return;
    }

    try {
      setIsUploadingImage(true);
      const compressedImage = await compressImage(file);
      setUploadPreview(compressedImage);
    } catch (error) {
      mutationError('Nao foi possivel processar a imagem selecionada.', error);
      setUploadPreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSelectImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    await handleProcessImageFile(file);
    event.target.value = '';
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isUploadingImage) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDragActive(false);
  };

  const handleDropImage = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);

    if (isUploadingImage) {
      return;
    }

    const file = event.dataTransfer.files?.[0];
    await handleProcessImageFile(file);
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

  const handleUploadImage = async () => {
    if (!uploadingItem || !uploadPreview) {
      return;
    }

    try {
      setIsUploadingImage(true);
      await updateItem.mutateAsync({
        id: uploadingItem.id,
        data: {
          imageUrl: uploadPreview,
        },
      });
      handleCloseUploadDialog();
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

      <Dialog
        open={!!viewingItem}
        onOpenChange={(open) => {
          if (!open && !isRemovingImage) {
            setViewingItem(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Visualizacao da imagem</DialogTitle>
            {viewingItem && (
              <DialogDescription>{viewingItem.name}</DialogDescription>
            )}
          </DialogHeader>

          {viewingItem?.imageUrl && (
            <div className="flex justify-center">
              <img
                src={viewingItem.imageUrl}
                alt={viewingItem.name}
                className="max-h-[70vh] max-w-full rounded-md object-contain"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewingItem(null)}
              disabled={isRemovingImage}
            >
              Fechar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmRemoveImageOpen(true)}
              disabled={isRemovingImage}
            >
              {isRemovingImage ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remover imagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!uploadingItem}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseUploadDialog();
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload da imagem</DialogTitle>
            <DialogDescription>
              {uploadingItem
                ? `O item "${uploadingItem.name}" ainda nao possui imagem cadastrada.`
                : 'Selecione uma imagem para o item.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              type="file"
              accept="image/*"
              onChange={handleSelectImage}
              disabled={isUploadingImage}
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDropImage}
              className={`rounded-lg border border-dashed px-4 py-8 transition ${
                isDragActive
                  ? 'border-primary bg-primary/10'
                  : 'border-border/70 bg-muted/10'
              } ${isUploadingImage ? 'pointer-events-none opacity-70' : ''}`}
            >
              {uploadPreview ? (
                <div className="flex justify-center">
                  <img
                    src={uploadPreview}
                    alt="Pre-visualizacao da imagem"
                    className="max-h-[50vh] max-w-full rounded-md object-contain"
                  />
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  {isUploadingImage
                    ? 'Processando imagem...'
                    : isDragActive
                      ? 'Solte a imagem aqui.'
                      : 'Arraste e solte uma imagem aqui ou selecione um arquivo acima.'}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseUploadDialog}
              disabled={isUploadingImage}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUploadImage}
              disabled={!uploadPreview || isUploadingImage}
              className="bg-gradient-to-r from-primary to-secondary text-white"
            >
              {isUploadingImage && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar imagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmRemoveImageOpen}
        onOpenChange={(open) => {
          if (isRemovingImage) {
            return;
          }
          setConfirmRemoveImageOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover imagem</AlertDialogTitle>
            <AlertDialogDescription>
              {viewingItem
                ? `Tem certeza que deseja remover a imagem do item "${viewingItem.name}"? Esta acao nao podera ser desfeita.`
                : 'Tem certeza que deseja remover a imagem deste item? Esta acao nao podera ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingImage}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleRemoveImage();
              }}
              disabled={isRemovingImage}
            >
              {isRemovingImage ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
