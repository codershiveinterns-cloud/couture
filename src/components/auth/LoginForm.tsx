'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { HelpNote, TermsNote } from '@/components/auth/AuthMeta';
import { FormError } from '@/components/auth/FormError';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/context/ToastContext';
import { buildRegisterHref, safeRedirect } from '@/lib/safeRedirect';
import { hasErrors, validateLoginInput, type FieldErrors, type LoginInput } from '@/lib/validation';

type LoginErrors = FieldErrors<keyof LoginInput>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const target = safeRedirect(nextParam);
  const { status, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || redirected.current) return;
    redirected.current = true;
    router.replace(target);
  }, [status, target, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: LoginInput = { email, password };
    const clientErrors = validateLoginInput(input);
    setErrors(clientErrors);
    setFormError(null);
    if (hasErrors(clientErrors)) return;

    setSubmitting(true);
    const result = await login(input);
    if (!result.ok) {
      setErrors((result.fieldErrors as LoginErrors | undefined) ?? {});
      setFormError(result.error);
      setSubmitting(false);
      return;
    }
    redirected.current = true;
    toast.success(`Welcome back, ${result.data.name.split(' ')[0]}`);
    router.replace(target);
  };

  const busy = submitting || status === 'authenticated';

  return (
    <AuthCard
      eyebrow="Welcome back"
      tagline="Sign in to see your orders, wishlist & more"
      title="Login"
      titleSuffix="or Signup"
      footer={
        <>
          New here?{' '}
          <Link href={buildRegisterHref(nextParam)} className="font-bold uppercase text-brand hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={formError} />
        <Input
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="you@example.com"
          autoFocus
        />
        <PasswordInput
          id="login-password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="Your password"
          labelAddon={
            <Link href="/forgot-password" className="font-bold text-brand hover:underline">
              Forgot password?
            </Link>
          }
        />
        <TermsNote />
        <Button type="submit" size="lg" fullWidth loading={busy} loadingText="Logging in…">
          Login
        </Button>
        <HelpNote />
      </form>
    </AuthCard>
  );
}

export default LoginForm;
