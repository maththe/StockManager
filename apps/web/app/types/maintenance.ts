export type MaintenanceStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export type MaintenanceType =
  | 'REPARO'
  | 'LIMPEZA'
  | 'PINTURA'
  | 'COSTURA'
  | 'ELETRICA'
  | 'OUTRA';

export const MAINTENANCE_TYPES: MaintenanceType[] = [
  'REPARO',
  'LIMPEZA',
  'PINTURA',
  'COSTURA',
  'ELETRICA',
  'OUTRA',
];

export const MAINTENANCE_TYPE_LABEL: Record<MaintenanceType, string> = {
  REPARO: 'Reparo',
  LIMPEZA: 'Limpeza',
  PINTURA: 'Pintura',
  COSTURA: 'Costura',
  ELETRICA: 'Elétrica',
  OUTRA: 'Outra',
};

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
  type: MaintenanceType;
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
  type?: MaintenanceType;
  notes?: string;
  assignedToId?: string;
}

export interface UpdateMaintenanceInput {
  notes?: string;
  type?: MaintenanceType;
  assignedToId?: string | null;
}
