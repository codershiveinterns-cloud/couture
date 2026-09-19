'use client';

import { useState } from 'react';
import { Input, type InputProps } from '@/components/ui/Input';

export type PasswordInputProps = Omit<InputProps, 'type' | 'trailingElement'>;

export function PasswordInput({ autoComplete = 'current-password', ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      trailingElement={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="flex h-8 w-8 items-center justify-center rounded-sm text-ink-3 outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            {visible ? (
              <>
                <path d="M3 3l18 18" strokeLinecap="round" />
                <path d="M10.6 10.6a2 2 0 002.8 2.8" strokeLinecap="round" />
                <path d="M9.9 5.1A10.4 10.4 0 0112 5c5 0 8.6 3.6 10 7-.5 1.2-1.3 2.4-2.3 3.4M6.6 6.6C4.5 8 3 9.9 2 12c1.4 3.4 5 7 10 7 1.5 0 2.9-.3 4.2-.9" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d="M2 12c1.4-3.4 5-7 10-7s8.6 3.6 10 7c-1.4 3.4-5 7-10 7S3.4 15.4 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      }
      {...props}
    />
  );
}

export default PasswordInput;
