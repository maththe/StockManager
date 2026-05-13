import { type FormEvent, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Edit2,
  Loader2,
  PackagePlus,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

import { InputDate } from '~/components/Form/InputDate';
import { InputForm } from '~/components/Form/InputForm';
import { SelectForm } from '~/components/Form/SelectForm';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import { useItems } from '~/services/tanStackQuery/Itens/items';
import { useClients } from '~/services/tanStackQuery/clients';
import {
  useCancelRental,
  useCreateRental,
  useCreateRentalItem,
  useDeleteRental,
  useDeleteRentalItem,
  useRentals,
  useReturnRental,
  useUpdateRental,
  useUpdateRentalItem,
} from '~/services/tanStackQuery/rentals';
import type {
  CreateRentalInput,
  Rental,
  RentalItem,
  RentalStatus,
} from '~/types/rental';

const statusOptions: Array<{ value: RentalStatus; label: string }> = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'ACTIVE', label: 'Ativa' },
  { value: 'RETURNED', label: 'Devolvida' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

const statusLabel: Record<RentalStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativa',
  RETURNED: 'Devolvida',
  CANCELLED: 'Cancelada',
};

const statusClassName: Record<RentalStatus, string> = {
  DRAFT: 'bg-secondary/10 text-secondary ring-1 ring-secondary/30',
  ACTIVE: 'bg-primary/10 text-primary ring-1 ring-primary/30',
  RETURNED: 'bg-accent/10 text-accent ring-1 ring-accent/30',
  CANCELLED: 'bg-destructive/10 text-destructive ring-1 ring-destructive/30',
};

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const toIsoString = (value: string) => new Date(value).toISOString();

const formatDate = (value?: string | null) => {
  if (!value) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

interface RentalFormDialogProps {
  open: boolean;
  rental: Rental | null;
  clients: Array<{ id: string; companyName: string }>;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRentalInput) => Promise<void>;
}

function RentalFormDialog({
  open,
  rental,
  clients,
  isLoading,
  onOpenChange,
  onSubmit,
}: RentalFormDialogProps) {
  const form = useForm<CreateRentalInput>({
    values: rental
      ? {
          rentalCode: rental.rentalCode,
          startDate: toDateTimeLocal(rental.startDate),
          expectedReturn: toDateTimeLocal(rental.expectedReturn),
          location: rental.location ?? '',
          notes: rental.notes ?? '',
          status: rental.status,
          clientId: rental.clientId,
        }
      : {
          rentalCode: '',
          startDate: '',
          expectedReturn: '',
          location: '',
          notes: '',
          status: 'DRAFT',
          clientId: '',
        },
  });

  const handleSubmit = async (data: CreateRentalInput) => {
    await onSubmit({
      ...data,
      startDate: toIsoString(data.startDate),
      expectedReturn: toIsoString(data.expectedReturn),
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl bg-card/75 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>{rental ? 'Editar Locação' : 'Nova Locação'}</DialogTitle>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-4 py-2">
            <div className="grid gap-4 md:grid-cols-2">
              <InputForm name="rentalCode" label="Código" placeholder="Ex: LOC-0001" required />
              <SelectForm
                name="clientId"
                label="Cliente"
                options={clients.map((client) => ({ value: client.id, label: client.companyName }))}
                placeholder="Selecione um cliente"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InputDate name="startDate" label="Início" required />
              <InputDate name="expectedReturn" label="Devolução prevista" required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InputForm name="location" label="Local" placeholder="Local de uso/entrega" />
              <SelectForm name="status" label="Status" options={statusOptions} required />
            </div>

            <InputForm name="notes" label="Observações" placeholder="Condições, contato de retirada, detalhes extras" />

            <DialogFooter className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-secondary text-white" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {rental ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

interface RentalItemFormProps {
  rental: Rental;
  items: Array<{ id: string; name: string; availableQuantity: number }>;
}

function RentalItemForm({ rental, items }: RentalItemFormProps) {
  const createRentalItem = useCreateRentalItem();
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const isClosed = rental.status === 'CANCELLED' || rental.status === 'RETURNED';

  const availableItems = useMemo(() => {
    const selectedIds = new Set(rental.rentalItems.map((rentalItem) => rentalItem.itemId));
    return items.filter((item) => !selectedIds.has(item.id));
  }, [items, rental.rentalItems]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!itemId) return;
    await createRentalItem.mutateAsync({ rentalId: rental.id, data: { itemId, quantity: Number(quantity) } });
    setItemId('');
    setQuantity(1);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-2 rounded-xl border bg-muted/20 p-3 md:grid-cols-[1fr_120px_auto]">
      <select
        className="rounded-md border bg-background px-3 py-2 text-sm"
        value={itemId}
        onChange={(event) => setItemId(event.target.value)}
        disabled={isClosed || createRentalItem.isPending}
        required
      >
        <option value="">Selecione um item</option>
        {availableItems.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} ({item.availableQuantity} disp.)
          </option>
        ))}
      </select>
      <Input
        min={1}
        type="number"
        value={quantity}
        onChange={(event) => setQuantity(Number(event.target.value))}
        disabled={isClosed || createRentalItem.isPending}
        required
      />
      <Button type="submit" disabled={isClosed || createRentalItem.isPending || !itemId}>
        {createRentalItem.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
        Adicionar
      </Button>
    </form>
  );
}

function RentalItemRow({ rental, rentalItem }: { rental: Rental; rentalItem: RentalItem }) {
  const updateRentalItem = useUpdateRentalItem();
  const deleteRentalItem = useDeleteRentalItem();
  const [quantity, setQuantity] = useState(rentalItem.quantity);
  const [returnedQuantity, setReturnedQuantity] = useState(rentalItem.returnedQuantity);
  const isClosed = rental.status === 'CANCELLED' || rental.status === 'RETURNED';

  const save = () =>
    updateRentalItem.mutate({
      rentalId: rental.id,
      rentalItemId: rentalItem.id,
      data: { quantity: Number(quantity), returnedQuantity: Number(returnedQuantity) },
    });

  return (
    <div className="grid gap-2 rounded-lg border bg-background/70 p-3 md:grid-cols-[1fr_100px_100px_auto] md:items-center">
      <div>
        <p className="font-medium text-foreground">{rentalItem.item.name}</p>
        <p className="text-xs text-muted-foreground">Disponível agora: {rentalItem.item.availableQuantity}</p>
      </div>
      <Input min={1} type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} disabled={isClosed} />
      <Input min={0} max={quantity} type="number" value={returnedQuantity} onChange={(event) => setReturnedQuantity(Number(event.target.value))} disabled={isClosed} />
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={save} disabled={isClosed || updateRentalItem.isPending}>
          Salvar
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={() => deleteRentalItem.mutate({ rentalId: rental.id, rentalItemId: rentalItem.id })}
          disabled={isClosed || deleteRentalItem.isPending}
          aria-label="Remover item"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function RentalsPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const { data: rentals = [], isLoading } = useRentals(search);
  const { data: clients = [] } = useClients();
  const { data: items = [] } = useItems();
  const createRental = useCreateRental();
  const updateRental = useUpdateRental();
  const deleteRental = useDeleteRental();
  const cancelRental = useCancelRental();
  const returnRental = useReturnRental();

  const handleOpenCreate = () => {
    setEditingRental(null);
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Locações</h1>
          <p className="text-muted-foreground">Gerencie contratos de locação e os itens reservados no estoque.</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-gradient-to-r from-primary to-secondary text-white">
          <Plus className="mr-2 h-4 w-4" />
          Nova Locação
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Locações de itens</CardTitle>
          <CardDescription>Acompanhe retirada, devolução e movimentação de estoque.</CardDescription>
          <div className="relative max-w-md pt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por código, cliente ou local" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando locações...
            </div>
          ) : rentals.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">Nenhuma locação encontrada.</div>
          ) : (
            rentals.map((rental) => (
              <Card key={rental.id} className="border-muted/70 bg-card/60">
                <CardHeader className="space-y-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
                        {rental.rentalCode}
                        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', statusClassName[rental.status])}>
                          {statusLabel[rental.status]}
                        </span>
                      </CardTitle>
                      <CardDescription>{rental.client.companyName}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditingRental(rental); setDialogOpen(true); }}>
                        <Edit2 className="mr-2 h-4 w-4" /> Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => returnRental.mutate(rental.id)} disabled={rental.status === 'RETURNED' || rental.status === 'CANCELLED'}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Devolver
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => cancelRental.mutate(rental.id)} disabled={rental.status === 'RETURNED' || rental.status === 'CANCELLED'}>
                        <Ban className="mr-2 h-4 w-4" /> Cancelar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteRental.mutate(rental.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remover
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                    <span className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Início: {formatDate(rental.startDate)}</span>
                    <span>Prevista: {formatDate(rental.expectedReturn)}</span>
                    <span>Local: {rental.location || 'Não informado'}</span>
                  </div>
                  {rental.notes && <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">{rental.notes}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <RentalItemForm rental={rental} items={items} />
                  <div className="space-y-2">
                    {rental.rentalItems.length === 0 ? (
                      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Nenhum item adicionado.</p>
                    ) : (
                      rental.rentalItems.map((rentalItem) => <RentalItemRow key={rentalItem.id} rental={rental} rentalItem={rentalItem} />)
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <RentalFormDialog
        open={dialogOpen}
        rental={editingRental}
        clients={clients}
        isLoading={createRental.isPending || updateRental.isPending}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
