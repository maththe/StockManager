export type MaintenanceStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export interface MaintenanceItem {
  id: string;
  name: string;
  availableQuantity?: number;
}

export interface MaintenanceDivergence {
  id: string;
  source: string;
  sourceId?: string;
  notes?: string;
}

export interface MaintenanceUser {
  id: string;
  name: string;
}

export interface Maintenance {
  id: string;
  code: string;
  status: MaintenanceStatus;
  quantity: number;
  notes?: string;
  tenantUuid: string;
  itemId: string;
  divergenceId?: string;
  item?: MaintenanceItem;
  divergence?: MaintenanceDivergence;
  assignedTo?: MaintenanceUser;
  createdBy?: MaintenanceUser;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceInput {
  itemId: string;
  quantity: number;
  notes?: string;
  assignedToId?: string;
}

export interface UpdateMaintenanceInput {
  notes?: string;
  assignedToId?: string | null;
}
