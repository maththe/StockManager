import { MaintenanceType } from '@prisma/client';

export class UpdateMaintenanceInput {
  notes?: string;
  type?: MaintenanceType;
  assignedToId?: string | null;
}
