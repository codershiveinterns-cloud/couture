import Image from 'next/image';
import Link from 'next/link';

/**
 * Couture brand assets (public/brand/*): the emblem — a "C" wrapped by a hanger
 * hook and a swoosh — and the COUTURE · MADE IN INDIA wordmark, both cut from
 * the supplied artwork with a transparent background.
 */
const MARK = { src: '/brand/mark.png', width: 512, height: 512 };
const WORDMARK = { src: '/brand/wordmark.png', width: 676, height: 176 };
const LOCKUP = { src: '/brand/logo-lockup.png', width: 686, height: 520 };

export function LogoMark({ className = '', priority = false }: { className?: string; priority?: boolean; id?: string }) {
  return (
    <Image
      src={MARK.src}
      width={MARK.width}
      height={MARK.height}
      alt="Couture"
      priority={priority}
      className={`object-contain ${className}`}
    />
  );
}

/** Wordmark image; `tagline` keeps the "· MADE IN INDIA ·" line (it is part of the artwork). */
export function Wordmark({ className = '' }: { className?: string; tagline?: boolean }) {
  return (
    <Image
      src={WORDMARK.src}
      width={WORDMARK.width}
      height={WORDMARK.height}
      alt=""
      aria-hidden="true"
      className={`h-auto object-contain ${className}`}
    />
  );
}

/** Stacked emblem + wordmark, as in the original logo sheet. */
export function LogoLockup({ className = '' }: { className?: string }) {
  return (
    <Image src={LOCKUP.src} width={LOCKUP.width} height={LOCKUP.height} alt="Couture — Made in India" className={`h-auto object-contain ${className}`} />
  );
}

export default function Logo({
  className = '',
  markClassName = 'h-10 w-10',
  wordmarkClassName = 'w-[118px]',
  showWordmark = true,
  priority = false,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
  tagline?: boolean;
  priority?: boolean;
  id?: string;
}) {
  return (
    <Link href="/" aria-label="Couture home" className={`flex shrink-0 items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} priority={priority} />
      {showWordmark && (
        <span className="flex items-center">
          <Wordmark className={wordmarkClassName} />
        </span>
      )}
    </Link>
  );
}
