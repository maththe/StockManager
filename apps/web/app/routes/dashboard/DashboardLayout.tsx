import {
  Box,
  CalendarDays,
  PanelLeftClose,
  ShieldUser,
  Users,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import { ThemeToggle } from '~/components/theme-toggle';
import { useMe } from '~/services/tanStackQuery/users';

const navItems = [
  { to: '/dashboard/inventory', icon: Box, label: 'Inventario' },
  { to: '/dashboard/clients', label: 'Clientes', icon: Users },
  { to: '/dashboard/users', label: 'Usuarios', icon: ShieldUser },
  { to: '/dashboard/events', label: 'Eventos', icon: CalendarDays },
];

export default function DashboardLayout() {
  const { data: currentUser } = useMe();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="flex w-full items-center justify-between px-4 py-3 md:px-5">
          <h1 className="text-lg font-semibold tracking-tight">
            Stock Manager
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {currentUser?.name ?? currentUser?.email ?? 'Usuario logado'}
            </span>
            <ThemeToggle className="h-9 w-9" />
          </div>
        </div>
      </header>

      <div className="flex w-full">
        <aside className="sticky top-[61px] hidden h-[calc(100vh-61px)] w-64 shrink-0 border-r bg-card md:block">
          <div className="px-6 pt-4 text-sm font-semibold text-muted-foreground">
            <div className="flex items-center gap-2">
              <PanelLeftClose className="h-4 w-4" />
              Navegacao
            </div>
          </div>

          <nav className="space-y-2 px-4 py-4">
            <div className="my-4 border-t" />

            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-h-[calc(100vh-61px)] min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
