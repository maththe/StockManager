import { Pencil } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  MAINTENANCE_TYPES,
  MAINTENANCE_TYPE_LABEL,
  type Maintenance,
  type MaintenanceType,
} from '~/types/maintenance';
import type { User } from '~/types/user';

import { UNASSIGNED } from '../utils/constants';

interface InfoRowProps {
  label: string;
  children: React.ReactNode;
}

function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

interface MaintenanceInfoCardProps {
  maintenance: Maintenance;
  users: User[];
  isActive: boolean;
  editing: boolean;
  editType: MaintenanceType;
  editAssigned: string;
  isSaving: boolean;
  onEditTypeChange: (value: MaintenanceType) => void;
  onEditAssignedChange: (value: string) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSave: () => void;
}

export function MaintenanceInfoCard({
  maintenance,
  users,
  isActive,
  editing,
  editType,
  editAssigned,
  isSaving,
  onEditTypeChange,
  onEditAssignedChange,
  onStartEditing,
  onCancelEditing,
  onSave,
}: MaintenanceInfoCardProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Informações</CardTitle>
        {isActive && !editing && (
          <Button variant="ghost" size="sm" onClick={onStartEditing}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Editar
          </Button>
        )}
      </CardHeader>
      <CardContent className="text-sm">
        <InfoRow label="Item">
          <span className="font-medium">{maintenance.item?.name}</span>
        </InfoRow>
        <InfoRow label="Quantidade">
          <span className="font-medium tabular-nums">
            {maintenance.quantity}
          </span>
        </InfoRow>

        <InfoRow label="Tipo">
          {editing ? (
            <Select
              value={editType}
              onValueChange={(v) => onEditTypeChange(v as MaintenanceType)}
            >
              <SelectTrigger className="h-8 w-44 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {MAINTENANCE_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="font-medium">
              {MAINTENANCE_TYPE_LABEL[maintenance.type]}
            </span>
          )}
        </InfoRow>

        <InfoRow label="Responsável">
          {editing ? (
            <Select value={editAssigned} onValueChange={onEditAssignedChange}>
              <SelectTrigger className="h-8 w-44 border-border/60">
                <SelectValue placeholder="Sem responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Sem responsável</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="font-medium">
              {maintenance.assignedTo?.name ?? '—'}
            </span>
          )}
        </InfoRow>

        <InfoRow label="Criado por">
          <span className="font-medium">
            {maintenance.createdBy?.name ?? '—'}
          </span>
        </InfoRow>

        {maintenance.completedAt && (
          <InfoRow label="Concluída em">
            <span className="font-medium">
              {new Date(maintenance.completedAt).toLocaleDateString('pt-BR')}
            </span>
          </InfoRow>
        )}

        {editing && (
          <div className="flex justify-end gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelEditing}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
