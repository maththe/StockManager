import { RentalStatus } from '@prisma/client';

export class UpdateRentalInput {
  rentalCode?: string;
  startDate?: string;
  expectedReturn?: string;
  returnedAt?: string | null;
  location?: string | null;
  notes?: string | null;
  status?: RentalStatus;
  clientId?: string;
}
