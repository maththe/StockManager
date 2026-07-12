import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  PackageMinus,
  PackageOpen,
  PackagePlus,
  Search,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router';

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { StatCard } from '~/components/StatCard';
import { matchesSearch } from '~/lib/search';
import { useTasks } from '~/services/tanStackQuery/tasks';
import type { Task, TaskStatus, TaskType } from '~/types/task';
import { getTaskSource } from './task-helpers';

const statusDot: Record<TaskStatus, string> = {
  PENDENTE: 'bg-yellow-500',
  CONCLUIDA: 'bg-green-500',
  CANCELADA: 'bg-red-500',
};

const typeLabel: Record<TaskType, string> = {
  SAIDA_GALPAO: 'Saída do galpão',
  ENTRADA_GALPAO: 'Entrada no galpão',
};

const typeClassName: Record<TaskType, string> = {
  SAIDA_GALPAO:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  ENTRADA_GALPAO:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

const progressColor: Record<TaskStatus, string> = {
  PENDENTE: 'bg-yellow-500',
  CONCLUIDA: 'bg-green-500',
  CANCELADA: 'bg-red-400',
};

type TypeFilter = TaskType | 'ALL';
type OriginFilter = 'ALL' | 'EVENT' | 'RENTAL';

const typeFilters: Array<{ value: TypeFilter; label: string }> = [
  { value: 'ALL', label: 'Todos os tipos' },
  { value: 'SAIDA_GALPAO', label: 'Saída do galpão' },
  { value: 'ENTRADA_GALPAO', label: 'Entrada no galpão' },
];

const originFilters: Array<{ value: OriginFilter; label: string }> = [
  { value: 'ALL', label: 'Todas as origens' },
  { value: 'EVENT', label: 'Eventos' },
  { value: 'RENTAL', label: 'Locações' },
];

// Ordem e metadados das seções. Pendentes primeiro: é o que demanda ação.
const sectionConfig: {
  status: TaskStatus;
  title: string;
  icon: typeof Clock;
  accentText: string;
  emptyHint: string;
}[] = [
  {
    status: 'PENDENTE',
    title: 'Pendentes',
    icon: Clock,
    accentText: 'text-yellow-600 dark:text-yellow-400',
    emptyHint: 'Nenhuma tarefa pendente no momento.',
  },
  {
    status: 'CONCLUIDA',
    title: 'Concluídas',
    icon: CheckCircle2,
    accentText: 'text-green-600 dark:text-green-400',
    emptyHint: 'Nenhuma tarefa concluída ainda.',
  },
  {
    status: 'CANCELADA',
    title: 'Canceladas',
    icon: XCircle,
    accentText: 'text-red-500 dark:text-red-400',
    emptyHint: 'Nenhuma tarefa cancelada.',
  },
];

const formatTaskDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(
    new Date(value),
  );

function TaskCard({ task }: { task: Task }) {
  const totalItems = task.taskItems?.length ?? 0;
  const totalUnits =
    task.taskItems?.reduce((sum, ti) => sum + ti.requestedQuantity, 0) ?? 0;
  const confirmedItems =
    task.taskItems?.filter((ti) => ti.confirmed).length ?? 0;
  const progress =
    totalItems > 0 ? Math.round((confirmedItems / totalItems) * 100) : 0;
  const TypeIcon = task.type === 'ENTRADA_GALPAO' ? PackagePlus : PackageMinus;
  const isRental = Boolean(task.rentalId ?? task.rental);
  const OriginIcon = isRental ? PackageOpen : CalendarDays;

  return (
    <Link
      to={`/dashboard/tasks/${task.id}`}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="relative h-full cursor-pointer overflow-hidden border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
        <span
          aria-hidden
          className={`absolute inset-y-0 left-0 w-1 ${statusDot[task.status]} opacity-70`}
        />

        <CardContent className="flex h-full flex-col gap-3 p-5 pl-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  {task.code}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${typeClassName[task.type]}`}
                >
                  <TypeIcon className="h-3 w-3" />
                  {typeLabel[task.type]}
                </span>
              </div>
              <CardTitle className="mt-2 truncate text-base transition-colors group-hover:text-primary">
                {getTaskSource(task).label}
              </CardTitle>
              <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                <OriginIcon className="h-3 w-3" />
                {isRental ? 'Locação' : 'Evento'}
              </span>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 -translate-x-1 text-muted-foreground/0 transition-all group-hover:translate-x-0 group-hover:text-primary" />
          </div>

          <div className="mt-auto space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {confirmedItems}/{totalItems} itens confirmados
                {totalUnits > 0 && (
                  <span className="text-muted-foreground/70">
                    {' '}
                    · {totalUnits} un.
                  </span>
                )}
              </span>
              <span className="font-medium tabular-nums text-foreground">
                {progress}%
              </span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColor[task.status]}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1.5 text-xs text-muted-foreground">
              {task.assignedTo ? (
                <span className="inline-flex items-center gap-1.5 truncate">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold uppercase text-primary">
                    {task.assignedTo.name.charAt(0)}
                  </span>
                  <span className="truncate">{task.assignedTo.name}</span>
                </span>
              ) : (
                <span className="italic text-muted-foreground/60">
                  Sem responsável
                </span>
              )}
              <span className="shrink-0" title="Criada em">
                {task.completedAt
                  ? `Concluída em ${formatTaskDate(task.completedAt)}`
                  : formatTaskDate(task.createdAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TaskCardSkeleton() {
  return (
    <Card className="h-full border-border/60">
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-4 w-14 animate-pulse rounded bg-muted" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

function StatusSection({
  title,
  icon: Icon,
  accentText,
  count,
  emptyHint,
  children,
}: {
  title: string;
  icon: typeof Clock;
  accentText: string;
  count: number;
  emptyHint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <Icon className={`h-5 w-5 ${accentText}`} />
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <span className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold tabular-nums text-muted-foreground">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="py-4 text-sm text-muted-foreground/70">{emptyHint}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children}
        </div>
      )}
    </section>
  );
}

export default function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [originFilter, setOriginFilter] = useState<OriginFilter>('ALL');

  const stats = useMemo(
    () => ({
      total: tasks.length,
      pending: tasks.filter((task) => task.status === 'PENDENTE').length,
      completed: tasks.filter((task) => task.status === 'CONCLUIDA').length,
      cancelled: tasks.filter((task) => task.status === 'CANCELADA').length,
    }),
    [tasks],
  );

  const hasActiveFilters =
    Boolean(search.trim()) || typeFilter !== 'ALL' || originFilter !== 'ALL';

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (typeFilter !== 'ALL' && task.type !== typeFilter) return false;

        const isRental = Boolean(task.rentalId ?? task.rental);
        if (originFilter === 'EVENT' && isRental) return false;
        if (originFilter === 'RENTAL' && !isRental) return false;

        return matchesSearch(
          [
            task.code,
            getTaskSource(task).label,
            task.assignedTo?.name,
            task.notes,
          ],
          search,
        );
      }),
    [tasks, search, typeFilter, originFilter],
  );

  const grouped = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      PENDENTE: [],
      CONCLUIDA: [],
      CANCELADA: [],
    };
    for (const task of filteredTasks) {
      groups[task.status]?.push(task);
    }
    return groups;
  }, [filteredTasks]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="border-b border-border/40 pb-5">
        <h1 className="text-3xl font-bold text-foreground">
          Tarefas do Galpão
        </h1>
        <p className="mt-1.5 max-w-xl text-muted-foreground">
          Confirmações de saída e entrada de itens do galpão para eventos e
          locações.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total"
          value={stats.total}
          icon={ClipboardList}
          tone="muted"
        />
        <StatCard
          label="Pendentes"
          value={stats.pending}
          icon={Clock}
          tone="primary"
        />
        <StatCard
          label="Concluídas"
          value={stats.completed}
          icon={CheckCircle2}
          tone="accent"
        />
        <StatCard
          label="Canceladas"
          value={stats.cancelled}
          icon={XCircle}
          tone="secondary"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_190px_190px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            placeholder="Buscar por código, evento, locação ou responsável..."
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as TypeFilter)}
        >
          <SelectTrigger aria-label="Filtrar por tipo">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {typeFilters.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={originFilter}
          onValueChange={(value) => setOriginFilter(value as OriginFilter)}
        >
          <SelectTrigger aria-label="Filtrar por origem">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            {originFilters.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <TaskCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/50">
              <ClipboardList className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div>
              <CardTitle className="text-muted-foreground">
                Nenhuma tarefa encontrada
              </CardTitle>
              <CardDescription className="mt-1">
                As tarefas são criadas ao iniciar um evento ou ao gerar a
                tarefa de galpão de uma locação.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 py-12 text-center">
          <div className="text-sm text-muted-foreground">
            Nenhuma tarefa encontrada com os filtros atuais.
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setTypeFilter('ALL');
              setOriginFilter('ALL');
            }}
            className="mt-3 rounded-md text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        sectionConfig.map(({ status, title, icon, accentText, emptyHint }) => {
          // Com filtros ativos, seções vazias só adicionam ruído
          if (hasActiveFilters && grouped[status].length === 0) return null;

          return (
            <StatusSection
              key={status}
              title={title}
              icon={icon}
              accentText={accentText}
              count={grouped[status].length}
              emptyHint={emptyHint}
            >
              {grouped[status].map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </StatusSection>
          );
        })
      )}
    </div>
  );
}
