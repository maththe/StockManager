import { MaintenanceDialogs } from './components/MaintenanceDialogs';
import { MaintenanceDivergenceCard } from './components/MaintenanceDivergenceCard';
import { MaintenanceHeader } from './components/MaintenanceHeader';
import { MaintenanceInfoCard } from './components/MaintenanceInfoCard';
import { MaintenanceNotesCard } from './components/MaintenanceNotesCard';
import { MaintenanceProgress } from './components/MaintenanceProgress';
import {
  MaintenanceDetailsSkeleton,
  MaintenanceNotFound,
} from './components/MaintenanceStates';
import { useMaintenanceDetails } from './utils/useMaintenanceDetails';

export default function MaintenanceDetailsPage() {
  const {
    maintenance,
    users,
    isLoading,
    isActive,
    concluir,
    cancelar,
    update,
    confirmDialog,
    setConfirmDialog,
    cancelDialog,
    setCancelDialog,
    confirmConcluir,
    confirmCancelar,
    editing,
    editType,
    setEditType,
    editAssigned,
    setEditAssigned,
    startEditing,
    cancelEditing,
    saveEdit,
  } = useMaintenanceDetails();

  if (isLoading) return <MaintenanceDetailsSkeleton />;
  if (!maintenance) return <MaintenanceNotFound />;

  return (
    <div className="space-y-6">
      <MaintenanceHeader
        maintenance={maintenance}
        isActive={isActive}
        isConcluding={concluir.isPending}
        isCancelling={cancelar.isPending}
        onConclude={() => setConfirmDialog(true)}
        onCancel={() => setCancelDialog(true)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <MaintenanceInfoCard
          maintenance={maintenance}
          users={users}
          isActive={isActive}
          editing={editing}
          editType={editType}
          editAssigned={editAssigned}
          isSaving={update.isPending}
          onEditTypeChange={setEditType}
          onEditAssignedChange={setEditAssigned}
          onStartEditing={startEditing}
          onCancelEditing={cancelEditing}
          onSave={saveEdit}
        />

        {maintenance.notes && (
          <MaintenanceNotesCard notes={maintenance.notes} />
        )}

        {maintenance.divergence && (
          <MaintenanceDivergenceCard divergence={maintenance.divergence} />
        )}
      </div>

      <MaintenanceProgress status={maintenance.status} />

      <MaintenanceDialogs
        hasDivergence={Boolean(maintenance.divergenceId)}
        confirmOpen={confirmDialog}
        cancelOpen={cancelDialog}
        onConfirmOpenChange={setConfirmDialog}
        onCancelOpenChange={setCancelDialog}
        onConfirmConclude={confirmConcluir}
        onConfirmCancel={confirmCancelar}
      />
    </div>
  );
}
