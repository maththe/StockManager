import { MaintenanceType } from '@prisma/client';

export class CreateMaintenanceInput {
  itemId!: string;
  quantity!: number;
  type?: MaintenanceType;
  notes?: string;
  assignedToId?: string;
}
