import { useState } from 'react';
import {
  Box,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  HandCoins,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
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
  { to: '/dashboard/calendar', label: 'Calendário', icon: CalendarRange },
  { to: '/dashboard/rentals', label: 'Locações', icon: HandCoins },
  { to: '/dashboard/tasks', label: 'Tarefas', icon: ClipboardList },
  { to: '/dashboard/maintenance', label: 'Manutenções', icon: Settings },
];

export default function DashboardLayout() {
  const { data: currentUser } = useMe();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 shadow-sm">
        <div className="flex w-full items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex hover:bg-muted"
              onClick={() => setIsSidebarOpen((current) => !current)}
              aria-label={
                isSidebarOpen
                  ? 'Fechar navegacao lateral'
                  : 'Abrir navegacao lateral'
              }
              title={
                isSidebarOpen
                  ? 'Fechar navegacao lateral'
                  : 'Abrir navegacao lateral'
              }
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="size-5" />
              ) : (
                <PanelLeftOpen className="size-5" />
              )}
            </Button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Stock Manager
              </h1>
              <p className="text-xs text-muted-foreground">
                Gestão de Inventário
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">
                {currentUser?.name ?? currentUser?.email ?? 'Usuario logado'}
              </span>
              <span className="text-xs text-muted-foreground">
                Bem-vindo(a)
              </span>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <ThemeToggle className="h-9 w-9" />
          </div>
        </div>
      </header>

      <div className="flex w-full">
        <aside
          className={`sticky top-[73px] hidden h-[calc(100vh-73px)] shrink-0 overflow-hidden border-r bg-card/50 backdrop-blur transition-[width] duration-200 md:block ${
            isSidebarOpen ? 'w-64' : 'w-0 border-r-0'
          }`}
        >
          <div
            className={`h-full overflow-y-auto transition-opacity duration-150 ${
              isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <div className="px-6 py-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary" />
                Menu Principal
              </div>
            </div>

            <nav className="space-y-1 px-3 py-4">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 border-t bg-gradient-to-t from-background/20 to-transparent p-4">
              <p className="text-xs text-muted-foreground text-center">
                Stock Manager v1.0
              </p>
            </div>
          </div>
        </aside>

        <main className="min-h-[calc(100vh-73px)] min-w-0 flex-1 bg-gradient-to-b from-background to-background/50">
          <div className="px-4 py-6 sm:px-6 md:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
