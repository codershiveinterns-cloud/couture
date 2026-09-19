'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormError } from '@/components/auth/FormError';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import type { ForgotPasswordResult } from '@/lib/services/types';
import { hasErrors, validateForgotPasswordInput, type FieldErrors } from '@/lib/validation';

export function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FieldErrors<'email'>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ForgotPasswordResult | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clientErrors = validateForgotPasswordInput({ email });
    setErrors(clientErrors);
    setFormError(null);
    if (hasErrors(clientErrors)) return;

    setSubmitting(true);
    const response = await requestPasswordReset(email);
    setSubmitting(false);
    if (!response.ok) {
      setErrors((response.fieldErrors as FieldErrors<'email'> | undefined) ?? {});
      setFormError(response.error);
      return;
    }
    setResult(response.data);
  };

  const backToLogin = (
    <Link href="/login" className="font-bold text-brand hover:underline">
      Back to login
    </Link>
  );

  if (result) {
    return (
      <AuthCard eyebrow="Check your inbox" tagline="Your reset link is on its way" title="Reset link sent" footer={backToLogin}>
        <div className="flex flex-col gap-5">
          <div
            role="status"
            className="flex items-start gap-3 rounded-sm border border-success/40 bg-[#e6f7f3] px-4 py-3 text-[13px] text-ink-2"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mt-0.5 shrink-0 text-success"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M8.5 12.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{result.message}</span>
          </div>

          {result.demoResetPath && (
            <div className="rounded-sm border border-line bg-surface p-4">
              <p className="text-[12px] font-bold uppercase tracking-wide text-brand">Demo mode: reset link</p>
              <p className="mt-1.5 text-[13px] text-ink-2">
                Couture has no email service yet, so your reset link is shown here instead. It works once and expires in 30 minutes.
              </p>
              <Button href={result.demoResetPath} size="md" fullWidth className="mt-3">
                Open reset link
              </Button>
              <p className="mt-2 break-all text-[12px] text-ink-3">{result.demoResetPath}</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setResult(null)}
            className="self-start text-[12px] font-bold uppercase tracking-wide text-ink-2 transition-colors hover:text-brand"
          >
            Use a different email
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="Forgot password?"
      tagline="No worries, we will help you reset it"
      title="Account recovery"
      description="Enter the email for your account and we'll send you a link to reset your password."
      footer={backToLogin}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={formError} />
        <Input
          id="forgot-email"
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
        <Button type="submit" size="lg" fullWidth loading={submitting} loadingText="Sending…">
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}

export default ForgotPasswordForm;
