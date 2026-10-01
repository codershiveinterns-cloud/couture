import type { Metadata } from 'next';
import { PolicyLink, PolicyP, PolicyPage } from '@/components/storefront/policy/PolicyPage';
import { pageMetadata, type JsonLd } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'FAQ',
  description: 'Answers to common questions about Couture orders, shipping, payments, returns, refunds, coupons and your account.',
  path: '/faq',
});

interface Faq {
  q: string;
  /** Plain-text answer (also used for the FAQPage JSON-LD). */
  a: string;
  /** Optional follow-up link rendered under the answer. */
  link?: { href: string; label: string };
}

interface FaqGroup {
  id: string;
  title: string;
  items: Faq[];
}

const GROUPS: FaqGroup[] = [
  {
    id: 'orders',
    title: 'Orders & Shipping',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Orders are processed within 1–2 business days and standard shipping takes a further 3–5 business days. Remote addresses can take a little longer.',
        link: { href: '/shipping', label: 'Read the shipping policy' },
      },
      {
        q: 'How much does shipping cost?',
        a: 'Shipping is free on orders over $50 after any coupon discount. Orders at or below $50 are charged a flat $5.99. The bag page tells you how much more you need to add to qualify for free shipping.',
      },
      {
        q: 'How do I track my order?',
        a: 'Use the Track order page with your order number (it starts with CTR-) and the email you used at checkout. Signed-in customers can also open Account → Orders to see the full status timeline. We email and text you the tracking number as soon as the parcel ships.',
        link: { href: '/track', label: 'Track an order' },
      },
      {
        q: 'What do the order statuses mean?',
        a: 'Placed: we have received your order. Confirmed: payment is verified and the order is accepted. Processing: it is being picked and packed. Shipped: it is with the carrier. Out for delivery: it will arrive today. Delivered: it has been handed over. Cancelled and Refunded are the two end states for orders that do not complete.',
      },
      {
        q: 'Which carriers do you use?',
        a: 'We ship with FedEx, UPS, DHL, USPS, Blue Dart and Delhivery, choosing the fastest reliable option for your address. The carrier for your order is shown alongside the tracking number.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    items: [
      {
        q: 'Which payment methods do you accept?',
        a: 'Credit and debit cards, UPI, and cash on delivery (COD). Card and UPI payments are taken when you place the order; COD is paid to the courier at the door.',
      },
      {
        q: 'Is tax included in the price?',
        a: 'Product prices are shown before tax. An 8% sales tax is calculated on the discounted subtotal and shown as a separate line on the checkout review step, so the total you see before confirming is exactly what you pay.',
      },
      {
        q: 'How do coupon codes work?',
        a: 'Enter the code in your bag or at checkout. WELCOME10 gives 10% off orders of $30 or more (up to $25 off) and FLAT5 gives $5 off orders of $20 or more. One coupon per order; the discount is applied before tax and shipping are calculated.',
      },
      {
        q: 'Is it safe to pay by card on Couture?',
        a: 'Yes. Card and UPI payments are processed by our payment provider over an encrypted connection. Your full card number and CVV are never stored on Couture servers.',
        link: { href: '/privacy', label: 'See the privacy policy' },
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns & Refunds',
    items: [
      {
        q: 'Can I cancel my order?',
        a: 'Yes, as long as it has not shipped. Open Account → Orders, select the order and choose Cancel order. Once the status is Shipped, cancellation is no longer possible, but you can return the item within 30 days of delivery. Partial cancellation is not supported.',
        link: { href: '/cancellation', label: 'Read the cancellation policy' },
      },
      {
        q: 'What is your returns policy?',
        a: 'Most items can be returned within 30 days of delivery if they are unused, unwashed and in their original packaging with tags. Opened beauty and personal-care products, innerwear, swimwear and final-sale items cannot be returned unless they are faulty.',
        link: { href: '/returns', label: 'Read the returns policy' },
      },
      {
        q: 'How do I start a return?',
        a: 'Send your order number, the items and the reason through the Contact page (choose the Returns topic) or email support@couture.test. We confirm eligibility within 1 business day and arrange a free pickup or send drop-off instructions.',
        link: { href: '/contact', label: 'Contact us' },
      },
      {
        q: 'When will I get my refund?',
        a: 'Card and UPI refunds appear in 5–7 business days after they are issued. For cash-on-delivery returns we refund by bank transfer to the account you give us, also within 5–7 business days of the item passing inspection. Cancelled COD orders need no refund because nothing was charged.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    items: [
      {
        q: 'I forgot my password. What do I do?',
        a: 'Go to the Forgot password page, enter your account email and follow the reset link we send you. The link expires after a short time, so request a new one if it has stopped working.',
        link: { href: '/forgot-password', label: 'Reset your password' },
      },
      {
        q: 'Do I need an account to shop?',
        a: 'No — you can check out as a guest. An account lets you save addresses, see your order history, keep a wishlist across devices and cancel orders yourself from Account → Orders.',
        link: { href: '/register', label: 'Create an account' },
      },
      {
        q: 'How do I update my address or details?',
        a: 'Sign in and open your Account page. You can edit your name, phone number and saved addresses there. Changes do not affect orders that have already shipped.',
      },
    ],
  },
];

const SECTIONS = GROUPS.map((g) => ({ id: g.id, title: g.title }));

const FAQ_JSON_LD: JsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: GROUPS.flatMap((g) =>
    g.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  ),
};

export default function FaqPage() {
  return (
    <PolicyPage
      title="Frequently asked questions"
      subtitle={
        <>
          Quick answers about orders, payments, returns and your account. Can&rsquo;t find what you need?{' '}
          <PolicyLink href="/contact">Contact us</PolicyLink> and we&rsquo;ll reply within 1 business day.
        </>
      }
      path="/faq"
      sections={SECTIONS}
      jsonLd={[FAQ_JSON_LD]}
    >
      {GROUPS.map((group, gi) => (
        <section key={group.id} id={group.id} aria-labelledby={`${group.id}-heading`} className={`scroll-mt-28 ${gi > 0 ? 'mt-10' : ''}`}>
          <h2 id={`${group.id}-heading`} className="text-[18px] font-bold text-ink">
            {group.title}
          </h2>
          <div className="mt-3 divide-y divide-line border-y border-line">
            {group.items.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-bold text-ink transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <svg
                    aria-hidden="true"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-180"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </summary>
                <div className="animate-fade-in pb-5">
                  <PolicyP>{item.a}</PolicyP>
                  {item.link && (
                    <p className="mt-2 text-[14px]">
                      <PolicyLink href={item.link.href}>{item.link.label} &rarr;</PolicyLink>
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </PolicyPage>
  );
}
