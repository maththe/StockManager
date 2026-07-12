import { type ChangeEvent, type DragEvent, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const isBusy = isProcessing || isSaving;

  useEffect(() => {
    if (!item) {
      setPreview(null);
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

  const handleProcessImageFile = async (file?: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      mutationError(
        'Selecione um arquivo de imagem valido.',
        new Error('invalid-image-type'),
      );
      setPreview(null);
      return;
    }

    try {
      setIsProcessing(true);
      const compressedImage = await compressImage(file);
      setPreview(compressedImage);
    } catch (error) {
      mutationError('Nao foi possivel processar a imagem selecionada.', error);
      setPreview(null);
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload da imagem</DialogTitle>
          <DialogDescription>
            {item
              ? `O item "${item.name}" ainda nao possui imagem cadastrada.`
              : 'Selecione uma imagem para o item.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            type="file"
            accept="image/*"
            onChange={handleSelectImage}
            disabled={isBusy}
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDropImage}
            className={`rounded-lg border border-dashed px-4 py-8 transition ${
              isDragActive
                ? 'border-primary bg-primary/10'
                : 'border-border/70 bg-muted/10'
            } ${isBusy ? 'pointer-events-none opacity-70' : ''}`}
          >
            {preview ? (
              <div className="flex justify-center">
                <img
                  src={preview}
                  alt="Pre-visualizacao da imagem"
                  className="max-h-[50vh] max-w-full rounded-md object-contain"
                />
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                {isProcessing
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
