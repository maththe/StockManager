import { useMemo, useState } from 'react';
import {
  ClipboardList,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  PackageMinus,
  PackagePlus,
} from 'lucide-react';
import { Link } from 'react-router';

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
import { useTasks } from '~/services/tanStackQuery/tasks';
import type { Task, TaskStatus, TaskType } from '~/types/task';

const statusLabel: Record<TaskStatus, string> = {
  PENDENTE: 'Pendente',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

const statusClassName: Record<TaskStatus, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CONCLUIDA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELADA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const typeLabel: Record<TaskType, string> = {
  SAIDA_GALPAO: 'Saída do galpão',
  ENTRADA_GALPAO: 'Entrada no galpão',
};

const typeClassName: Record<TaskType, string> = {
  SAIDA_GALPAO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  ENTRADA_GALPAO: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

function TaskCard({ task }: { task: Task }) {
  const totalItems = task.taskItems?.length ?? 0;
  const confirmedItems = task.taskItems?.filter((ti) => ti.confirmed).length ?? 0;
  const TypeIcon = task.type === 'ENTRADA_GALPAO' ? PackagePlus : PackageMinus;

  return (
    <Link to={`/dashboard/tasks/${task.id}`}>
      <Card className="cursor-pointer border-border/60 transition-all hover:border-primary/40 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  {task.code}
                </span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${typeClassName[task.type]}`}>
                  {typeLabel[task.type]}
                </span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClassName[task.status]}`}>
                  {statusLabel[task.status]}
                </span>
              </div>
              <CardTitle className="mt-1 truncate text-base">
                {task.event?.eventName ?? '—'}
              </CardTitle>
            </div>
            <TypeIcon className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {confirmedItems}/{totalItems} itens confirmados
            </span>
            {task.assignedTo && (
              <span className="truncate text-xs">{task.assignedTo.name}</span>
            )}
          </div>
          {task.completedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Concluída em {new Date(task.completedAt).toLocaleDateString('pt-BR')}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'ALL'>('ALL');

  const { data: tasks = [], isLoading } = useTasks();

  const stats = useMemo(
    () => ({
      total: tasks.length,
      pendente: tasks.filter((t) => t.status === 'PENDENTE').length,
      concluida: tasks.filter((t) => t.status === 'CONCLUIDA').length,
      cancelada: tasks.filter((t) => t.status === 'CANCELADA').length,
    }),
    [tasks],
  );

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarefas do Galpão</h1>
          <p className="text-sm text-muted-foreground">
            Confirmações de saída e entrada de itens do galpão para eventos.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800/40 dark:bg-yellow-900/10">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pendente}</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">Pendentes</p>
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
        <Card className="border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/10">
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-300">{stats.cancelada}</p>
              <p className="text-xs text-red-500 dark:text-red-400">Canceladas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as TaskType | 'ALL')}
        >
          <SelectTrigger className="w-56 border-border/60">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os tipos</SelectItem>
            <SelectItem value="SAIDA_GALPAO">Saída do galpão</SelectItem>
            <SelectItem value="ENTRADA_GALPAO">Entrada no galpão</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as TaskStatus | 'ALL')}
        >
          <SelectTrigger className="w-48 border-border/60">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            <SelectItem value="PENDENTE">Pendentes</SelectItem>
            <SelectItem value="CONCLUIDA">Concluídas</SelectItem>
            <SelectItem value="CANCELADA">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} tarefa(s)</span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <CardTitle className="text-muted-foreground">Nenhuma tarefa encontrada</CardTitle>
              <CardDescription className="mt-1">
                As tarefas são criadas automaticamente quando um evento inicia.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
