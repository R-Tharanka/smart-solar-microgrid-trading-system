import { EyeIcon, EyeSlashIcon, KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useContext, useState } from 'react';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import PageHeader from '../../components/ui/PageHeader';
import { useToast } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import { firstValidationMessage, getApiError } from '../../utils/apiError';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,128}$/;

export default function Security() {
  const { user } = useContext(AuthContext);
  const { notify } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.currentPassword) next.currentPassword = 'Enter your current password.';
    if (!PASSWORD_PATTERN.test(form.newPassword)) next.newPassword = 'Use 8+ characters with uppercase, lowercase, number and special character, without spaces.';
    if (form.newPassword !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.';
    if (form.currentPassword && form.currentPassword === form.newPassword) next.newPassword = 'The new password must differ from the current password.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setSaving(true);
    try {
      await apiClient.post('/users/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      notify('Password changed successfully.');
    } catch (error) {
      const apiError = getApiError(error, 'Your password could not be changed.');
      setSubmitError(apiError.message);
      setErrors((current) => ({
        ...current,
        currentPassword: firstValidationMessage(apiError.validationErrors, 'CurrentPassword') || current.currentPassword,
        newPassword: firstValidationMessage(apiError.validationErrors, 'NewPassword') || current.newPassword,
      }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Account security">
      <PageHeader eyebrow="Authentication" title="Change password" description="Protect your connection to the energy network with a strong, unique password." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,680px)_320px]">
        <form onSubmit={submit} className="app-panel p-5 sm:p-6" noValidate>
          <input type="email" name="username" autoComplete="username" value={user?.email || ''} readOnly className="sr-only" tabIndex={-1} aria-hidden="true" />
          <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4">
            <KeyIcon className="h-6 w-6 text-emerald-600" aria-hidden="true" />
            <h2 className="font-semibold text-slate-900">Password credentials</h2>
          </div>
          {submitError ? <Alert className="mb-5" title="Password not changed">{submitError}</Alert> : null}
          <div className="space-y-5">
            <FormField id="current-password" label="Current password" type={visible ? 'text' : 'password'} autoComplete="current-password" value={form.currentPassword} onChange={(e) => update('currentPassword', e.target.value)} error={errors.currentPassword} disabled={saving} />
            <FormField id="new-password" label="New password" type={visible ? 'text' : 'password'} autoComplete="new-password" value={form.newPassword} onChange={(e) => update('newPassword', e.target.value)} error={errors.newPassword} hint="8-128 characters with uppercase, lowercase, number and special character." disabled={saving} />
            <FormField id="confirm-password" label="Confirm new password" type={visible ? 'text' : 'password'} autoComplete="new-password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} error={errors.confirmPassword} disabled={saving} />
            <button type="button" onClick={() => setVisible((current) => !current)} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950" aria-label={visible ? 'Hide all passwords' : 'Show all passwords'}>
              {visible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              {visible ? 'Hide passwords' : 'Show passwords'}
            </button>
          </div>
          <div className="mt-6 flex justify-end border-t border-slate-200 pt-5">
            <Button type="submit" loading={saving}>Change password</Button>
          </div>
        </form>

        <aside className="network-grid rounded-2xl border border-emerald-900 bg-graphite-950 p-5 text-white shadow-energy xl:self-start">
          <ShieldCheckIcon className="h-7 w-7 text-cyan-700" aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-white">Security notes</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            <li>Use a unique password for this system.</li>
            <li>Confirm your current password before choosing a new one.</li>
            <li>No password is written to browser storage.</li>
          </ul>
        </aside>
      </div>
    </MainLayout>
  );
}
