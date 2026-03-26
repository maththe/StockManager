export interface CreateItemInput {
  name: string;
  totalQuantity: number;
  availableQuantity: number;
  unitCost: number;
  categoryId: string;
}

export interface UpdateItemInput {
  name?: string;
  totalQuantity?: number;
  availableQuantity?: number;
  unitCost?: number;
  categoryId?: string;
}

export interface Item {
  id: string;
  name: string;
  imageUrl?: string | null;
  image?: string | null;
  totalQuantity: number;
  availableQuantity: number;
  unitCost: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}
