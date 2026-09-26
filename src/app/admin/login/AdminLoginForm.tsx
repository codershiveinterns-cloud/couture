'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormError } from '@/components/auth/FormError';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/context/ToastContext';
import { ADMIN_HOME, safeRedirect } from '@/lib/safeRedirect';
import { DEMO_ADMIN_CREDENTIALS } from '@/lib/services/auth';
import { hasErrors, validateLoginInput, type FieldErrors, type LoginInput } from '@/lib/validation';

type LoginErrors = FieldErrors<keyof LoginInput>;

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const target = safeRedirect(searchParams.get('next'), ADMIN_HOME);
  const { status, isAdmin, user, loginAdmin, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    if (!isAdmin || redirected.current) return;
    redirected.current = true;
    router.replace(target);
  }, [isAdmin, target, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: LoginInput = { email, password };
    const clientErrors = validateLoginInput(input);
    setErrors(clientErrors);
    setFormError(null);
    if (hasErrors(clientErrors)) return;

    setSubmitting(true);
    const result = await loginAdmin(input);
    if (!result.ok) {
      setErrors((result.fieldErrors as LoginErrors | undefined) ?? {});
      setFormError(result.error);
      setSubmitting(false);
      return;
    }
    redirected.current = true;
    toast.success(`Signed in as ${result.data.name}`);
    router.replace(target);
  };

  const fillDemo = () => {
    setEmail(DEMO_ADMIN_CREDENTIALS.email);
    setPassword(DEMO_ADMIN_CREDENTIALS.password);
    setErrors({});
    setFormError(null);
  };

  const signedInCustomer = status === 'authenticated' && !isAdmin && user !== null;
  const busy = submitting || isAdmin;

  return (
    <AuthCard
      eyebrow="Couture Admin"
      tagline="Manage products, orders, payments & customers"
      title="Admin sign in"
      description="Restricted area — store administrators only."
      footer={
        <Link href="/" className="font-bold uppercase text-brand hover:underline">
          ← Back to the store
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={formError} />
        {signedInCustomer && (
          <div className="rounded-sm border border-line bg-surface px-3.5 py-3 text-[13px] text-ink-2">
            You are signed in as <span className="font-bold text-ink">{user.email}</span>, which is not an admin account. Signing in below
            switches to the admin account.{' '}
            <button type="button" onClick={() => logout()} className="font-bold text-brand hover:underline">
              Sign out
            </button>
          </div>
        )}
        <Input
          id="admin-login-email"
          label="Email"
          type="email"
          autoComplete="username"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="admin@example.com"
          autoFocus
        />
        <PasswordInput
          id="admin-login-password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="Your password"
        />
        <Button type="submit" size="lg" fullWidth loading={busy} loadingText="Signing in…">
          Sign in
        </Button>

        <section aria-labelledby="demo-credentials-title" className="rounded-sm border border-dashed border-line-strong bg-[#fff9f2] px-4 py-3.5">
          <h2 id="demo-credentials-title" className="text-[11px] font-bold uppercase tracking-wide text-ink-3">
            Demo credentials
          </h2>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
            <dt className="text-ink-3">Email</dt>
            <dd className="min-w-0 break-all font-bold text-ink">{DEMO_ADMIN_CREDENTIALS.email}</dd>
            <dt className="text-ink-3">Password</dt>
            <dd className="font-bold text-ink">{DEMO_ADMIN_CREDENTIALS.password}</dd>
          </dl>
          <Button variant="secondary" size="sm" className="mt-3" onClick={fillDemo} disabled={busy}>
            Fill demo credentials
          </Button>
          <p className="mt-2 text-[12px] text-ink-3">Demo only — everything is stored in this browser.</p>
        </section>
      </form>
    </AuthCard>
  );
}

export default AdminLoginForm;
