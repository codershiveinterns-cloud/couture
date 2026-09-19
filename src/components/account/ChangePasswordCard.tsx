'use client';

import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/context/ToastContext';
import {
  hasErrors,
  PASSWORD_HINT,
  validateChangePasswordInput,
  type ChangePasswordInput,
  type FieldErrors,
} from '@/lib/validation';
import { InlineFormError, SectionCard } from './accountUtils';

type PasswordField = keyof ChangePasswordInput;

const EMPTY: ChangePasswordInput = { currentPassword: '', newPassword: '', confirmPassword: '' };
const FIELD_ORDER: readonly PasswordField[] = ['currentPassword', 'newPassword', 'confirmPassword'];

export function ChangePasswordCard() {
  const { changePassword } = useAuth();
  const formId = useId();
  const [values, setValues] = useState<ChangePasswordInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<PasswordField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState<Record<PasswordField, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const setField = (field: PasswordField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (formError) setFormError(null);
  };

  const focusFirstInvalid = (fieldErrors: FieldErrors<PasswordField>) => {
    const first = FIELD_ORDER.find((f) => fieldErrors[f]);
    if (first) document.getElementById(`${formId}-${first}`)?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const validation = validateChangePasswordInput(values);
    if (hasErrors(validation)) {
      setErrors(validation);
      focusFirstInvalid(validation);
      return;
    }
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      const result = await changePassword(values);
      if (!result.ok) {
        const fieldErrors = (result.fieldErrors ?? {}) as FieldErrors<PasswordField>;
        setErrors(fieldErrors);
        setFormError(hasErrors(fieldErrors) ? null : result.error);
        focusFirstInvalid(fieldErrors);
        return;
      }
      toast.success('Password changed');
      setValues(EMPTY);
      setVisible({ currentPassword: false, newPassword: false, confirmPassword: false });
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (field: PasswordField) => (
    <button
      type="button"
      onClick={() => setVisible((prev) => ({ ...prev, [field]: !prev[field] }))}
      aria-label={visible[field] ? 'Hide password' : 'Show password'}
      aria-pressed={visible[field]}
      className="flex h-8 w-8 items-center justify-center rounded-sm text-ink-3 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        {visible[field] ? (
          <>
            <path d="M3 3l18 18" strokeLinecap="round" />
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 12 5c5 0 9 4 10 7a11 11 0 0 1-3 4M6.6 6.6A11 11 0 0 0 2 12c1 3 5 7 10 7a9.8 9.8 0 0 0 4.4-1" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    </button>
  );

  return (
    <SectionCard title="Change password" description="Choose a strong password you don't use elsewhere.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <InlineFormError message={formError} />
        <Input
          id={`${formId}-currentPassword`}
          label="Current password"
          name="currentPassword"
          type={visible.currentPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          value={values.currentPassword}
          error={errors.currentPassword}
          onChange={(e) => setField('currentPassword', e.target.value)}
          trailingElement={toggle('currentPassword')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id={`${formId}-newPassword`}
            label="New password"
            name="newPassword"
            type={visible.newPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            hint={PASSWORD_HINT}
            value={values.newPassword}
            error={errors.newPassword}
            onChange={(e) => setField('newPassword', e.target.value)}
            trailingElement={toggle('newPassword')}
          />
          <Input
            id={`${formId}-confirmPassword`}
            label="Confirm new password"
            name="confirmPassword"
            type={visible.confirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={values.confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) => setField('confirmPassword', e.target.value)}
            trailingElement={toggle('confirmPassword')}
          />
        </div>
        <div className="mt-1 flex sm:justify-end">
          <Button type="submit" loading={saving} loadingText="Updating…">
            Update password
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

export default ChangePasswordCard;
