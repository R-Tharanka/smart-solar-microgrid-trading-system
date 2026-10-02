import {
  BoltIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  SignalIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EnergyNetwork from '../components/EnergyNetwork';
import BrandMark from '../components/BrandMark';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';
import { AuthContext } from '../context/AuthContext';
import { firstValidationMessage, getApiError } from '../utils/apiError';
import { homePathForRole } from '../utils/auth';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, sessionNotice, clearSessionNotice } = useContext(AuthContext);
  const navigate = useNavigate();

  const validate = () => {
    const next = {};
    if (identifier.trim().length < 3) next.identifier = 'Enter your staff email address.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearSessionNotice();
    setSubmitError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      const authenticatedUser = await login(identifier, password);
      navigate(homePathForRole(authenticatedUser.role), { replace: true });
    } catch (error) {
      const feedback = getApiError(error, 'Sign in could not be completed.');
      setSubmitError(feedback);
      setErrors({ identifier: firstValidationMessage(feedback.validationErrors, 'Identifier'), password: firstValidationMessage(feedback.validationErrors, 'Password') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-graphite-950">
      <div className="network-grid absolute inset-0" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-graphite-950 via-graphite-950/95 to-graphite-950/75" aria-hidden="true" />
      <header className="relative z-10 mx-auto flex h-20 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Return to homepage"><BrandMark inverse /></Link>
        <Link to="/" className="text-sm font-semibold text-slate-300 transition hover:text-white">Back to home</Link>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1500px] items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_28rem] lg:px-8">
        <section className="hidden max-w-xl lg:block">
          <p className="text-sm font-bold uppercase text-emerald-300" style={{ letterSpacing: '0.08em' }}>Secure operations access</p>
          <h1 className="mt-4 text-5xl font-bold leading-tight text-white">Good energy.<br />Great connections.</h1>
          <p className="mt-5 text-base leading-7 text-slate-300">Your connection to a smarter energy network. Coordinate solar capacity, manage reservations and move energy with confidence.</p>
          <div className="mt-8 flex gap-6 border-t border-white/10 pt-6 text-sm text-slate-400"><span className="flex items-center gap-2"><LockClosedIcon className="h-4 w-4 text-emerald-300" /> Trusted access</span><span className="flex items-center gap-2"><SignalIcon className="h-4 w-4 text-cyan-300" /> Connected energy</span></div>
          <div className="login-network"><EnergyNetwork compact /></div>
        </section>

        <div className="w-full max-w-md justify-self-center lg:justify-self-end">
          <div className="mb-6 text-center lg:hidden"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-emerald-300/40 bg-emerald-400/10 text-emerald-300 shadow-energy"><BoltIcon className="h-7 w-7" /></div><h1 className="mt-4 text-2xl font-bold text-white">Secure workspace access</h1></div>

        <section className="rounded-2xl border border-white/10 bg-[#f6f8f1] p-6 shadow-2xl sm:p-8" aria-labelledby="login-heading">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 id="login-heading" className="text-xl font-semibold text-slate-950">Sign in</h2>
              <p className="mt-1 text-sm text-slate-500">For Backoffice and Grid Operator accounts.</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <LockClosedIcon className="h-4 w-4" aria-hidden="true" /> Secure
            </span>
          </div>

          {sessionNotice ? <Alert type="info" className="mb-5">{sessionNotice}</Alert> : null}
          {submitError ? <Alert className="mb-5" type={submitError.errorCode === 'AUTH_CLIENT_ROLE_FORBIDDEN' ? 'info' : 'error'} title={submitError.title || 'Unable to sign in'}>{submitError.message}</Alert> : null}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <FormField
              id="identifier"
              label="Staff email address"
              type="text"
              autoComplete="username"
              placeholder="Your staff email address"
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                setErrors((current) => ({ ...current, identifier: '' }));
              }}
              error={errors.identifier}
              disabled={isLoading}
            />

            <div>
              <div className="relative">
                <FormField
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrors((current) => ({ ...current, password: '' }));
                  }}
                  error={errors.password}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2 top-[31px] rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={isLoading} className="w-full">
              {isLoading ? 'Authenticating...' : 'Sign in to workspace'}
            </Button>
          </form>
          <p className="mt-5 text-sm text-slate-600">Prosumer? Please sign in through the Smart Solar mobile application.</p>
        </section>

        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-slate-500" aria-hidden="true">
          <span className="flex items-center justify-center gap-1"><SunIcon className="h-4 w-4 text-amber-400" /> Solar</span>
          <span className="flex items-center justify-center gap-1"><SignalIcon className="h-4 w-4 text-cyan-400" /> Grid</span>
          <span className="flex items-center justify-center gap-1"><BoltIcon className="h-4 w-4 text-emerald-400" /> Trading</span>
        </div>
        </div>
      </main>
    </div>
  );
}
