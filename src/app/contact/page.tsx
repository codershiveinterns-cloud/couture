import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import ContactForm from '@/components/storefront/contact/ContactForm';
import { PolicyPage } from '@/components/storefront/policy/PolicyPage';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Contact us',
  description: 'Get in touch with Couture customer care about an order, return, payment or product. Email, phone, hours and address.',
  path: '/contact',
});

const ICON = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

const CARDS: { title: string; icon: ReactNode; body: ReactNode }[] = [
  {
    title: 'Email',
    icon: (
      <svg {...ICON}>
        <rect x="3" y="5" width="18" height="14" rx="1" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
    body: (
      <>
        <a href="mailto:support@couture.test" className="font-bold text-ink underline-offset-2 hover:underline">
          support@couture.test
        </a>
        <span className="block text-[13px] text-ink-3">Replies within 1 business day</span>
      </>
    ),
  },
  {
    title: 'Phone',
    icon: (
      <svg {...ICON}>
        <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
      </svg>
    ),
    body: (
      <>
        <a href="tel:+918012345678" className="font-bold text-ink underline-offset-2 hover:underline">
          +91 80 1234 5678
        </a>
        <span className="block text-[13px] text-ink-3">Mon&ndash;Sat, 9am&ndash;7pm IST</span>
      </>
    ),
  },
  {
    title: 'Hours',
    icon: (
      <svg {...ICON}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
    body: (
      <>
        <span className="font-bold text-ink">Monday to Saturday</span>
        <span className="block text-[13px] text-ink-3">9:00am &ndash; 7:00pm IST, closed on public holidays</span>
      </>
    ),
  },
  {
    title: 'Address',
    icon: (
      <svg {...ICON}>
        <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
    body: (
      <address className="not-italic">
        <span className="font-bold text-ink">Couture Retail Pvt. Ltd.</span>
        <span className="block text-[13px] text-ink-3">12 MG Road, Bengaluru 560001, India</span>
      </address>
    ),
  },
];

export default function ContactPage() {
  return (
    <PolicyPage
      title="Contact us"
      subtitle="Questions about an order, a return or a product? Tell us what you need and our Bengaluru team will get back to you."
      path="/contact"
      wide
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <ContactForm />

        <aside aria-labelledby="contact-details-heading" className="flex flex-col gap-4">
          <h2 id="contact-details-heading" className="text-[12px] font-bold uppercase tracking-wide text-ink-3">
            Other ways to reach us
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {CARDS.map((card) => (
              <li key={card.title} className="flex gap-3.5 rounded-sm border border-line bg-white p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-brand">{card.icon}</span>
                <div className="min-w-0 text-[14px] leading-snug">
                  <p className="text-[12px] font-bold uppercase tracking-wide text-ink-3">{card.title}</p>
                  <div className="mt-1">{card.body}</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-sm border border-line bg-surface p-4">
            <p className="text-[12px] font-bold uppercase tracking-wide text-ink">Faster answers</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-[14px]">
              <li>
                <Link href="/track" className="font-bold text-brand underline-offset-2 hover:underline">
                  Track your order &rarr;
                </Link>
                <span className="block text-[13px] text-ink-3">Live status with your order number and email.</span>
              </li>
              <li>
                <Link href="/faq" className="font-bold text-brand underline-offset-2 hover:underline">
                  Read the FAQ &rarr;
                </Link>
                <span className="block text-[13px] text-ink-3">Shipping, payments, returns and account help.</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </PolicyPage>
  );
}
