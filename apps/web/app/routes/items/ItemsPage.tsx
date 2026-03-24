import { CalendarDays } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { ItemsList } from "./components/itemsList";

export default function ItemsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-background to-indigo-100/60 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
      <div className="container mx-auto space-y-6 py-10 px-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Painel de Estoque</h1>
          <p className="text-muted-foreground">
            Controle categorias, produtos e disponibilidade em um só lugar.
          </p>
        </div>
        <div className="flex justify-end">
          <Link to="/dashboard/events">
            <Button variant="outline" className="bg-background/60 backdrop-blur-sm">
              <CalendarDays className="mr-2 h-4 w-4" />
              Eventos
            </Button>
          </Link>
        </div>
        <ItemsList />
      </div>
    </div>
  );
}
