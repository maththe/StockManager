import { useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { useUsers } from '~/services/tanStackQuery/users';
import type { Item } from '~/types/item';
import {
  MAINTENANCE_TYPES,
  MAINTENANCE_TYPE_LABEL,
  type CreateMaintenanceInput,
  type MaintenanceType,
} from '~/types/maintenance';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Item[];
  onSubmit: (data: CreateMaintenanceInput) => Promise<void>;
  isSubmitting: boolean;
}

const UNASSIGNED = '__unassigned__';

export function MaintenanceFormDialog({ open, onOpenChange, items, onSubmit, isSubmitting }: Props) {
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState<MaintenanceType>('REPARO');
  const [assignedToId, setAssignedToId] = useState<string>(UNASSIGNED);
  const [notes, setNotes] = useState('');

  const { data: users = [] } = useUsers();
  const selectedItem = items.find((i) => i.id === itemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || quantity <= 0) return;
    await onSubmit({
      itemId,
      quantity,
      type,
      notes: notes || undefined,
      assignedToId: assignedToId === UNASSIGNED ? undefined : assignedToId,
    });
    setItemId('');
    setQuantity(1);
    setType('REPARO');
    setAssignedToId(UNASSIGNED);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova manutenção</DialogTitle>
          <DialogDescription>
            Registre um item que precisa de manutenção. O estoque será ajustado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Item</Label>
            <Select value={itemId} onValueChange={setItemId} required>
              <SelectTrigger className="border-border/60">
                <SelectValue placeholder="Selecione o item" />
              </SelectTrigger>
              <SelectContent>
                {items
                  .filter((i) => i.availableQuantity > 0)
                  .map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} ({i.availableQuantity} disp.)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                max={selectedItem?.availableQuantity ?? 9999}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border-border/60"
                required
              />
              {selectedItem && (
                <p className="text-xs text-muted-foreground">
                  Disponível: {selectedItem.availableQuantity}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as MaintenanceType)}>
                <SelectTrigger className="border-border/60">
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
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Responsável (opcional)</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger className="border-border/60">
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
          </div>

          <div className="space-y-1.5">
            <Label>Observações (opcional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva o problema..."
              className="border-border/60"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!itemId || quantity <= 0 || isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar manutenção'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
