export type RentalStatus = 'DRAFT' | 'ACTIVE' | 'RETURNED' | 'CANCELLED';

export interface RentalClient {
  id: string;
  companyName: string;
  taxId: string;
  contactName?: string | null;
}

export interface RentalItem {
  id: string;
  rentalId: string;
  itemId: string;
  quantity: number;
  returnedQuantity: number;
  tenantUuid: string;
  createdAt: string;
  updatedAt: string;
  item: {
    id: string;
    name: string;
    availableQuantity: number;
    totalQuantity: number;
    thumbnailImageUrl?: string | null;
    modalImageUrl?: string | null;
  };
}

export interface Rental {
  id: string;
  rentalCode: string;
  startDate: string;
  expectedReturn: string;
  returnedAt?: string | null;
  location?: string | null;
  notes?: string | null;
  status: RentalStatus;
  tenantUuid: string;
  clientId: string;
  client: RentalClient;
  rentalItems: RentalItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRentalInput {
  rentalCode: string;
  startDate: string;
  expectedReturn: string;
  location?: string;
  notes?: string;
  status: RentalStatus;
  clientId: string;
}

export interface UpdateRentalInput {
  rentalCode?: string;
  startDate?: string;
  expectedReturn?: string;
  returnedAt?: string | null;
  location?: string | null;
  notes?: string | null;
  status?: RentalStatus;
  clientId?: string;
}

export interface CreateRentalItemInput {
  itemId: string;
  quantity: number;
}

export interface UpdateRentalItemInput {
  quantity?: number;
  returnedQuantity?: number;
}
