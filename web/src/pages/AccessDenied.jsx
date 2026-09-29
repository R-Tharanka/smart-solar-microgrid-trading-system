import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import BrandMark from '../components/BrandMark';
import { AuthContext } from '../context/AuthContext';

export default function AccessDenied() {
  const { homePath } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="network-grid flex min-h-screen items-center justify-center bg-graphite-950 px-4">
      <div className="w-full max-w-lg rounded-lg border border-white/10 bg-graphite-900 p-8 text-center shadow-energy">
        <BrandMark className="mb-7 justify-center" inverse />
        <ShieldExclamationIcon className="mx-auto h-12 w-12 text-amber-400" aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-semibold text-white">Access restricted</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">Your account is authenticated, but this area is not available for your role. API authorization remains the final security boundary.</p>
        <Button className="mt-6" onClick={() => navigate(homePath, { replace: true })}>Return to your workspace</Button>
      </div>
    </div>
  );
}
