export interface Client {
  id: string;
  companyName: string;
  taxId: string;
  contactName?: string | null;
  tenantUuid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  companyName: string;
  taxId: string;
  contactName?: string;
}

export interface UpdateClientInput {
  companyName?: string;
  taxId?: string;
  contactName?: string;
}
