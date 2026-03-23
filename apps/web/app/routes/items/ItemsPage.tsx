import { CalendarDays } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { ItemsList } from "./components/itemsList";

export default function ItemsPage() {
  return (
    <div className="container mx-auto space-y-4 py-8">
      <div className="flex justify-end">
        <Link to="/dashboard/events">
          <Button variant="outline">
            <CalendarDays className="mr-2 h-4 w-4" />
            Eventos
          </Button>
        </Link>
      </div>
      <ItemsList />
    </div>
  );
}
