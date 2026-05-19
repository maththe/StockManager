export class CreatePartialTaskItemInput {
  eventItemId!: string;
  requestedQuantity!: number;
  notes?: string;
}

export class CreatePartialTaskInput {
  items!: CreatePartialTaskItemInput[];
  assignedToId?: string | null;
  notes?: string;
}
