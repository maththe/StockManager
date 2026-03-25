import { Boxes, CalendarDays, PanelLeftClose, ShieldUser, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { ThemeToggle } from "~/components/theme-toggle";
import { useMe } from "~/services/tanStackQuery/users";

const navItems = [
  { to: "/dashboard/items", label: "Itens", icon: Boxes },
  { to: "/dashboard/clients", label: "Clientes", icon: Users },
  { to: "/dashboard/users", label: "Usuarios", icon: ShieldUser },
  { to: "/dashboard/events", label: "Eventos", icon: CalendarDays },
];

export default function DashboardLayout() {
  const { data: currentUser } = useMe();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-3 md:px-6">
          <h1 className="text-lg font-semibold tracking-tight">Stock Manager</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {currentUser?.name ?? currentUser?.email ?? "Usuário logado"}
            </span>
            <ThemeToggle className="h-9 w-9" />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] gap-6 px-4 py-6 md:px-6">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 rounded-2xl border bg-card p-4 shadow-sm md:block">
          <div className="mb-6 flex items-center gap-2 px-2 text-sm font-semibold text-muted-foreground">
            <PanelLeftClose className="h-4 w-4" />
            Navegação
          </div>

          <nav className="space-y-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-h-[calc(100vh-3rem)] min-w-0 flex-1 rounded-2xl border bg-card p-4 shadow-sm md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
