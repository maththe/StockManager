export interface CreateItemInput {
  skuCode: string;
  name: string;
  totalQuantity: number;
  availableQuantity: number;
  unitCost: number;
  categoryId: string;
}

export interface UpdateItemInput {
  skuCode?: string;
  name?: string;
  totalQuantity?: number;
  availableQuantity?: number;
  unitCost?: number;
  categoryId?: string;
}

export interface Item {
  id: string;
  skuCode: string;
  name: string;
  totalQuantity: number;
  availableQuantity: number;
  unitCost: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}
