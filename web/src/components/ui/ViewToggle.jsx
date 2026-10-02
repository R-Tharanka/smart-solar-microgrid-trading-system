import { ListBulletIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import Button from './Button';

export default function ViewToggle({ value, onChange, label }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3" aria-label={label}>
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Display</span>
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1" role="group" aria-label={`${label} display mode`}>
        <Button variant={value === 'grid' ? 'secondary' : 'ghost'} icon={Squares2X2Icon} aria-pressed={value === 'grid'} onClick={() => onChange('grid')}>Cards</Button>
        <Button variant={value === 'list' ? 'secondary' : 'ghost'} icon={ListBulletIcon} aria-pressed={value === 'list'} onClick={() => onChange('list')}>List</Button>
      </div>
    </div>
  );
}
