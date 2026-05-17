import { useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  PackageOpen,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';

import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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
import { useItems } from '~/services/tanStackQuery/Itens/items';
import { useClients } from '~/services/tanStackQuery/clients';
import {
  useCreateRental,
  useRentals,
  useUpdateRental,
} from '~/services/tanStackQuery/rentals';
import type {
  CreateRentalInput,
  Rental,
  RentalStatus,
} from '~/types/rental';

import { RentalCard } from './components/RentalCard';
import { RentalFormDialog } from './components/RentalFormDialog';

const statusFilters: Array<{ value: RentalStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Todos os status' },
  { value: 'DRAFT', label: 'Rascunhos' },
  { value: 'ACTIVE', label: 'Em locação' },
  { value: 'RETURNED', label: 'Devolvidas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

export default function RentalsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RentalStatus | 'ALL'>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);

  const { data: rentals = [], isLoading } = useRentals(search);
  const { data: clients = [] } = useClients();
  const { data: items = [] } = useItems();

  const createRental = useCreateRental();
  const updateRental = useUpdateRental();

  const stats = useMemo(
    () => ({
      total: rentals.length,
      draft: rentals.filter((rental) => rental.status === 'DRAFT').length,
      active: rentals.filter((rental) => rental.status === 'ACTIVE').length,
      returned: rentals.filter((rental) => rental.status === 'RETURNED').length,
    }),
    [rentals],
  );

  const filteredRentals = useMemo(() => {
    if (statusFilter === 'ALL') return rentals;
    return rentals.filter((rental) => rental.status === statusFilter);
  }, [rentals, statusFilter]);

  const handleOpenCreate = () => {
    setEditingRental(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (rental: Rental) => {
    setEditingRental(rental);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: CreateRentalInput) => {
    if (editingRental) {
      await updateRental.mutateAsync({ id: editingRental.id, data });
      return;
    }
    await createRental.mutateAsync(data);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 border-b border-border/40 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Locações</h1>
          <p className="mt-1.5 max-w-xl text-muted-foreground">
            Gerencie o ciclo completo: rascunho, retirada, devolução e cancelamentos.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-primary to-secondary font-medium text-white shadow-md transition-all hover:shadow-lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Nova Locação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total"
          value={stats.total}
          icon={Sparkles}
          tone="muted"
        />
        <StatCard
          label="Rascunhos"
          value={stats.draft}
          icon={PackageOpen}
          tone="secondary"
        />
        <StatCard
          label="Em locação"
          value={stats.active}
          icon={CalendarClock}
          tone="primary"
        />
        <StatCard
          label="Devolvidas"
          value={stats.returned}
          icon={CheckCircle2}
          tone="accent"
        />
      </div>

      {/* List */}
      <Card className="border border-border/50 bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-2xl font-bold">Contratos de locação</CardTitle>
            <CardDescription>
              Acompanhe cada contrato e os itens reservados no estoque.
            </CardDescription>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Buscar por código, cliente ou local..."
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as RentalStatus | 'ALL')
              }
            >
              <SelectTrigger aria-label="Filtrar por status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando locações...
            </div>
          ) : rentals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 py-16 text-center">
              <PackageOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/60" />
              <div className="mb-2 text-lg font-semibold text-foreground">
                Nenhuma locação cadastrada
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Crie a primeira locação para começar a controlar contratos e estoque.
              </p>
              <Button
                onClick={handleOpenCreate}
                className="bg-gradient-to-r from-primary to-secondary text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Locação
              </Button>
            </div>
          ) : filteredRentals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
              Nenhuma locação encontrada com os filtros atuais.
            </div>
          ) : (
            filteredRentals.map((rental) => (
              <RentalCard
                key={rental.id}
                rental={rental}
                inventoryItems={items}
                onEdit={handleOpenEdit}
              />
            ))
          )}
        </CardContent>
      </Card>

      <RentalFormDialog
        open={dialogOpen}
        rental={editingRental}
        clients={clients}
        isLoading={createRental.isPending || updateRental.isPending}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingRental(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

const toneStyles: Record<string, string> = {
  muted: 'border-border/60 bg-gradient-to-br from-card to-muted/30 text-foreground',
  primary:
    'border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 text-primary',
  secondary:
    'border-secondary/30 bg-gradient-to-br from-secondary/10 to-secondary/5 text-secondary',
  accent:
    'border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 text-accent',
};

interface StatCardProps {
  label: string;
  value: number;
  icon: typeof PackageOpen;
  tone: 'muted' | 'primary' | 'secondary' | 'accent';
}

function StatCard({ label, value, icon: Icon, tone }: StatCardProps) {
  return (
    <Card className={`${toneStyles[tone]} shadow-sm`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-semibold uppercase tracking-wider">
            {label}
          </CardDescription>
          <Icon className="h-4 w-4 opacity-70" />
        </div>
        <CardTitle className="mt-2 text-3xl font-bold">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
