import { RentalStatus } from '@prisma/client';

export class UpdateRentalInput {
  startDate?: string;
  expectedReturn?: string;
  location?: string | null;
  notes?: string | null;
  status?: RentalStatus;
  clientId?: string;
}
