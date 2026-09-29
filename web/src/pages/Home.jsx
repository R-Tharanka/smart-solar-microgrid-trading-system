import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon, ArrowRightIcon, BoltIcon, SunIcon, Square3Stack3DIcon, CalendarDaysIcon, ShieldCheckIcon, UserGroupIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import BrandMark from '../components/BrandMark';
import EnergyNetwork from '../components/EnergyNetwork';

const capabilities = [
  [Square3Stack3DIcon, 'Microgrid operations', 'A clear view of your energy infrastructure. Coordinate station capacity, storage and operating schedules.'],
  [SunIcon, 'Energy availability', 'Give solar capacity a time and a place. Publish energy windows and keep availability in focus.'],
  [CalendarDaysIcon, 'Smart reservations', 'Bring demand and capacity together with scheduled reservations and clear booking decisions.'],
  [BoltIcon, 'Operational control', 'Keep stations, bookings and the next action connected in one focused operating environment.'],
  [ShieldCheckIcon, 'Verified energy transfer', 'Take approved exchanges through verification and completion, with a record of every transfer.'],
  [UserGroupIcon, 'Network participants', 'Manage the people powering the network with the right access for their part in the energy journey.'],
];
const journey = [
  ['Generate', 'Solar energy becomes available across the network.'],
  ['Publish', 'Stations make capacity available in scheduled energy slots.'],
  ['Reserve', 'Prosumers find a suitable window and request energy.'],
  ['Approve', 'Operations teams review and coordinate the booking.'],
  ['Verify', 'Transfer details are checked before the exchange proceeds.'],
  ['Complete', 'The completed energy exchange becomes a traceable record.'],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="product-home">
      <header className="public-header">
        <Link to="/" aria-label="Smart Solar Microgrid home"><BrandMark inverse /></Link>
        <nav className="public-nav" aria-label="Product navigation"><a href="#platform">Platform</a><a href="#energy">Energy network</a><a href="#experiences">Experiences</a></nav>
        <div className="flex items-center gap-3"><Link className="public-signin" to="/login">Sign in <ArrowUpRightIcon className="h-4 w-4" /></Link><button className="public-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle product navigation" aria-expanded={menuOpen}>{menuOpen ? <XMarkIcon /> : <Bars3Icon />}</button></div>
        {menuOpen && <nav className="public-mobile-nav" aria-label="Mobile product navigation">{[['#platform', 'Platform'], ['#energy', 'Energy network'], ['#experiences', 'Experiences']].map(([href, text]) => <a href={href} key={href} onClick={() => setMenuOpen(false)}>{text}<ArrowUpRightIcon className="h-4 w-4" /></a>)}</nav>}
      </header>
      <main>
        <section className="solar-hero">
          <div className="hero-copy">
            <p className="energy-kicker"><span /> The next connection in clean energy</p>
            <h1>Local energy.<br />Limitless <em>potential.</em></h1>
            <p className="hero-description">Connect solar generation to the people who need it. Coordinate available capacity, reserve energy and move every exchange through a smarter microgrid.</p>
            <div className="hero-actions"><Link to="/login" className="energy-cta">Sign in <ArrowUpRightIcon /></Link><a href="#platform" className="text-link">Explore the platform <ArrowRightIcon /></a></div>
            <div className="hero-footnote"><span>Solar generation</span><i /><span>Connected storage</span><i /><span>Verified exchange</span></div>
          </div>
          <div className="hero-network"><div className="orbital-label">A more connected energy future</div><EnergyNetwork /></div>
          <div className="hero-bottom"><span>SMART SOLAR MICROGRID</span><span>Energy moves forward. Together.</span><a href="#platform" aria-label="Explore the platform">↓</a></div>
        </section>
        <section id="platform" className="public-section light-section">
          <div className="section-intro"><p className="energy-kicker">01 / The platform</p><h2>Make every connection<br /><span>count.</span></h2><p>From distributed generation to coordinated operations, bring the whole energy exchange into view.</p></div>
          <div className="capability-grid">{capabilities.map(([Icon, title, copy], i) => <article className="capability" key={title}><div className="capability-top"><Icon /><span>0{i + 1}</span></div><h3>{title}</h3><p>{copy}</p></article>)}</div>
        </section>
        <section id="energy" className="public-section network-section">
          <div><p className="energy-kicker">02 / Connected by energy</p><h2>A network with<br /><em>purpose.</em></h2><p className="section-copy">Solar generation, battery storage and connected stations form the foundation. A coordinated energy network brings them together for the communities they serve.</p><div className="network-legend"><span><i /> Solar & capacity</span><span><i /> Storage & connection</span></div><p className="concept-note">An illustration of the microgrid concept.</p></div>
          <EnergyNetwork />
        </section>
        <section className="public-section light-section journey-section">
          <div className="section-intro"><p className="energy-kicker">03 / Energy in motion</p><h2>From sunlight<br />to a completed exchange.</h2><p>One considered journey, with a clear next step at every stage.</p></div>
          <div className="energy-journey">{journey.map(([title, copy], i) => <article key={title}><span className="journey-number">{String(i + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
        </section>
        <section id="experiences" className="public-section experience-section">
          <div className="section-intro"><p className="energy-kicker">04 / Purpose-built experiences</p><h2>Different perspectives.<br /><span>One smarter grid.</span></h2></div>
          <div className="experience-grid">{[
            ['Backoffice', 'Shape the network.', 'Manage participants, microgrid infrastructure and energy availability with a complete operational overview.', 'Network management', Square3Stack3DIcon],
            ['Grid Operator', 'Keep energy moving.', 'Review stations and bookings, verify approved transactions and complete energy-transfer operations.', 'Operations workspace', BoltIcon],
            ['Prosumer', 'Find your energy.', 'A mobile-first journey for discovering capacity, reserving energy, managing bookings and accessing transfer information.', 'Mobile energy experience', SunIcon],
          ].map(([role, title, copy, label, Icon]) => <article className="experience" key={role}><Icon /><p className="energy-kicker">{role}</p><h3>{title}</h3><p>{copy}</p><div>{label}<ArrowUpRightIcon /></div></article>)}</div>
        </section>
        <section className="public-section trust-section"><div><ShieldCheckIcon className="h-10 w-10" /><p className="energy-kicker">Confidence at every connection</p><h2>Energy exchanged.<br />Trust maintained.</h2></div><div className="trust-list">{['Authenticated participants', 'Controlled reservations', 'Managed energy availability', 'Verified transactions', 'Traceable transfer activity'].map((item, i) => <div key={item}><span>0{i + 1}</span><h3>{item}</h3><ShieldCheckIcon /></div>)}</div></section>
        <section className="public-section final-cta"><p className="energy-kicker">Your next connection starts here</p><h2>Power a more<br /><em>connected future.</em></h2><Link to="/login" className="energy-cta">Sign in to the platform <ArrowUpRightIcon /></Link></section>
      </main>
      <footer className="product-footer"><div><BrandMark inverse /><p>Local generation. Connected possibility.</p></div><nav aria-label="Footer navigation"><a href="#platform">Platform</a><a href="#experiences">Operations</a><a href="#energy">Energy</a><Link to="/login">Sign in ↗</Link></nav><div className="footer-baseline"><span>© {new Date().getFullYear()} Smart Solar Microgrid</span><span>Built around better energy.</span></div></footer>
    </div>
  );
}
