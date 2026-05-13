import { RentalStatus } from '@prisma/client';

export class CreateRentalInput {
  rentalCode!: string;
  startDate!: string;
  expectedReturn!: string;
  location?: string;
  notes?: string;
  status?: RentalStatus;
  clientId!: string;
}
