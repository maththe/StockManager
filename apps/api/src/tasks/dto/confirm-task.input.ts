export class ConfirmTaskItemInput {
  taskItemId!: string;
  confirmedQuantity!: number;
  notes?: string;
}

export class ConfirmTaskInput {
  items!: ConfirmTaskItemInput[];
}
