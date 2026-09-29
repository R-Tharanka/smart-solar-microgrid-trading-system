import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import { firstValidationMessage, getApiError } from '../../utils/apiError';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,128}$/;

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'GridOperator',
  password: '',
  confirmPassword: '',
};

export default function CreateStaffForm({ onCreate, onCancel }) {
  const [form, setForm] = useState(emptyForm);
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
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!['Backoffice', 'GridOperator'].includes(form.role)) next.role = 'Select a supported staff role.';
    if (!PASSWORD_PATTERN.test(form.password)) next.password = 'Use 8+ characters with uppercase, lowercase, number and special character, without spaces.';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setSubmitting(true);

    try {
      await onCreate({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
      });
    } catch (error) {
      const apiError = getApiError(error, 'The staff account could not be created.');
      setSubmitError(apiError.message);
      setErrors((current) => ({
        ...current,
        email: firstValidationMessage(apiError.validationErrors, 'Email') || current.email,
        password: firstValidationMessage(apiError.validationErrors, 'Password') || current.password,
        firstName: firstValidationMessage(apiError.validationErrors, 'FirstName') || current.firstName,
        lastName: firstValidationMessage(apiError.validationErrors, 'LastName') || current.lastName,
        role: firstValidationMessage(apiError.validationErrors, 'Role') || current.role,
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {submitError ? <Alert title="Account not created">{submitError}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="staff-first-name" label="First name" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} error={errors.firstName} maxLength={100} disabled={submitting} />
        <FormField id="staff-last-name" label="Last name" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} error={errors.lastName} maxLength={100} disabled={submitting} />
      </div>
      <FormField id="staff-email" label="Email address" type="email" autoComplete="off" value={form.email} onChange={(e) => update('email', e.target.value)} error={errors.email} maxLength={320} disabled={submitting} />
      <FormField id="staff-role" label="Staff role" as="select" value={form.role} onChange={(e) => update('role', e.target.value)} error={errors.role} disabled={submitting}>
        <option value="GridOperator">Grid Operator</option>
        <option value="Backoffice">Backoffice</option>
      </FormField>
      <div className="relative">
        <FormField
          id="staff-password"
          label="Temporary password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          error={errors.password}
          hint="8-128 characters with uppercase, lowercase, number and special character."
          maxLength={128}
          disabled={submitting}
        />
        <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-[31px] rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>
          {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
      <FormField id="staff-confirm-password" label="Confirm temporary password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} error={errors.confirmPassword} disabled={submitting} />
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" loading={submitting}>Create staff account</Button>
      </div>
    </form>
  );
}
