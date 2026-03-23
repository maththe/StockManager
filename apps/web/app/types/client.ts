export interface Client {
  id: string;
  companyName: string;
  taxId: string;
  contactName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  companyName: string;
  taxId: string;
  contactName?: string;
}
