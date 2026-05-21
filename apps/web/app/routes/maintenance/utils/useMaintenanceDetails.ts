import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

import {
  useMaintenance,
  useConcluirMaintenance,
  useCancelarMaintenance,
  useUpdateMaintenance,
} from '~/services/tanStackQuery/maintenance';
import { useUsers } from '~/services/tanStackQuery/users';
import type { MaintenanceType } from '~/types/maintenance';

import { UNASSIGNED } from './constants';

export function useMaintenanceDetails() {
  const { maintenanceId } = useParams<{ maintenanceId: string }>();
  const { data: maintenance, isLoading } = useMaintenance(maintenanceId ?? '');
  const { data: users = [] } = useUsers();

  const concluir = useConcluirMaintenance();
  const cancelar = useCancelarMaintenance();
  const update = useUpdateMaintenance();

  const [confirmDialog, setConfirmDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editType, setEditType] = useState<MaintenanceType>('OUTRA');
  const [editAssigned, setEditAssigned] = useState<string>(UNASSIGNED);

  useEffect(() => {
    if (maintenance) {
      setEditType(maintenance.type);
      setEditAssigned(maintenance.assignedTo?.id ?? UNASSIGNED);
    }
  }, [maintenance]);

  const isActive =
    maintenance?.status === 'PENDENTE' ||
    maintenance?.status === 'EM_ANDAMENTO';

  const startEditing = () => setEditing(true);

  const cancelEditing = () => {
    if (maintenance) {
      setEditType(maintenance.type);
      setEditAssigned(maintenance.assignedTo?.id ?? UNASSIGNED);
    }
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!maintenance) return;
    await update.mutateAsync({
      id: maintenance.id,
      data: {
        type: editType,
        assignedToId: editAssigned === UNASSIGNED ? null : editAssigned,
      },
    });
    setEditing(false);
  };

  const confirmConcluir = async () => {
    if (!maintenance) return;
    await concluir.mutateAsync(maintenance.id);
    setConfirmDialog(false);
  };

  const confirmCancelar = async () => {
    if (!maintenance) return;
    await cancelar.mutateAsync(maintenance.id);
    setCancelDialog(false);
  };

  return {
    maintenance,
    users,
    isLoading,
    isActive,
    // mutations
    concluir,
    cancelar,
    update,
    // dialogs
    confirmDialog,
    setConfirmDialog,
    cancelDialog,
    setCancelDialog,
    confirmConcluir,
    confirmCancelar,
    // edição
    editing,
    editType,
    setEditType,
    editAssigned,
    setEditAssigned,
    startEditing,
    cancelEditing,
    saveEdit,
  };
}
