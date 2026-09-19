'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormError } from '@/components/auth/FormError';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/context/ToastContext';
import { useResetTokenStatus } from '@/hooks/useResetTokenStatus';
import { RESET_TOKEN_ERRORS } from '@/lib/services/auth';
import {
  hasErrors,
  PASSWORD_HINT,
  validateResetPasswordInput,
  type FieldErrors,
  type ResetPasswordInput,
} from '@/lib/validation';

type ResetErrors = FieldErrors<keyof ResetPasswordInput>;

const STATUS_TITLES = {
  invalid: 'Invalid reset link',
  expired: 'Reset link expired',
  used: 'Reset link already used',
} as const;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const tokenStatus = useResetTokenStatus(token);
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<ResetErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const backToLogin = (
    <Link href="/login" className="font-bold text-brand hover:underline">
      Back to login
    </Link>
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: ResetPasswordInput = { password, confirmPassword };
    const clientErrors = validateResetPasswordInput(input);
    setErrors(clientErrors);
    setFormError(null);
    if (hasErrors(clientErrors)) return;

    setSubmitting(true);
    const result = await resetPassword({ token, ...input });
    if (!result.ok) {
      setErrors((result.fieldErrors as ResetErrors | undefined) ?? {});
      setFormError(result.error);
      setSubmitting(false);
      return;
    }
    // Keep the form frozen: resetting marks the token used, which would otherwise flash the "used" state before navigation.
    setDone(true);
    toast.success('Password updated', { description: 'Sign in with your new password.' });
    router.replace('/login');
  };

  if (tokenStatus === 'loading') {
    return (
      <AuthCard eyebrow="Account recovery" tagline="Verifying your reset link" title="Checking your reset link">
        <div className="flex items-center justify-center py-8 text-ink-4">
          <Spinner size="lg" label="Checking your reset link" />
        </div>
      </AuthCard>
    );
  }

  if (tokenStatus !== 'valid' && !done) {
    return (
      <AuthCard eyebrow="Account recovery" tagline="This link can no longer be used" title={STATUS_TITLES[tokenStatus]} footer={backToLogin}>
        <div className="flex flex-col gap-4">
          <FormError message={RESET_TOKEN_ERRORS[tokenStatus]} />
          <Button href="/forgot-password" size="lg" fullWidth>
            Request a new link
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="Account recovery"
      tagline="Almost there — choose a new password"
      title="New password"
      description="Your reset link is valid. Pick a new password for your account."
      footer={backToLogin}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={formError} />
        <PasswordInput
          id="reset-password"
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={PASSWORD_HINT}
          placeholder="Create a new password"
          disabled={done}
          autoFocus
        />
        <PasswordInput
          id="reset-confirm-password"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          placeholder="Repeat your new password"
          disabled={done}
        />
        <Button type="submit" size="lg" fullWidth loading={submitting || done} loadingText={done ? 'Redirecting…' : 'Updating…'}>
          Reset password
        </Button>
      </form>
    </AuthCard>
  );
}

export default ResetPasswordForm;
