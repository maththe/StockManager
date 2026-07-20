import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  PackageX,
  Settings,
} from 'lucide-react';
import { Link, useParams } from 'react-router';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { getCurrentUser, hasRole } from '~/services/auth/currentUser';
import {
  useDivergence,
  useResolverDivergencia,
} from '~/services/tanStackQuery/divergences';
import {
  SOURCE_LABEL,
  STATUS_CLASS,
  STATUS_LABEL,
  TYPE_LABEL,
  formatDateTime,
} from './labels';

const sourceLink = (source: string, sourceId?: string) => {
  if (!sourceId) return null;
  if (source === 'EVENT') return `/dashboard/events/${sourceId}`;
  if (source === 'RENTAL') return `/dashboard/rentals/${sourceId}`;
  return null;
};

export default function DivergenceDetailsPage() {
  const { divergenceId = '' } = useParams();
  const { data: divergence, isLoading } = useDivergence(divergenceId);
  const resolver = useResolverDivergencia();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canResolve = hasRole(getCurrentUser(), 'ADMIN', 'DECORADOR');

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!divergence) {
    return (
      <Card className="border-border/60">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <CardTitle className="text-muted-foreground">
              Divergência não encontrada
            </CardTitle>
            <CardDescription className="mt-1">
              Ela pode ter sido removida ou o endereço está incorreto.
            </CardDescription>
          </div>
          <Link to="/dashboard/divergences">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para divergências
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const originLink = sourceLink(divergence.source, divergence.sourceId);
  const isPending = divergence.status === 'PENDING';
  const hasDamaged = divergence.items.some((item) => item.type === 'DAMAGED');

  const handleResolve = async () => {
    await resolver.mutateAsync(divergence.id);
    setConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-5 py-6 shadow-sm">
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link
            to="/dashboard/divergences"
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Divergências
          </Link>
          <span aria-hidden>/</span>
          <span className="font-medium text-foreground">Detalhes</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[divergence.status]}`}
              >
                {isPending ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {STATUS_LABEL[divergence.status]}
              </span>
              <span className="inline-flex rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground">
                Origem: {SOURCE_LABEL[divergence.source] ?? divergence.source}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Divergência de estoque
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Registrada em {formatDateTime(divergence.occurredAt)}
              {divergence.createdBy && ` por ${divergence.createdBy.name}`}
            </p>
            {!isPending && (
              <p className="mt-1 text-sm text-muted-foreground">
                Resolvida em {formatDateTime(divergence.resolvedAt)}
                {divergence.resolvedBy && ` por ${divergence.resolvedBy.name}`}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {originLink && (
              <Link to={originLink}>
                <Button variant="outline" size="sm">
                  Ver {SOURCE_LABEL[divergence.source]?.toLowerCase()}
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            {isPending &&
              (canResolve ? (
                <Button
                  size="sm"
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={() => setConfirmOpen(true)}
                  disabled={resolver.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Resolver divergência
                </Button>
              ) : (
                <p className="max-w-52 text-right text-xs text-muted-foreground">
                  Aguardando resolução por um administrador ou decorador.
                </p>
              ))}
          </div>
        </div>
      </div>

      {/* Observações */}
      {divergence.notes && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {divergence.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Itens */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Itens da divergência</CardTitle>
          <CardDescription>
            Unidades faltantes ou avariadas apontadas na conferência.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {divergence.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{item.item.name}</p>
                {item.notes && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.notes}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  item.type === 'MISSING'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                }`}
              >
                {item.type === 'MISSING' ? (
                  <PackageX className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                {TYPE_LABEL[item.type]}
                <span className="tabular-nums">{item.quantity}</span>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Manutenções geradas */}
      {(divergence.maintenances?.length ?? 0) > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Manutenções geradas</CardTitle>
            <CardDescription>
              Ordens de reparo criadas ao resolver esta divergência.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {divergence.maintenances!.map((maintenance) => (
              <Link
                key={maintenance.id}
                to={`/dashboard/maintenance/${maintenance.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  {maintenance.code}
                </span>
                <span className="inline-flex rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                  {maintenance.status}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Confirmação de resolução */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolver divergência?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasDamaged
                ? 'Os itens avariados gerarão ordens de manutenção automaticamente e o estoque será reposto quando cada reparo for concluído. '
                : ''}
              Esta ação registra a divergência como resolvida e não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resolver.isPending}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={(event) => {
                event.preventDefault();
                void handleResolve();
              }}
              disabled={resolver.isPending}
            >
              {resolver.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar resolução
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
