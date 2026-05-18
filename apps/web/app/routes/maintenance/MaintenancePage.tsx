import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Plus,
  Settings,
  Timer,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { useMaintenances, useCreateMaintenance } from '~/services/tanStackQuery/maintenance';
import { useItems } from '~/services/tanStackQuery/Itens/items';
import type { Maintenance, MaintenanceStatus } from '~/types/maintenance';
import { MaintenanceFormDialog } from './components/MaintenanceFormDialog';

const statusLabel: Record<MaintenanceStatus, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

const statusClassName: Record<MaintenanceStatus, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  CONCLUIDA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELADA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function MaintenanceCard({ maintenance }: { maintenance: Maintenance }) {
  return (
    <Link to={`/dashboard/maintenance/${maintenance.id}`}>
      <Card className="cursor-pointer border-border/60 transition-all hover:border-primary/40 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  {maintenance.code}
                </span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClassName[maintenance.status]}`}>
                  {statusLabel[maintenance.status]}
                </span>
                {maintenance.divergenceId && (
                  <span className="inline-flex rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-xs text-orange-700 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                    via divergência
                  </span>
                )}
              </div>
              <CardTitle className="mt-1 truncate text-base">
                {maintenance.item?.name ?? '—'}
              </CardTitle>
            </div>
            <Settings className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{maintenance.quantity} unidade(s)</span>
            {maintenance.assignedTo && (
              <span className="truncate text-xs">{maintenance.assignedTo.name}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function MaintenancePage() {
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'ALL'>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: maintenances = [], isLoading } = useMaintenances();
  const { data: items = [] } = useItems();
  const createMaintenance = useCreateMaintenance();

  const stats = useMemo(
    () => ({
      total: maintenances.length,
      pendente: maintenances.filter((m) => m.status === 'PENDENTE').length,
      emAndamento: maintenances.filter((m) => m.status === 'EM_ANDAMENTO').length,
      concluida: maintenances.filter((m) => m.status === 'CONCLUIDA').length,
    }),
    [maintenances],
  );

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return maintenances;
    return maintenances.filter((m) => m.status === statusFilter);
  }, [maintenances, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manutenções</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe reparos de itens avariados ou fora de serviço.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova manutenção
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Settings className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800/40 dark:bg-yellow-900/10">
          <CardContent className="flex items-center gap-3 p-4">
            <Timer className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pendente}</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800/40 dark:bg-blue-900/10">
          <CardContent className="flex items-center gap-3 p-4">
            <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.emAndamento}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Em andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-900/10">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.concluida}</p>
              <p className="text-xs text-green-600 dark:text-green-400">Concluídas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as MaintenanceStatus | 'ALL')}
        >
          <SelectTrigger className="w-48 border-border/60">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            <SelectItem value="PENDENTE">Pendentes</SelectItem>
            <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
            <SelectItem value="CONCLUIDA">Concluídas</SelectItem>
            <SelectItem value="CANCELADA">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} manutenção(ões)</span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Settings className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <CardTitle className="text-muted-foreground">Nenhuma manutenção encontrada</CardTitle>
              <CardDescription className="mt-1">
                Manutenções são criadas automaticamente ao resolver divergências com avarias, ou manualmente aqui.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MaintenanceCard key={m.id} maintenance={m} />
          ))}
        </div>
      )}

      <MaintenanceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        items={items}
        onSubmit={async (data) => {
          await createMaintenance.mutateAsync(data);
          setDialogOpen(false);
        }}
        isSubmitting={createMaintenance.isPending}
      />
    </div>
  );
}
