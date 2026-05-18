export class CreateMaintenanceInput {
  itemId!: string;
  quantity!: number;
  notes?: string;
  assignedToId?: string;
}
