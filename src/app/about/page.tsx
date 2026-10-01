import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicyP, PolicyPage, PolicySection } from '@/components/storefront/policy/PolicyPage';
import { buttonClassName } from '@/components/ui/Button';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'About Couture',
  description: 'Couture is a Bengaluru-born online store curating electronics, fashion, home, beauty and sports products with fast shipping and easy returns.',
  path: '/about',
});

const STATS = [
  { value: '5', label: 'Curated categories' },
  { value: '30-day', label: 'Easy returns' },
  { value: '1–2 days', label: 'Order processing' },
];

const VALUES = [
  {
    title: 'Curated, not crowded',
    text: 'Every product is hand-picked by a small team. If we would not buy it for ourselves, it does not go on the site.',
  },
  {
    title: 'Honest pricing',
    text: 'The price you see is the price you pay. Tax and shipping are shown line by line before you confirm, and free shipping kicks in over $50.',
  },
  {
    title: '100% original',
    text: 'We source directly from brands and authorised distributors, so every item is authentic and backed by its manufacturer warranty.',
  },
  {
    title: 'Here when it matters',
    text: 'Real people in Bengaluru answer every support message within one business day, and 30-day returns are picked up from your door.',
  },
];

const CATEGORIES = [
  { href: '/categories/electronics', label: 'Electronics' },
  { href: '/categories/fashion', label: 'Fashion' },
  { href: '/categories/home-and-kitchen', label: 'Home & Kitchen' },
  { href: '/categories/beauty-and-personal-care', label: 'Beauty & Personal Care' },
  { href: '/categories/sports-and-outdoors', label: 'Sports & Outdoors' },
];

export default function AboutPage() {
  return (
    <PolicyPage
      eyebrow="Our story"
      title="About Couture"
      subtitle="Made in India. Curated for everyday life — electronics, fashion, home, beauty and sports, chosen by people who actually use them."
      path="/about"
      hideNav
      wide
    >
      <div className="max-w-3xl">
        <PolicySection id="story" title="How it started">
          <PolicyP>
            Couture began in 2021 in a two-room office on MG Road, Bengaluru, with a simple frustration: online shopping had become endless
            scrolling through near-identical listings. We wanted a store that felt like a well-edited shop window instead &mdash; fewer,
            better products, clearly priced, delivered fast and easy to return if they were not right.
          </PolicyP>
          <PolicyP>
            Today we ship across India and beyond, but the approach has not changed. A small merchandising team tests and curates every
            product across five categories, and our customer-care team sits a few desks away from the people who choose what we sell.
          </PolicyP>
        </PolicySection>
      </div>

      <ul className="mt-10 grid gap-3 sm:grid-cols-3" aria-label="Couture at a glance">
        {STATS.map((stat) => (
          <li key={stat.label} className="rounded-sm border border-line bg-surface px-5 py-6 text-center">
            <p className="text-[28px] font-extrabold leading-none tracking-tight text-brand">{stat.value}</p>
            <p className="mt-2 text-[12px] font-bold uppercase tracking-wide text-ink-3">{stat.label}</p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="values-heading" className="mt-12">
        <h2 id="values-heading" className="text-[18px] font-bold text-ink">
          What we stand for
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {VALUES.map((v) => (
            <li key={v.title} className="rounded-sm border border-line bg-white p-5">
              <h3 className="text-[15px] font-bold text-ink">{v.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{v.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="categories-heading" className="mt-12">
        <h2 id="categories-heading" className="text-[18px] font-bold text-ink">
          What we curate
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className="inline-flex h-10 items-center rounded-sm border border-line-strong bg-white px-4 text-[13px] font-bold uppercase tracking-wide text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12 flex flex-col items-start gap-4 rounded-sm border border-brand/30 bg-brand-light p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[18px] font-bold text-ink">Ready to find something you&rsquo;ll love?</p>
          <p className="mt-1 text-[14px] text-ink-2">Fresh drops every week. Free shipping over $50, 30-day returns on everything eligible.</p>
        </div>
        <Link href="/products" className={buttonClassName({ size: 'lg', className: 'shrink-0' })}>
          Shop all products
        </Link>
      </div>

      <p className="mt-8 text-[13px] text-ink-3">
        Questions? Visit the{' '}
        <Link href="/contact" className="font-bold text-brand underline-offset-2 hover:underline">
          Contact page
        </Link>{' '}
        or browse the{' '}
        <Link href="/faq" className="font-bold text-brand underline-offset-2 hover:underline">
          FAQ
        </Link>
        .
      </p>
    </PolicyPage>
  );
}
