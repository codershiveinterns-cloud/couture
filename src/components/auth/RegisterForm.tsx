'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { HelpNote } from '@/components/auth/AuthMeta';
import { FormError } from '@/components/auth/FormError';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/context/ToastContext';
import { buildLoginHref, safeRedirect } from '@/lib/safeRedirect';
import {
  hasErrors,
  PASSWORD_HINT,
  validateRegisterInput,
  type FieldErrors,
  type RegisterInput,
} from '@/lib/validation';

type RegisterErrors = FieldErrors<keyof RegisterInput | 'terms'>;

const TERMS_ERROR = 'Please accept the terms to continue';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const target = safeRedirect(nextParam);
  const { status, register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
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
    const input: RegisterInput = { name, email, password, confirmPassword };
    const clientErrors: RegisterErrors = { ...validateRegisterInput(input) };
    if (!acceptedTerms) clientErrors.terms = TERMS_ERROR;
    setErrors(clientErrors);
    setFormError(null);
    if (hasErrors(clientErrors)) return;

    setSubmitting(true);
    const result = await register(input);
    if (!result.ok) {
      setErrors((result.fieldErrors as RegisterErrors | undefined) ?? {});
      setFormError(result.error);
      setSubmitting(false);
      return;
    }
    redirected.current = true;
    toast.success('Account created', { description: `Welcome to Couture, ${result.data.name.split(' ')[0]}!` });
    router.replace(target);
  };

  const busy = submitting || status === 'authenticated';

  return (
    <AuthCard
      eyebrow="Join Couture"
      tagline="Save your cart, wishlist and track every order"
      title="Signup"
      titleSuffix="or Login"
      footer={
        <>
          Already have an account?{' '}
          <Link href={buildLoginHref(nextParam)} className="font-bold uppercase text-brand hover:underline">
            Login
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={formError} />
        <Input
          id="register-name"
          label="Full name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="Jane Doe"
          autoFocus
        />
        <Input
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="you@example.com"
        />
        <PasswordInput
          id="register-password"
          label="Password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={PASSWORD_HINT}
          placeholder="Create a password"
        />
        <PasswordInput
          id="register-confirm-password"
          label="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          placeholder="Repeat your password"
        />
        <Checkbox
          id="register-terms"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          error={errors.terms}
          label={
            <span className="text-[12px] leading-relaxed text-ink-3">
              By continuing, I agree to the{' '}
              <Link href="/terms" target="_blank" rel="noopener" className="font-bold text-brand hover:underline">
                Terms of Use
              </Link>{' '}
              &amp;{' '}
              <Link href="/privacy" target="_blank" rel="noopener" className="font-bold text-brand hover:underline">
                Privacy Policy
              </Link>
            </span>
          }
        />
        <Button type="submit" size="lg" fullWidth loading={busy} loadingText="Creating account…">
          Create account
        </Button>
        <HelpNote label="Have trouble signing up?" />
      </form>
    </AuthCard>
  );
}

export default RegisterForm;
