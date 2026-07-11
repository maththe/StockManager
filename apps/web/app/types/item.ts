export interface CreateItemInput {
  name: string;
  totalQuantity: number;
  availableQuantity: number;
  unitCost: number;
  categoryId: string;
  imageUrl?: string | null;
}

export interface UpdateItemInput {
  name?: string;
  totalQuantity?: number;
  availableQuantity?: number;
  unitCost?: number;
  categoryId?: string;
  imageUrl?: string | null;
}

export interface Item {
  id: string;
  name: string;
  imageUrl?: string | null;
  totalQuantity: number;
  availableQuantity: number;
  // Decimal do Prisma chega serializado como string no JSON
  unitCost: number | string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}
