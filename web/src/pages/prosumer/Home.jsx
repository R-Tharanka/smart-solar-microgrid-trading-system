import { ArrowRightIcon, BoltIcon, ShieldCheckIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import { AuthContext } from '../../context/AuthContext';
import MainLayout from '../../layouts/MainLayout';

export default function ProsumerHome() {
  const { user } = useContext(AuthContext);
  return (
    <MainLayout title="Prosumer account">
      <PageHeader eyebrow="Personal energy identity" title={`Welcome, ${user.firstName}`} description="Manage the identity and security information connected to your solar energy account." />
      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 md:col-span-2">
          <BoltIcon className="h-7 w-7 text-emerald-600" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-slate-950">Account ready for energy trading</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Your NIC-backed identity is active. Reservation and energy transfer workflows remain protected by the central API.</p>
          <div className="mt-5 flex flex-wrap gap-2"><StatusBadge value={user.role} /><StatusBadge value={user.status} /></div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-5 text-white">
          <ShieldCheckIcon className="h-7 w-7 text-cyan-400" aria-hidden="true" />
          <h2 className="mt-3 font-semibold">Secure identity</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Profile and password changes are validated and persisted by the identity service.</p>
        </div>
      </section>
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link to="/account/profile" className="group rounded-lg border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md">
          <UserCircleIcon className="h-6 w-6 text-emerald-600" aria-hidden="true" />
          <div className="mt-3 flex items-center justify-between gap-3"><span className="font-semibold text-slate-900">Review profile</span><ArrowRightIcon className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600" /></div>
          <p className="mt-1 text-sm text-slate-500">Update contact information or request account deactivation.</p>
        </Link>
        <Link to="/account/security" className="group rounded-lg border border-slate-200 bg-white p-5 transition hover:border-cyan-300 hover:shadow-md">
          <ShieldCheckIcon className="h-6 w-6 text-cyan-700" aria-hidden="true" />
          <div className="mt-3 flex items-center justify-between gap-3"><span className="font-semibold text-slate-900">Account security</span><ArrowRightIcon className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-cyan-700" /></div>
          <p className="mt-1 text-sm text-slate-500">Change the password protecting your Prosumer identity.</p>
        </Link>
      </section>
    </MainLayout>
  );
}
