import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import { firstValidationMessage, getApiError } from '../../utils/apiError';

const NIC_PATTERN = /^(?:\d{9}[VvXx]|\d{12})$/;
const PHONE_PATTERN = /^\+?[0-9]{9,15}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,128}$/;

export default function ProsumerForm({ prosumer, onSave, onCancel }) {
  const editing = Boolean(prosumer);
  const [form, setForm] = useState({
    nic: prosumer?.nic || '',
    email: prosumer?.email || '',
    firstName: prosumer?.firstName || '',
    lastName: prosumer?.lastName || '',
    phoneNumber: prosumer?.phoneNumber || '',
    address: prosumer?.address || '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!editing && !NIC_PATTERN.test(form.nic.trim())) next.nic = 'Use a 12-digit NIC or 9 digits followed by V or X.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (!PHONE_PATTERN.test(form.phoneNumber.trim())) next.phoneNumber = 'Use 9-15 digits, optionally starting with +.';
    if (form.address.trim().length < 3) next.address = 'Address must contain at least 3 characters.';
    if (!editing && !PASSWORD_PATTERN.test(form.password)) next.password = 'Use 8+ characters with uppercase, lowercase, number and special character, without spaces.';
    if (!editing && form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setSubmitting(true);

    const payload = {
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      address: form.address.trim(),
      ...(!editing ? { nic: form.nic.trim(), password: form.password } : {}),
    };

    try {
      await onSave(payload);
    } catch (error) {
      const apiError = getApiError(error, `The Prosumer account could not be ${editing ? 'updated' : 'created'}.`);
      setSubmitError(apiError.message);
      setErrors((current) => ({
        ...current,
        nic: firstValidationMessage(apiError.validationErrors, 'Nic') || current.nic,
        email: firstValidationMessage(apiError.validationErrors, 'Email') || current.email,
        firstName: firstValidationMessage(apiError.validationErrors, 'FirstName') || current.firstName,
        lastName: firstValidationMessage(apiError.validationErrors, 'LastName') || current.lastName,
        phoneNumber: firstValidationMessage(apiError.validationErrors, 'PhoneNumber') || current.phoneNumber,
        address: firstValidationMessage(apiError.validationErrors, 'Address') || current.address,
        password: firstValidationMessage(apiError.validationErrors, 'Password') || current.password,
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {submitError ? <Alert title={`Account not ${editing ? 'updated' : 'created'}`}>{submitError}</Alert> : null}
      {!editing ? <FormField id="prosumer-nic" label="NIC" value={form.nic} onChange={(event) => update('nic', event.target.value)} error={errors.nic} maxLength={12} disabled={submitting} hint="The NIC is the permanent Prosumer identifier." /> : <div className="rounded-md bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">NIC</p><p className="mt-1 font-mono text-sm text-slate-900">{prosumer.nic}</p></div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="prosumer-first-name" label="First name" value={form.firstName} onChange={(event) => update('firstName', event.target.value)} error={errors.firstName} maxLength={100} disabled={submitting} />
        <FormField id="prosumer-last-name" label="Last name" value={form.lastName} onChange={(event) => update('lastName', event.target.value)} error={errors.lastName} maxLength={100} disabled={submitting} />
      </div>
      <FormField id="prosumer-email" label="Email address" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} error={errors.email} maxLength={320} disabled={submitting} />
      <FormField id="prosumer-phone" label="Phone number" type="tel" value={form.phoneNumber} onChange={(event) => update('phoneNumber', event.target.value)} error={errors.phoneNumber} maxLength={16} disabled={submitting} />
      <FormField as="textarea" id="prosumer-address" label="Address" value={form.address} onChange={(event) => update('address', event.target.value)} error={errors.address} maxLength={300} disabled={submitting} />
      {!editing ? (
        <>
          <div className="relative">
            <FormField id="prosumer-password" label="Temporary password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={(event) => update('password', event.target.value)} error={errors.password} hint="8-128 characters with uppercase, lowercase, number and special character." maxLength={128} disabled={submitting} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-[31px] rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          <FormField id="prosumer-confirm-password" label="Confirm temporary password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} error={errors.confirmPassword} disabled={submitting} />
        </>
      ) : null}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" loading={submitting}>{editing ? 'Save changes' : 'Create Prosumer'}</Button>
      </div>
    </form>
  );
}
