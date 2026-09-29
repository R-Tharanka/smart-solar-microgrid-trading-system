import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { ArrowRightStartOnRectangleIcon, Bars3Icon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, UserCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useContext, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { navigationByRole } from '../config/navigation';
import BrandMark from '../components/BrandMark';

function SidebarContent({ user, collapsed = false, onNavigate, onLogout }) {
  const role = user?.role === 'GridOperator' ? 'Grid operator' : user?.role;
  return (
    <div className={`rail ${collapsed ? 'rail-collapsed' : ''}`}>
      <Link to="/" className="rail-brand" aria-label="Smart Solar Microgrid home"><BrandMark inverse label={!collapsed} /></Link>
      <p className="rail-caption">{collapsed ? 'GRID' : `${role} / workspace`}</p>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label="Primary navigation">
        {(navigationByRole[user?.role] || []).map(({ path, name, icon: Icon, end }) => (
          <NavLink key={path} to={path} end={end} onClick={onNavigate} title={collapsed ? name : undefined} aria-label={name} className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`}>
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" /><span>{name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="rail-bottom">
        <Link to="/account/profile" onClick={onNavigate} className="rail-person" aria-label="Open account profile">
          <span className="rail-avatar">{(user?.name || user?.email || 'U').charAt(0).toUpperCase()}</span>
          <span className="min-w-0"><strong className="block truncate text-sm text-white">{user?.name || user?.email}</strong><span className="block truncate text-xs text-slate-400">{role}</span></span>
        </Link>
        <button type="button" onClick={onLogout} className="rail-logout" title="Sign out" aria-label="Sign out"><ArrowRightStartOnRectangleIcon className="h-5 w-5 shrink-0" /><span>Sign out</span></button>
      </div>
    </div>
  );
}

export default function MainLayout({ children, title }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('microgrid-navigation-collapsed') === 'true'; } catch { return false; }
  });
  const toggleNavigation = () => {
    setCollapsed((current) => {
      try { localStorage.setItem('microgrid-navigation-collapsed', String(!current)); } catch { /* Navigation remains usable without storage. */ }
      return !current;
    });
  };
  const handleLogout = () => {
    logout('You signed out successfully.');
    navigate('/login', { replace: true });
  };
  return (
    <div className={`operations-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className="desktop-rail"><SidebarContent user={user} collapsed={collapsed} onLogout={handleLogout} /></aside>
      <Dialog open={mobileOpen} onClose={setMobileOpen} className="relative z-50 lg:hidden">
        <div className="fixed inset-0 bg-graphite-950/75 backdrop-blur-sm" aria-hidden="true" />
        <DialogPanel transition className="fixed inset-y-0 left-0 w-72 max-w-[85vw] transition duration-300 data-[closed]:-translate-x-full">
          <DialogTitle className="sr-only">Workspace navigation</DialogTitle>
          <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-3 top-6 z-10 rounded-lg bg-graphite-800 p-2 text-white" aria-label="Close navigation"><XMarkIcon className="h-5 w-5" /></button>
          <SidebarContent user={user} onNavigate={() => setMobileOpen(false)} onLogout={handleLogout} />
        </DialogPanel>
      </Dialog>
      <div className="workspace-body">
        <header className="workspace-topbar">
          <button type="button" className="shell-toggle desktop-shell-toggle" onClick={toggleNavigation} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} aria-expanded={!collapsed}>{collapsed ? <ChevronDoubleRightIcon className="h-5 w-5" /> : <ChevronDoubleLeftIcon className="h-5 w-5" />}</button>
          <button type="button" className="shell-toggle mobile-shell-toggle" onClick={() => setMobileOpen(true)} aria-label="Open navigation" aria-expanded={mobileOpen}><Bars3Icon className="h-5 w-5" /></button>
          <div className="workspace-breadcrumb"><span>Energy workspace</span><span aria-hidden="true">/</span><strong>{title}</strong></div>
          <Link to="/account/profile" className="workspace-account" aria-label="Open account profile"><UserCircleIcon className="h-5 w-5" /><span>{user?.name || user?.email}</span></Link>
        </header>
        <main className="workspace-main"><div key={location.pathname} className="page-enter mx-auto w-full max-w-[1500px]">{children}</div></main>
      </div>
    </div>
  );
}
