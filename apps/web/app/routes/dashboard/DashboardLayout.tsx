import { useState } from 'react';
import {
  Box,
  CalendarDays,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldUser,
  Users,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import { Button } from '~/components/ui/button';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="flex w-full items-center justify-between px-4 py-3 md:px-5">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              onClick={() => setIsSidebarOpen((current) => !current)}
              aria-label={
                isSidebarOpen ? 'Fechar navegacao lateral' : 'Abrir navegacao lateral'
              }
              title={
                isSidebarOpen ? 'Fechar navegacao lateral' : 'Abrir navegacao lateral'
              }
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeftOpen className="size-4" />
              )}
            </Button>
            <h1 className="text-lg font-semibold tracking-tight">
              Stock Manager
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {currentUser?.name ?? currentUser?.email ?? 'Usuario logado'}
            </span>
            <ThemeToggle className="h-9 w-9" />
          </div>
        </div>
      </header>

      <div className="flex w-full">
        <aside
          className={`sticky top-[61px] hidden h-[calc(100vh-61px)] shrink-0 overflow-hidden border-r bg-card transition-[width] duration-200 md:block ${
            isSidebarOpen ? 'w-64' : 'w-0 border-r-0'
          }`}
        >
          <div
            className={`h-full transition-opacity duration-150 ${
              isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
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
          </div>
        </aside>

        <main className="min-h-[calc(100vh-61px)] min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
