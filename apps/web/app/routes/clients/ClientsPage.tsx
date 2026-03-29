import { ClientsList } from './components/ClientsList';

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
        <p className="text-muted-foreground">Gerencie todos os seus clientes e suas informações de contato</p>
      </div>
      <ClientsList />
    </div>
  );
}
