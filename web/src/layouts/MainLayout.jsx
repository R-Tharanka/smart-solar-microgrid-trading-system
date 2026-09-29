import { Dialog, DialogPanel } from '@headlessui/react';
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  BoltIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { navigationByRole } from '../config/navigation';

function SidebarContent({ user, onNavigate, onLogout }) {
  const navItems = navigationByRole[user?.role] || [];

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-300">
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-md border border-emerald-400/40 bg-emerald-400/10 text-emerald-300">
          <BoltIcon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">Smart Solar Grid</p>
          <p className="truncate text-xs text-emerald-300">{user?.role} control</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-400/15 text-emerald-200 ring-1 ring-inset ring-emerald-400/30'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 px-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-bold text-cyan-200">
            {(user?.firstName || user?.email || 'U').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.name || user?.email}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <ArrowRightStartOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function MainLayout({ children, title }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout('You signed out successfully.');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      <Dialog open={mobileOpen} onClose={setMobileOpen} className="relative z-50 lg:hidden">
        <div className="fixed inset-0 bg-slate-950/70" aria-hidden="true" />
        <div className="fixed inset-0 flex">
          <DialogPanel className="relative w-72 max-w-[85vw]">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute left-full top-4 ml-3 rounded-md bg-slate-900 p-2 text-white"
              aria-label="Close navigation"
              title="Close navigation"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <SidebarContent user={user} onNavigate={() => setMobileOpen(false)} onLogout={handleLogout} />
          </DialogPanel>
        </div>
      </Dialog>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
            title="Open navigation"
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Microgrid operations</p>
            <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>
          </div>
          <span className="ml-auto hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            Secure session
          </span>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
