import { MapIcon } from '@heroicons/react/24/outline';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import BrandMark from '../components/BrandMark';
import { AuthContext } from '../context/AuthContext';

export default function NotFound() {
  const { user, homePath } = useContext(AuthContext);
  const navigate = useNavigate();
  return (
    <div className="network-grid flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="app-panel w-full max-w-lg rounded-2xl p-8 text-center">
        <BrandMark className="mb-7 justify-center" />
        <MapIcon className="mx-auto h-12 w-12 text-slate-400" aria-hidden="true" />
        <p className="mt-4 text-sm font-semibold text-emerald-700">404</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Route not found</h1>
        <p className="mt-2 text-sm text-slate-600">The requested workspace route does not exist.</p>
        <Button className="mt-6" onClick={() => navigate(user ? homePath : '/', { replace: true })}>
          {user ? 'Return to workspace' : 'Return home'}
        </Button>
      </div>
    </div>
  );
}
