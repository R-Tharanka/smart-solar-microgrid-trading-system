import {
  ArrowRightIcon,
  Battery50Icon,
  BoltIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  CircleStackIcon,
  CommandLineIcon,
  CpuChipIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SunIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import BrandMark from '../components/BrandMark';

const workflow = [
  ['01', 'Solar Prosumer', 'An identified Prosumer participates through an authenticated account.'],
  ['02', 'Energy Slot', 'Available energy capacity and time are published through managed slots.'],
  ['03', 'Reservation', 'A Prosumer requests energy against an available station and slot.'],
  ['04', 'Verification', 'Authorized staff review the booking and verify the transfer workflow.'],
  ['05', 'Energy Transfer', 'A valid transaction records the completed exchange through the central API.'],
];

const roles = [
  {
    name: 'Backoffice',
    icon: UserGroupIcon,
    accent: 'text-emerald-300',
    items: ['Manage staff and Prosumer accounts', 'Administer microgrid nodes and energy slots', 'Review reservations and system operations'],
  },
  {
    name: 'Grid Operator',
    icon: CpuChipIcon,
    accent: 'text-cyan-300',
    items: ['Monitor stations, slots and bookings', 'Support verification and transfer operations', 'Use role-specific operational views'],
  },
  {
    name: 'Prosumer',
    icon: SunIcon,
    accent: 'text-amber-300',
    items: ['Maintain a secure energy account', 'Reserve available energy through the mobile workflow', 'Track booking and transfer activity'],
  },
];

const capabilities = [
  [MapPinIcon, 'Microgrid nodes', 'Maintain station identity, location, capacity and operational status.'],
  [Battery50Icon, 'Energy slots', 'Publish time-bound capacity that can be discovered and reserved.'],
  [CalendarDaysIcon, 'Reservations', 'Coordinate booking requests and their controlled status workflow.'],
  [CheckBadgeIcon, 'Verified transfer', 'Connect approved reservations to secure verification and completion.'],
  [ShieldCheckIcon, 'Role-based access', 'Keep administration, operations and Prosumer journeys clearly separated.'],
  [BoltIcon, 'Central coordination', 'Use one REST API as the authority for business rules and persistence.'],
];

function PublicHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 border-b border-white/10 bg-graphite-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1500px] items-center px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Smart Solar Microgrid home"><BrandMark inverse /></Link>
        <nav className="ml-auto hidden items-center gap-7 text-sm font-semibold text-slate-300 md:flex" aria-label="Public navigation">
          <a href="#platform" className="transition hover:text-white">Platform</a>
          <a href="#roles" className="transition hover:text-white">Roles</a>
          <a href="#workflow" className="transition hover:text-white">Workflow</a>
        </nav>
        <Link to="/login" className="ml-5 inline-flex min-h-10 items-center gap-2 rounded-md border border-emerald-400 bg-emerald-400 px-4 text-sm font-bold text-graphite-950 transition hover:bg-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-300">
          Sign in <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}

function NetworkVisual() {
  return (
    <div className="relative min-h-[360px] overflow-hidden border border-white/10 bg-graphite-900 p-4 shadow-energy sm:min-h-[430px] sm:p-8" style={{ borderRadius: 8 }}>
      <div className="network-grid absolute inset-0 opacity-70" />
      <svg viewBox="0 0 680 430" className="relative h-full min-h-[330px] w-full" role="img" aria-label="Energy flowing between solar generation, storage, grid control and a Prosumer">
        <defs>
          <filter id="flow-glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <g fill="none" stroke="#334155" strokeWidth="2">
          <path d="M125 105 C235 105 240 215 340 215" />
          <path d="M125 325 C235 325 240 215 340 215" />
          <path d="M340 215 C445 215 455 105 560 105" />
          <path d="M340 215 C445 215 455 325 560 325" />
        </g>
        <g fill="none" stroke="#34d399" strokeWidth="3" strokeDasharray="8 12" filter="url(#flow-glow)" className="animate-energy-flow">
          <path d="M125 105 C235 105 240 215 340 215" />
          <path d="M125 325 C235 325 240 215 340 215" />
          <path d="M340 215 C445 215 455 105 560 105" />
          <path d="M340 215 C445 215 455 325 560 325" />
        </g>
        {[
          [125, 105, 'SOLAR', '#fbbf24'], [125, 325, 'STORAGE', '#22d3ee'], [340, 215, 'MICROGRID', '#34d399'],
          [560, 105, 'OPERATOR', '#22d3ee'], [560, 325, 'PROSUMER', '#6ee7b7'],
        ].map(([x, y, label, color]) => (
          <g key={label}>
            <circle cx={x} cy={y} r="45" fill="#0b1715" stroke={color} strokeWidth="2" />
            <circle cx={x} cy={y} r="31" fill="#13231f" stroke="#334155" />
            <circle cx={x} cy={y - 6} r="7" fill={color} className="animate-pulse-soft" />
            <text x={x} y={y + 18} textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="700">{label}</text>
          </g>
        ))}
      </svg>
      <p className="relative border-t border-white/10 pt-4 text-sm leading-6 text-slate-400">One coordinated service boundary connects identity, availability, reservation and transfer workflows.</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-graphite-950 text-white">
      <PublicHeader />
      <main>
        <section className="relative flex min-h-[82svh] items-end overflow-hidden pt-28">
          <img src="/assets/microgrid-hero.png" alt="Solar homes, battery storage and a connected neighborhood microgrid" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-graphite-950 via-graphite-950/80 to-graphite-950/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-graphite-950 via-transparent to-graphite-950/40" />
          <div className="relative mx-auto w-full max-w-[1500px] px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
            <div className="max-w-3xl animate-fade-up">
              <p className="mb-5 inline-flex items-center gap-2 border-l-2 border-emerald-400 pl-3 text-sm font-bold uppercase text-emerald-300" style={{ letterSpacing: '0.08em' }}><BoltIcon className="h-4 w-4" /> Coordinated clean energy</p>
              <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-7xl">Connect solar energy.<br /><span className="text-emerald-300">Coordinate the grid.</span></h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">A shared platform for solar Prosumers, grid operators and Backoffice teams to manage availability, reservations and verified energy transfer.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-emerald-400 px-6 text-sm font-bold text-graphite-950 transition hover:bg-emerald-300">Access the platform <ArrowRightIcon className="h-4 w-4" /></Link>
                <a href="#platform" className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/30 bg-black/20 px-6 text-sm font-bold text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-black/35">Explore the system</a>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="bg-slate-50 py-20 text-slate-950 sm:py-24">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
              <div><p className="eyebrow">System overview</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">A clear path from available energy to verified transfer.</h2></div>
              <p className="max-w-2xl text-base leading-7 text-slate-600 lg:justify-self-end">The platform keeps business rules in a central service while web and mobile experiences support each role’s part of the energy workflow.</p>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-5" style={{ borderRadius: 8 }}>
              {workflow.map(([number, title, description]) => <article key={number} className="bg-white p-5 lg:p-6"><span className="font-mono text-xs font-bold text-emerald-700">{number}</span><h3 className="mt-7 text-base font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}
            </div>
          </div>
        </section>

        <section id="roles" className="border-y border-white/10 bg-graphite-900 py-20 sm:py-24">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase text-emerald-300" style={{ letterSpacing: '0.08em' }}>Role-specific experiences</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">Different responsibilities. One coordinated system.</h2>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {roles.map(({ name, icon: Icon, accent, items }) => <article key={name} className="border border-white/10 bg-white/[0.035] p-6" style={{ borderRadius: 8 }}><Icon className={`h-7 w-7 ${accent}`} /><h3 className="mt-6 text-xl font-bold">{name}</h3><ul className="mt-5 space-y-3">{items.map(item => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />{item}</li>)}</ul></article>)}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 text-slate-950 sm:py-24">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl"><p className="eyebrow">Core capabilities</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Built around real microgrid workflows.</h2></div>
            <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{capabilities.map(([Icon,title,description]) => <article key={title} className="border-t border-slate-200 pt-5"><Icon className="h-6 w-6 text-emerald-600" /><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}</div>
          </div>
        </section>

        <section id="workflow" className="bg-graphite-950 py-20 sm:py-24">
          <div className="mx-auto grid max-w-[1500px] gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
            <div><p className="text-xs font-bold uppercase text-cyan-300" style={{ letterSpacing: '0.08em' }}>Smart grid coordination</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Energy moves through connected decisions.</h2><p className="mt-5 max-w-xl text-base leading-7 text-slate-400">Stations publish capacity, Prosumers reserve it, and authorized roles advance the workflow. The visualization represents system relationships, not live telemetry.</p></div>
            <NetworkVisual />
          </div>
        </section>

        <section className="bg-slate-100 py-20 text-slate-950 sm:py-24">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center"><div><p className="eyebrow">Platform architecture</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">One service. Purpose-built clients.</h2><p className="mt-5 max-w-xl text-base leading-7 text-slate-600">The implementation follows the project’s FAT Service architecture: business rules stay in ASP.NET Core, MongoDB provides server persistence, and web and Android clients communicate through REST APIs.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[[CommandLineIcon,'ASP.NET Core'],[CircleStackIcon,'MongoDB'],[CpuChipIcon,'React'],[ShieldCheckIcon,'Android + SQLite']].map(([Icon,label]) => <div key={label} className="app-panel flex min-h-32 flex-col justify-between p-4"><Icon className="h-6 w-6 text-emerald-600" /><span className="text-sm font-bold">{label}</span></div>)}</div></div>
          </div>
        </section>

        <section className="border-y border-emerald-400/20 bg-graphite-900 py-16 sm:py-20"><div className="mx-auto flex max-w-[1500px] flex-col gap-7 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8"><div><p className="text-sm font-bold text-emerald-300">SMART SOLAR MICROGRID</p><h2 className="mt-2 text-3xl font-bold">Enter the energy operations workspace.</h2></div><Link to="/login" className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-md bg-emerald-400 px-6 text-sm font-bold text-graphite-950 transition hover:bg-emerald-300">Sign in securely <ArrowRightIcon className="h-4 w-4" /></Link></div></section>
      </main>
      <footer className="bg-graphite-950 py-10 text-slate-400"><div className="mx-auto flex max-w-[1500px] flex-col gap-7 px-4 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8"><div><BrandMark inverse /><p className="mt-4 max-w-md text-sm leading-6">An SE4040 Enterprise Application Development project for coordinated solar microgrid trading.</p></div><div className="flex gap-5 text-sm"><a href="#platform" className="hover:text-white">Platform</a><a href="#roles" className="hover:text-white">Roles</a><Link to="/login" className="text-emerald-300 hover:text-emerald-200">Sign in</Link></div></div></footer>
    </div>
  );
}
