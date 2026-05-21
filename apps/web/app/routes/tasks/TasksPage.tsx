import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  PackageMinus,
  PackagePlus,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { useTasks } from '~/services/tanStackQuery/tasks';
import type { Task, TaskStatus, TaskType } from '~/types/task';

const statusLabel: Record<TaskStatus, string> = {
  PENDENTE: 'Pendente',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

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

function TaskCard({ task }: { task: Task }) {
  const totalItems = task.taskItems?.length ?? 0;
  const confirmedItems =
    task.taskItems?.filter((ti) => ti.confirmed).length ?? 0;
  const progress =
    totalItems > 0 ? Math.round((confirmedItems / totalItems) * 100) : 0;
  const TypeIcon = task.type === 'ENTRADA_GALPAO' ? PackagePlus : PackageMinus;

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

        <CardHeader className="pb-3 pl-5">
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
                {task.event?.eventName ?? '—'}
              </CardTitle>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 -translate-x-1 text-muted-foreground/0 transition-all group-hover:translate-x-0 group-hover:text-primary" />
          </div>
        </CardHeader>

        <CardContent className="pl-5 pt-0">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {confirmedItems}/{totalItems} itens confirmados
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
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
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
            {task.completedAt && (
              <span className="shrink-0">
                {new Date(task.completedAt).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TaskCardSkeleton() {
  return (
    <Card className="h-full border-border/60">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-4 w-14 animate-pulse rounded bg-muted" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="mt-2 h-5 w-3/4 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-muted" />
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

  const grouped: Record<TaskStatus, Task[]> = {
    PENDENTE: [],
    CONCLUIDA: [],
    CANCELADA: [],
  };
  for (const task of tasks) {
    grouped[task.status]?.push(task);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tarefas do Galpão</h1>
        <p className="text-sm text-muted-foreground">
          Confirmações de saída e entrada de itens do galpão para eventos.
        </p>
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
                As tarefas são criadas automaticamente quando um evento inicia.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      ) : (
        sectionConfig.map(({ status, title, icon, accentText, emptyHint }) => (
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
        ))
      )}
    </div>
  );
}