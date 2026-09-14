'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Footer() {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <span className="font-display text-2xl font-semibold tracking-tight">Shoply</span>
            <p className="mt-3 max-w-[22ch] text-sm text-white/50">
              A modern storefront for everyday shopping — quality products, fair prices.
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  onClick={(e) => e.preventDefault()}
                  title={`${s.label} — coming soon`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/60 transition-all duration-150 hover:border-brand hover:bg-brand hover:text-white"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <FooterColumn
            title="Shop"
            links={[
              { href: '/products', label: 'All Products' },
              { href: '/products?sort=newest', label: 'New Arrivals' },
              { href: '/products?featured=true', label: 'Featured' },
            ]}
          />
          <FooterColumn
            title="Company"
            links={[
              { href: '#', label: 'About Us' },
              { href: '#', label: 'Contact' },
              { href: '#', label: 'Careers' },
            ]}
          />
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">Newsletter</h4>
            <p className="mt-3 text-sm text-white/60">Get updates on new products and offers.</p>
            {subscribed ? (
              <p className="mt-3 animate-fade-in text-sm font-medium text-emerald-400">
                Thanks — you&rsquo;re on the list! ✓
              </p>
            ) : (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubscribed(true);
                }}
              >
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full min-w-0 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-brand focus:ring-4 focus:ring-brand/20"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-brand-dark active:scale-95"
                >
                  Join
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Shoply. All rights reserved.</p>
          <p>Built with Next.js &middot; Node.js &middot; PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
}

const SOCIALS = [
  { label: 'Instagram', icon: '◎' },
  { label: 'X', icon: '✕' },
  { label: 'Facebook', icon: 'f' },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">{title}</h4>
      <ul className="mt-3 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-sm text-white/70 transition-colors hover:text-brand">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
