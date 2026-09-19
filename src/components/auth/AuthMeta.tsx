import Link from 'next/link';

/** Myntra-style "By continuing, I agree to the Terms of Use & Privacy Policy" line. */
export function TermsNote() {
  return (
    <p className="text-[12px] leading-relaxed text-ink-3">
      By continuing, I agree to the{' '}
      <span className="font-bold text-brand">Terms of Use</span> &amp;{' '}
      <span className="font-bold text-brand">Privacy Policy</span>
    </p>
  );
}

/** "Have trouble logging in? Get help" line shown under auth forms. */
export function HelpNote({ href = '/forgot-password', label = 'Have trouble logging in?' }: { href?: string; label?: string }) {
  return (
    <p className="text-[12px] text-ink-3">
      {label}{' '}
      <Link href={href} className="font-bold text-brand hover:underline">
        Get help
      </Link>
    </p>
  );
}
