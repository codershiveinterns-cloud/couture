'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Logo from '@/components/Logo';

const ONLINE_SHOPPING = [
  { href: '/categories/electronics', label: 'Electronics' },
  { href: '/categories/fashion', label: 'Fashion' },
  { href: '/categories/home-and-kitchen', label: 'Home & Kitchen' },
  { href: '/categories/beauty-and-personal-care', label: 'Beauty & Personal Care' },
  { href: '/categories/sports-and-outdoors', label: 'Sports & Outdoors' },
  { href: '/products', label: 'All Products' },
  { href: '/about', label: 'About us' },
];

const MY_ACCOUNT = [
  { href: '/login', label: 'Sign in' },
  { href: '/register', label: 'Create account' },
  { href: '/account/orders', label: 'My orders' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/cart', label: 'Bag' },
];

const CUSTOMER_POLICIES = [
  { href: '/contact', label: 'Contact Us' },
  { href: '/faq', label: 'FAQ' },
  { href: '/terms', label: 'T&C' },
  { href: '/track', label: 'Track Orders' },
  { href: '/shipping', label: 'Shipping' },
  { href: '/cancellation', label: 'Cancellation' },
  { href: '/returns', label: 'Returns' },
  { href: '/privacy', label: 'Privacy policy' },
];

const POPULAR_SEARCHES = [
  'Headphones',
  'Running Shoes',
  'Smart Watch',
  'Skincare',
  'Laptop Bags',
  'Yoga Mat',
  'Coffee Maker',
  'Sunglasses',
  'Backpacks',
  'Perfume',
  'Bluetooth Speaker',
  'Water Bottle',
];

const SOCIALS = [
  {
    label: 'Facebook',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.4 0-4.1 1.5-4.1 4.2v2.3H7.5V14h2.7v8h3.3z" />
      </svg>
    ),
  },
  {
    label: 'X',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.5 3h3.1l-6.8 7.8L21.8 21h-6.3l-4.9-6.4L5 21H1.9l7.3-8.3L1.5 3h6.4l4.4 5.9L17.5 3zm-1.1 16.2h1.7L6.9 4.7H5.1l11.3 14.5z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2C.5 9.1.5 12 .5 12s0 2.9.5 4.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.8.5-4.8s0-2.9-.5-4.8zM9.7 15.1V8.9l6 3.1-6 3.1z" />
      </svg>
    ),
  },
];

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

const PROMISES = [
  {
    title: 'Free shipping',
    text: 'On all orders over $50',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h4l3 3v3h-7" />
        <circle cx="7" cy="18" r="1.8" />
        <circle cx="17" cy="18" r="1.8" />
      </svg>
    ),
  },
  {
    title: '30-day easy returns',
    text: 'Hassle-free pickup from your door',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 8v4l3 2" />
      </svg>
    ),
  },
  {
    title: '100% original products',
    text: 'Authenticity guaranteed on every item',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 2l7 3v6c0 5-3.2 8.6-7 11-3.8-2.4-7-6-7-11V5l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

export default function Footer() {
  const [subscribed, setSubscribed] = useState(false);
  const pathname = usePathname();

  // The admin area ships its own chrome.
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="mt-16 bg-surface text-ink">
      {/* Brand promise band */}
      <div className="border-b border-line bg-white">
        <ul className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-line px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
          {PROMISES.map((item) => (
            <li key={item.title} className="flex items-center gap-4 py-4 sm:justify-center sm:px-4 sm:py-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong text-brand" aria-hidden="true">
                {item.icon}
              </span>
              <span className="flex flex-col">
                <span className="text-[13px] font-bold uppercase tracking-[0.3px] text-ink">{item.title}</span>
                <span className="text-[13px] text-ink-3">{item.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_1.4fr]">
          <FooterColumn title="Online Shopping" links={ONLINE_SHOPPING} />
          <FooterColumn title="My Account" links={MY_ACCOUNT} />
          <FooterColumn title="Customer Policies" links={CUSTOMER_POLICIES} />

          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <h4 className={HEADING_CLASS}>Keep in Touch</h4>
            <div className="mt-4 flex gap-2.5">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  onClick={(e) => e.preventDefault()}
                  title={`${s.label} — coming soon`}
                  className="flex h-9 w-9 items-center justify-center rounded-sm border border-line-strong bg-white text-ink-2 transition-colors duration-150 hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  {s.icon}
                </a>
              ))}
            </div>

            <div className="mt-6">
              <h4 className={HEADING_CLASS}>Newsletter</h4>
              <p className="mt-2 text-[13px] text-ink-3">New drops, offers and style notes — no spam.</p>
              {subscribed ? (
                <p className="mt-3 animate-fade-in text-[14px] font-bold text-success">Thanks — you&rsquo;re on the list!</p>
              ) : (
                <form
                  className="mt-3 flex max-w-md"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubscribed(true);
                  }}
                >
                  <label htmlFor="footer-newsletter" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="footer-newsletter"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="h-10 w-full min-w-0 rounded-l-sm border border-r-0 border-line bg-white px-3 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-ink"
                  />
                  <button
                    type="submit"
                    className="h-10 shrink-0 rounded-r-sm bg-brand px-4 text-[12px] font-bold uppercase tracking-wide text-white transition-colors duration-150 hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Popular searches */}
        <div className="mt-8 border-t border-line pt-6">
          <h4 className={HEADING_CLASS}>Popular Searches</h4>
          <p className="mt-3 text-[13px] leading-6 text-ink-3">
            {POPULAR_SEARCHES.map((term, i) => (
              <span key={term}>
                {i > 0 && <span className="mx-2 text-ink-4">|</span>}
                <Link href={`/products?q=${encodeURIComponent(term)}`} className="transition-colors hover:text-ink">
                  {term}
                </Link>
              </span>
            ))}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <Logo id="footer-mark" markClassName="h-11 w-11" tagline />
          <div className="flex flex-col gap-1 sm:items-end">
            <p>&copy; {new Date().getFullYear()} Couture. All rights reserved.</p>
            <p className="text-ink-4">Prices shown in USD.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

const HEADING_CLASS = 'text-[12px] font-bold uppercase tracking-wide text-ink';

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className={HEADING_CLASS}>{title}</h4>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-[14px] text-ink-2 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}


