import { CheckBadgeIcon, IdentificationIcon, PowerIcon } from '@heroicons/react/24/outline';
import { useContext, useEffect, useState } from 'react';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FormField from '../../components/ui/FormField';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import { firstValidationMessage, getApiError } from '../../utils/apiError';

const PHONE_PATTERN = /^\+?[0-9]{9,15}$/;

export default function Profile() {
  const { user, refreshUser, logout } = useContext(AuthContext);
  const { notify } = useToast();
  const [form, setForm] = useState({ firstName: '', lastName: '', phoneNumber: '', address: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || '',
    });
  }, [user]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (user.role === 'Prosumer') {
      if (!PHONE_PATTERN.test(form.phoneNumber.trim())) next.phoneNumber = 'Enter 9-15 digits, optionally starting with +.';
      if (form.address.trim().length < 3) next.address = 'Address must contain at least 3 characters.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (event) => {
    event.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setSaving(true);

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      ...(user.role === 'Prosumer' ? {
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim(),
      } : {}),
    };

    try {
      await apiClient.put('/users/me', payload);
      await refreshUser();
      notify('Profile updated successfully.');
    } catch (error) {
      const apiError = getApiError(error, 'Your profile could not be updated.');
      setSubmitError(apiError.message);
      setErrors((current) => ({
        ...current,
        firstName: firstValidationMessage(apiError.validationErrors, 'FirstName') || current.firstName,
        lastName: firstValidationMessage(apiError.validationErrors, 'LastName') || current.lastName,
        phoneNumber: firstValidationMessage(apiError.validationErrors, 'PhoneNumber') || current.phoneNumber,
        address: firstValidationMessage(apiError.validationErrors, 'Address') || current.address,
      }));
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    setDeactivating(true);
    try {
      await apiClient.post('/users/me/deactivate');
      logout('Your account was deactivated. Contact Backoffice if it needs to be restored.');
    } catch (error) {
      notify(getApiError(error, 'Your account could not be deactivated.').message, 'error');
      setDeactivateOpen(false);
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <MainLayout title="My profile">
      <PageHeader eyebrow="Account identity" title="My profile" description="Keep your energy network identity and contact details up to date." />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={save} className="app-panel p-5 sm:p-6" noValidate>
          <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4">
            <IdentificationIcon className="h-6 w-6 text-emerald-600" aria-hidden="true" />
            <div><h2 className="font-semibold text-slate-900">Profile information</h2><p className="text-sm text-slate-500">Role and account status cannot be edited here.</p></div>
          </div>
          {submitError ? <Alert className="mb-5" title="Profile not updated">{submitError}</Alert> : null}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="profile-first-name" label="First name" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} error={errors.firstName} maxLength={100} disabled={saving} />
            <FormField id="profile-last-name" label="Last name" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} error={errors.lastName} maxLength={100} disabled={saving} />
            <FormField id="profile-email" label="Email address" value={user.email} disabled hint="Your sign-in email cannot be changed here." />
            <FormField id="profile-nic" label="NIC" value={user.nic || 'Not applicable for staff'} disabled hint="NIC is only assigned to Prosumer accounts." />
            {user.role === 'Prosumer' ? (
              <>
                <FormField id="profile-phone" label="Phone number" value={form.phoneNumber} onChange={(e) => update('phoneNumber', e.target.value)} error={errors.phoneNumber} maxLength={16} disabled={saving} />
                <FormField id="profile-address" label="Address" as="textarea" value={form.address} onChange={(e) => update('address', e.target.value)} error={errors.address} maxLength={300} disabled={saving} className="sm:col-span-2" />
              </>
            ) : null}
          </div>
          <div className="mt-6 flex justify-end border-t border-slate-200 pt-5">
            <Button type="submit" loading={saving}>Save profile</Button>
          </div>
        </form>

        <aside className="space-y-5">
          <section className="network-grid rounded-lg border border-slate-800 bg-graphite-950 p-5 text-white shadow-energy">
            <CheckBadgeIcon className="h-7 w-7 text-emerald-400" aria-hidden="true" />
            <h2 className="mt-3 font-semibold">Account access</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div><dt className="text-slate-400">Role</dt><dd className="mt-1"><StatusBadge value={user.role} /></dd></div>
              <div><dt className="text-slate-400">Status</dt><dd className="mt-1"><StatusBadge value={user.status} /></dd></div>
              <div><dt className="text-slate-400">Business identifier</dt><dd className="mt-1 break-all font-mono text-xs text-slate-200">{user.id}</dd></div>
            </dl>
          </section>

          {user.role === 'Prosumer' ? (
            <section className="app-panel border-red-200 p-5">
              <h2 className="font-semibold text-slate-900">Account deactivation</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Resolve active reservations before deactivating. Only Backoffice can restore your account.</p>
              <Button className="mt-4 w-full" variant="danger" icon={PowerIcon} onClick={() => setDeactivateOpen(true)}>Deactivate my account</Button>
            </section>
          ) : null}
        </aside>
      </div>

      <ConfirmDialog
        open={deactivateOpen}
        title="Deactivate your account?"
        description="You will be signed out immediately and cannot sign in again until Backoffice reactivates the account."
        confirmLabel="Deactivate my account"
        loading={deactivating}
        onConfirm={deactivate}
        onClose={() => setDeactivateOpen(false)}
      />
    </MainLayout>
  );
}
