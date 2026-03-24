import { Boxes, CalendarDays, PanelLeftClose } from "lucide-react";
import { NavLink, Outlet } from "react-router";

const navItems = [
  { to: "/dashboard", label: "Itens", icon: Boxes, end: true },
  { to: "/dashboard/events", label: "Eventos", icon: CalendarDays },
];

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 rounded-2xl border bg-card p-4 shadow-sm md:block">
          <div className="mb-6 flex items-center gap-2 px-2 text-sm font-semibold text-muted-foreground">
            <PanelLeftClose className="h-4 w-4" />
            Navegação
          </div>

          <nav className="space-y-2">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                end={end}
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

        <main className="min-w-0 flex-1 rounded-2xl border bg-card p-4 shadow-sm md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
