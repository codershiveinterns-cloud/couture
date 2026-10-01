import Link from 'next/link';

/** The customer-service pages, in the order they appear in the footer and the policy strip. */
export const POLICY_PAGES = [
  { href: '/contact', label: 'Contact us' },
  { href: '/faq', label: 'FAQ' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/track', label: 'Track order' },
  { href: '/shipping', label: 'Shipping' },
  { href: '/cancellation', label: 'Cancellation' },
  { href: '/returns', label: 'Returns & refunds' },
  { href: '/privacy', label: 'Privacy policy' },
] as const;

/** Horizontal strip of links between the policy pages; the current page is highlighted. */
export function PolicyNav({ current }: { current: string }) {
  return (
    <nav aria-label="Customer service pages" className="mt-6 -mx-4 border-y border-line px-4 sm:mx-0 sm:px-0">
      <ul className="no-scrollbar flex gap-1 overflow-x-auto">
        {POLICY_PAGES.map((page) => {
          const active = page.href === current;
          return (
            <li key={page.href} className="shrink-0">
              <Link
                href={page.href}
                aria-current={active ? 'page' : undefined}
                className={`-mb-px block border-b-2 px-3 py-3 text-[13px] font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink ${
                  active ? 'border-brand text-brand' : 'border-transparent text-ink-3 hover:border-ink hover:text-ink'
                }`}
              >
                {page.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default PolicyNav;
