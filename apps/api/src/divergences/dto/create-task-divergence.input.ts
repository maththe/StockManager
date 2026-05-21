export class CreateTaskDivergenceItemInput {
  taskItemId!: string;
  confirmedQuantity!: number;
  missingQuantity?: number;
  damagedQuantity?: number;
  notes?: string;
}

export class CreateTaskDivergenceInput {
  notes?: string;
  items!: CreateTaskDivergenceItemInput[];
}
