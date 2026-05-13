export interface CreateItemInput {
  name: string;
  totalQuantity: number;
  availableQuantity: number;
  unitCost: number;
  categoryId: string;
  thumbnailImageUrl?: string | null;
  modalImageUrl?: string | null;
}

export interface UpdateItemInput {
  name?: string;
  totalQuantity?: number;
  availableQuantity?: number;
  unitCost?: number;
  categoryId?: string;
  imageUrl?: string
}

export interface Item {
  id: string;
  name: string;
  imageUrl?: string | null;
  totalQuantity: number;
  availableQuantity: number;
  unitCost: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}
