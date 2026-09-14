'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Footer() {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <span className="text-lg font-bold text-slate-900">Shoply</span>
            <p className="mt-2 text-sm text-slate-500">
              A modern storefront for everyday shopping — quality products, fair prices.
            </p>
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
            <h4 className="text-sm font-semibold text-slate-900">Newsletter</h4>
            <p className="mt-2 text-sm text-slate-500">Get updates on new products and offers.</p>
            {subscribed ? (
              <p className="mt-3 animate-fade-in text-sm font-medium text-emerald-600">
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
                  className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-brand-dark active:scale-95"
                >
                  Join
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Shoply. All rights reserved.</p>
          <p>Built with Next.js &middot; Node.js &middot; PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <ul className="mt-2 space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-sm text-slate-500 transition-colors hover:text-brand">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
