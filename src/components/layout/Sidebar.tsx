import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  BarChart3,
  LogOut,
  Settings,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';


const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { to: '/categories', label: 'Categorias', icon: Tag },
  { to: '/wallets', label: 'Cartões e Bancos', icon: Wallet },
  { to: '/reports', label: 'Relatórios', icon: BarChart3 },
  { to: '/settings', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white h-screen fixed left-0 top-0 z-40 shadow-xl shadow-slate-900/50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <span className="text-lg">💰</span>
        </div>
        <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          ControleFácil
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-4">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Menu
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-white" />
                    )}
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Theme toggle + User section */}
      <div className="px-3 pb-4">
        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-4" />
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Tema
          </span>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors duration-200">
          <Avatar size="sm">
            <AvatarImage src={user?.avatar_url} alt={user?.name || user?.email} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={signOut}
            className="text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
