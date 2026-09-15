'use client';

import { useState, type FormEvent } from 'react';

export default function NewsletterBand() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
  };

  return (
    <section aria-labelledby="newsletter-title" className="bg-[linear-gradient(135deg,#ff3f6c,#ff905a)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/85">Members only</p>
            <h2 id="newsletter-title" className="mt-2 text-[30px] font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">
              Get 10% off your first order
            </h2>
            <p className="mt-3 max-w-md text-[14px] text-white/90 sm:text-[15px]">
              Join the list for early access to drops, private sales and style notes. One email a week, never more.
            </p>
          </div>

          <div className="lg:justify-self-end lg:w-full lg:max-w-md">
            {done ? (
              <p
                role="status"
                className="rounded-sm border border-white/40 bg-white/15 px-5 py-4 text-[15px] font-bold backdrop-blur-sm"
              >
                You&rsquo;re in. Check your inbox for the welcome code.
              </p>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
                <label htmlFor="newsletter-band-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-band-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 flex-1 rounded-sm border border-white/40 bg-white/15 px-4 text-[14px] text-white placeholder:text-white/70 backdrop-blur-sm focus:border-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                />
                <button
                  type="submit"
                  className="h-12 shrink-0 rounded-sm bg-white px-6 text-[13px] font-bold uppercase tracking-wide text-brand transition-colors duration-150 hover:bg-brand-light focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Get my code
                </button>
              </form>
            )}
            <p className="mt-3 text-[11px] text-white/75">
              By subscribing you agree to receive marketing emails. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
