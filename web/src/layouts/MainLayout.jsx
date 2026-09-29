import { Dialog, DialogPanel } from '@headlessui/react';
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  ChevronRightIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { navigationByRole } from '../config/navigation';
import BrandMark from '../components/BrandMark';

function SidebarContent({ user, onNavigate, onLogout }) {
  const navItems = navigationByRole[user?.role] || [];

  return (
    <div className="network-grid flex h-full flex-col bg-graphite-950 text-slate-300">
      <div className="flex h-20 items-center border-b border-white/10 px-5">
        <BrandMark inverse />
      </div>

      <div className="px-5 pt-5"><p className="text-[11px] font-bold uppercase text-slate-500" style={{ letterSpacing: '0.08em' }}>{user?.role} workspace</p></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) => `group flex min-h-11 items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm font-semibold transition-all ${
                isActive
                  ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200'
                  : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{item.name}</span>
              <ChevronRightIcon className="ml-auto h-4 w-4 opacity-0 transition group-hover:opacity-50" aria-hidden="true" />
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 bg-black/10 p-4">
        <div className="mb-3 flex items-center gap-3 px-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-cyan-400/20 bg-cyan-400/10 text-sm font-bold text-cyan-200">
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
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 shadow-sm backdrop-blur-md sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
            title="Open navigation"
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Microgrid operations</p>
            <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>
          </div>
          <Link to="/account/profile" className="hidden min-h-10 items-center gap-3 rounded-md px-2 transition hover:bg-slate-100 sm:flex" aria-label="Open account profile">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-emerald-300"><UserCircleIcon className="h-5 w-5" /></span>
            <span className="max-w-40 text-right"><span className="block truncate text-sm font-semibold text-slate-800">{user?.name || user?.email}</span><span className="block text-xs text-slate-500">{user?.role}</span></span>
          </Link>
          <button type="button" onClick={handleLogout} className="hidden rounded-md p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 sm:block" aria-label="Sign out" title="Sign out"><ArrowRightStartOnRectangleIcon className="h-5 w-5" /></button>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="page-enter mx-auto w-full max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
