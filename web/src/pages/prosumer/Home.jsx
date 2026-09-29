import { ArrowRightIcon, BoltIcon, ShieldCheckIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import OperationsHero from '../../components/OperationsHero';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import { AuthContext } from '../../context/AuthContext';
import MainLayout from '../../layouts/MainLayout';

export default function ProsumerHome() {
  const { user } = useContext(AuthContext);
  return (
    <MainLayout title="Prosumer account">
      <PageHeader eyebrow="Personal energy identity" title={`Welcome, ${user.firstName}`} description="Manage the identity and security information connected to your solar energy account." />
      <OperationsHero title="Your place in a smarter grid." label="Prosumer / mobile-first energy" description="Discover available energy, reserve a suitable window and follow your bookings in the mobile experience. Manage your account and security here." to="/account/profile" action="Manage your energy identity" />
      <section className="grid gap-5 md:grid-cols-3">
        <div className="app-panel p-5 md:col-span-2">
          <BoltIcon className="h-7 w-7 text-emerald-600" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-slate-950">Your energy network account</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Your profile connects your reservations and transfer information across the energy network.</p>
          <div className="mt-5 flex flex-wrap gap-2"><StatusBadge value={user.role} /><StatusBadge value={user.status} /></div>
        </div>
        <div className="network-grid rounded-lg border border-slate-800 bg-graphite-950 p-5 text-white shadow-energy">
          <ShieldCheckIcon className="h-7 w-7 text-cyan-400" aria-hidden="true" />
          <h2 className="mt-3 font-semibold">Secure identity</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Keep your contact details current and protect your account with a strong, unique password.</p>
        </div>
      </section>
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link to="/account/profile" className="app-panel group p-5 transition hover:border-emerald-300 hover:shadow-md">
          <UserCircleIcon className="h-6 w-6 text-emerald-600" aria-hidden="true" />
          <div className="mt-3 flex items-center justify-between gap-3"><span className="font-semibold text-slate-900">Review profile</span><ArrowRightIcon className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600" /></div>
          <p className="mt-1 text-sm text-slate-500">Update contact information or request account deactivation.</p>
        </Link>
        <Link to="/account/security" className="app-panel group p-5 transition hover:border-cyan-300 hover:shadow-md">
          <ShieldCheckIcon className="h-6 w-6 text-cyan-700" aria-hidden="true" />
          <div className="mt-3 flex items-center justify-between gap-3"><span className="font-semibold text-slate-900">Account security</span><ArrowRightIcon className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-cyan-700" /></div>
          <p className="mt-1 text-sm text-slate-500">Change the password protecting your Prosumer identity.</p>
        </Link>
      </section>
    </MainLayout>
  );
}
