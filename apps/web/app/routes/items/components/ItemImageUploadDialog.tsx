import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ImageUp, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { mutationError } from '~/services/tanStackQuery/mutationToast';
import type { Item } from '~/types/item';

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

interface ItemImageUploadDialogProps {
  item: Item | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (imageDataUrl: string) => Promise<void>;
  isSaving: boolean;
}

export function ItemImageUploadDialog({
  item,
  onOpenChange,
  onSubmit,
  isSaving,
}: ItemImageUploadDialogProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusy = isProcessing || isSaving;

  const previewSizeLabel = useMemo(() => {
    if (!preview) {
      return null;
    }

    const base64 = preview.slice(preview.indexOf(',') + 1);
    const bytes = Math.round((base64.length * 3) / 4);
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }, [preview]);

  useEffect(() => {
    if (!item) {
      setPreview(null);
      setFileName(null);
      setIsProcessing(false);
      setIsDragActive(false);
    }
  }, [item]);

  const handleClose = () => {
    if (isBusy) {
      return;
    }
    onOpenChange(false);
  };

  const openFilePicker = () => {
    if (isBusy) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleClearPreview = () => {
    if (isBusy) {
      return;
    }
    setPreview(null);
    setFileName(null);
  };

  const handleProcessImageFile = async (file?: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      mutationError(
        'Esse arquivo não é uma imagem. Use PNG, JPG ou WEBP.',
        new Error('invalid-image-type'),
      );
      setPreview(null);
      setFileName(null);
      return;
    }

    try {
      setIsProcessing(true);
      const compressedImage = await compressImage(file);
      setPreview(compressedImage);
      setFileName(file.name);
    } catch (error) {
      mutationError('Nao foi possivel processar a imagem selecionada.', error);
      setPreview(null);
      setFileName(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    await handleProcessImageFile(file);
    event.target.value = '';
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes('Files')) {
      return;
    }

    event.preventDefault();
    if (!isBusy) {
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

    if (isBusy) {
      return;
    }

    const file = event.dataTransfer.files?.[0];
    await handleProcessImageFile(file);
  };

  const handleSubmit = async () => {
    if (!preview) {
      return;
    }
    await onSubmit(preview);
  };

  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
          return;
        }
        onOpenChange(open);
      }}
    >
      <DialogContent
        className="sm:max-w-xl"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropImage}
      >
        {isDragActive && (
          <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary bg-background/90 backdrop-blur-[2px]">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/15">
              <ImageUp className="size-8 text-primary" />
            </div>
            <p className="text-base font-semibold text-primary">
              Solte a imagem aqui
            </p>
            {item && (
              <p className="text-xs text-muted-foreground">
                Ela será usada como foto de "{item.name}"
              </p>
            )}
          </div>
        )}

        <DialogHeader>
          <DialogTitle>
            {preview ? 'Confirmar imagem' : 'Adicionar imagem ao item'}
          </DialogTitle>
          <DialogDescription>
            {item
              ? `Arraste uma imagem para qualquer lugar desta janela para ilustrar "${item.name}".`
              : 'Arraste uma imagem para qualquer lugar desta janela.'}
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSelectImage}
          disabled={isBusy}
        />

        {preview ? (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl border border-border/70 bg-muted/20">
              <img
                src={preview}
                alt={`Pré-visualização da imagem de ${item?.name ?? 'item'}`}
                className="mx-auto max-h-[45vh] w-full object-contain"
              />
              {isBusy && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <Loader2 className="size-7 animate-spin text-primary" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs text-muted-foreground">
                {fileName && (
                  <span className="font-medium text-foreground">{fileName}</span>
                )}
                {fileName && previewSizeLabel && ' · '}
                {previewSizeLabel && `comprimida para ${previewSizeLabel}`}
              </p>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openFilePicker}
                  disabled={isBusy}
                >
                  <Upload className="size-3.5" />
                  Trocar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={handleClearPreview}
                  disabled={isBusy}
                >
                  <Trash2 className="size-3.5" />
                  Remover
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Prefere outra foto? Arraste-a para esta janela para substituir.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            disabled={isBusy}
            className="group flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center transition outline-none hover:border-primary/60 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">
                  Processando imagem...
                </p>
              </>
            ) : (
              <>
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 transition group-hover:bg-primary/15">
                  <ImageUp className="size-7 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Arraste a imagem para cá
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ou{' '}
                    <span className="font-medium text-primary underline underline-offset-2">
                      clique para escolher um arquivo
                    </span>
                  </p>
                </div>
                <p className="text-[0.7rem] text-muted-foreground">
                  PNG, JPG ou WEBP · redimensionamos e comprimimos automaticamente
                </p>
              </>
            )}
          </button>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!preview || isBusy}
            className="bg-gradient-to-r from-primary to-secondary text-white"
          >
            {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar imagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
