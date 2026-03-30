import { UsersList } from './components/UsersList';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie os usuários e suas permissões no sistema
        </p>
      </div>
      <UsersList />
    </div>
  );
}
