import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import EnergyNetwork from './EnergyNetwork';

export default function OperationsHero({ title, description, to, action, label = 'Connected energy operations' }) {
  return <section className="operations-hero"><div className="operations-hero-copy"><p className="energy-kicker"><span />{label}</p><h2>{title}</h2><p>{description}</p>{to && <Link to={to}>{action}<ArrowUpRightIcon className="h-4 w-4" /></Link>}</div><EnergyNetwork compact /></section>;
}
