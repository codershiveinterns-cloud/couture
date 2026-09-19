'use client';

import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/context/ToastContext';
import type { User } from '@/lib/services/types';
import { hasErrors, validateProfileInput, type FieldErrors, type ProfileInput } from '@/lib/validation';
import { formatDate, InlineFormError, SectionCard } from './accountUtils';

type ProfileField = keyof ProfileInput;

export function ProfileCard({ user }: { user: User }) {
  const { updateProfile } = useAuth();
  const formId = useId();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<ProfileInput>({ name: user.name, email: user.email, phone: user.phone ?? '' });
  const [errors, setErrors] = useState<FieldErrors<ProfileField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setValues({ name: user.name, email: user.email, phone: user.phone ?? '' });
    setErrors({});
    setFormError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setErrors({});
    setFormError(null);
  };

  const setField = (field: ProfileField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (formError) setFormError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const input: ProfileInput = { name: values.name.trim(), email: user.email, phone: values.phone.trim() };
    const validation = validateProfileInput(input);
    if (hasErrors(validation)) {
      setErrors(validation);
      const first = (['name', 'phone'] as const).find((f) => validation[f]);
      if (first) document.getElementById(`${formId}-${first}`)?.focus();
      return;
    }
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      const result = await updateProfile(input);
      if (!result.ok) {
        const fieldErrors = (result.fieldErrors ?? {}) as FieldErrors<ProfileField>;
        setErrors(fieldErrors);
        setFormError(hasErrors(fieldErrors) ? null : result.error);
        return;
      }
      toast.success('Profile updated');
      setEditing(false);
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Profile details" description="Your name and contact details.">
      {editing ? (
        <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <InlineFormError message={formError} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id={`${formId}-name`}
              label="Full name"
              name="name"
              autoComplete="name"
              required
              autoFocus
              value={values.name}
              error={errors.name}
              onChange={(e) => setField('name', e.target.value)}
            />
            <Input
              id={`${formId}-phone`}
              label="Phone"
              labelAddon="Optional"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+1 555 123 4567"
              value={values.phone}
              error={errors.phone}
              onChange={(e) => setField('phone', e.target.value)}
            />
          </div>
          <Input
            id={`${formId}-email`}
            label="Email"
            name="email"
            type="email"
            value={user.email}
            readOnly
            disabled
            hint="Email can't be changed in the demo."
          />
          <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={cancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} loadingText="Saving…">
              Save details
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <ProfileRow label="Full name" value={user.name} />
            <ProfileRow label="Phone" value={user.phone || 'Not added'} muted={!user.phone} />
            <ProfileRow label="Email" value={user.email} />
            <ProfileRow label="Member since" value={formatDate(user.createdAt)} />
          </dl>
          <div>
            <Button type="button" variant="secondary" size="sm" onClick={startEditing}>
              Edit
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function ProfileRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="min-w-0 border-b border-line pb-3 sm:border-b-0 sm:pb-0">
      <dt className="text-[12px] font-bold uppercase tracking-wide text-ink-3">{label}</dt>
      <dd className={`mt-1 truncate text-[14px] ${muted ? 'text-ink-4' : 'font-medium text-ink'}`}>{value}</dd>
    </div>
  );
}

export default ProfileCard;
