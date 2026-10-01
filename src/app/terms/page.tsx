import type { Metadata } from 'next';
import { PolicyCallout, PolicyLink, PolicyList, PolicyP, PolicyPage, PolicySection } from '@/components/storefront/policy/PolicyPage';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Terms & Conditions',
  description: 'The terms that govern your use of Couture: accounts, orders and pricing, payments, shipping, returns, coupons, reviews and liability.',
  path: '/terms',
});

const LAST_UPDATED = '1 October 2026';

const SECTIONS = [
  { id: 'acceptance', title: 'Acceptance of these terms' },
  { id: 'account', title: 'Your account' },
  { id: 'orders', title: 'Orders & pricing' },
  { id: 'payments', title: 'Payments' },
  { id: 'shipping', title: 'Shipping & delivery' },
  { id: 'returns', title: 'Cancellations & returns' },
  { id: 'coupons', title: 'Coupons & promotions' },
  { id: 'reviews', title: 'Reviews & user content' },
  { id: 'ip', title: 'Intellectual property' },
  { id: 'liability', title: 'Limitation of liability' },
  { id: 'law', title: 'Governing law' },
  { id: 'contact', title: 'Contact' },
] as const;

export default function TermsPage() {
  return (
    <PolicyPage title="Terms & Conditions" subtitle={`Last updated: ${LAST_UPDATED}`} path="/terms" sections={SECTIONS}>
      <PolicySection id="acceptance" title="1. Acceptance of these terms">
        <PolicyP>
          These Terms &amp; Conditions (&ldquo;Terms&rdquo;) are an agreement between you and Couture Retail Pvt. Ltd. (&ldquo;Couture&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;). They apply whenever you browse the Couture website, create an account, place an order or use any
          of our services. By using the site you confirm that you have read and accept these Terms together with our{' '}
          <PolicyLink href="/privacy">Privacy policy</PolicyLink>, <PolicyLink href="/shipping">Shipping policy</PolicyLink>,{' '}
          <PolicyLink href="/cancellation">Cancellation policy</PolicyLink> and <PolicyLink href="/returns">Returns &amp; refunds policy</PolicyLink>, which
          form part of this agreement.
        </PolicyP>
        <PolicyP>
          If you do not agree with any part of these Terms, please do not use the site. We may update these Terms from time to time; the
          &ldquo;Last updated&rdquo; date at the top of this page tells you when the current version took effect. Continued use of the site
          after a change means you accept the updated Terms.
        </PolicyP>
      </PolicySection>

      <PolicySection id="account" title="2. Your account">
        <PolicyP>
          You must be at least 18 years old, or using the site under the supervision of a parent or legal guardian, to place an order. When you
          create an account you agree to:
        </PolicyP>
        <PolicyList
          items={[
            'Provide accurate, current information and keep it up to date.',
            'Keep your password confidential and not share your account with anyone else.',
            'Tell us straight away if you believe your account has been accessed without permission.',
            'Accept responsibility for all activity that happens under your account.',
          ]}
        />
        <PolicyP>
          You can reset a forgotten password at any time from the <PolicyLink href="/forgot-password">Forgot password</PolicyLink> page. We may
          suspend or close accounts that breach these Terms, are used fraudulently, or have been inactive for an extended period.
        </PolicyP>
      </PolicySection>

      <PolicySection id="orders" title="3. Orders & pricing">
        <PolicyP>
          Placing an order is an offer to buy. We accept your offer, and a contract is formed, when the order moves to the
          &ldquo;Confirmed&rdquo; status in your account. Until then we may decline or cancel an order for any reason, including stock
          shortages, pricing or description errors, suspected fraud or a failed payment. If we cancel after payment, we refund you in full.
        </PolicyP>
        <PolicyP>
          All prices are shown in US dollars (USD). An 8% sales tax is calculated on the discounted subtotal and shown separately at checkout
          before you confirm. Shipping is free on orders over $50 after discounts; otherwise a flat $5.99 shipping fee applies. The amount you
          see on the review step of checkout is the amount you will be charged.
        </PolicyP>
        <PolicyP>
          We work hard to keep product details, images and prices accurate, but mistakes can happen. If an item is listed at an obviously
          incorrect price we will contact you before dispatch to confirm the correct price or cancel the order with a full refund.
        </PolicyP>
      </PolicySection>

      <PolicySection id="payments" title="4. Payments">
        <PolicyP>We accept the following payment methods:</PolicyP>
        <PolicyList
          items={[
            <>
              <strong className="font-bold text-ink">Credit or debit card</strong> &mdash; charged when the order is placed.
            </>,
            <>
              <strong className="font-bold text-ink">UPI</strong> &mdash; charged when the order is placed.
            </>,
            <>
              <strong className="font-bold text-ink">Cash on delivery (COD)</strong> &mdash; paid in full to the courier when the parcel is
              handed over. Please keep the exact amount ready.
            </>,
          ]}
        />
        <PolicyP>
          Card details are handled by our payment provider and are never stored on Couture servers. If a payment fails or is cancelled, your
          order is not placed and your bag is left unchanged so you can try again. We may run anti-fraud checks on any order and may ask for
          additional verification before dispatch.
        </PolicyP>
      </PolicySection>

      <PolicySection id="shipping" title="5. Shipping & delivery">
        <PolicyP>
          Orders are processed within 1&ndash;2 business days and delivered by standard shipping in 3&ndash;5 business days. Delivery
          estimates are not guaranteed dates; weather, customs and carrier delays can affect them. Risk in the goods passes to you on delivery
          to the address you gave at checkout. Full details, including carriers and what happens with failed delivery attempts, are in the{' '}
          <PolicyLink href="/shipping">Shipping policy</PolicyLink>.
        </PolicyP>
      </PolicySection>

      <PolicySection id="returns" title="6. Cancellations & returns">
        <PolicyP>
          You can cancel an order yourself from <PolicyLink href="/account/orders">Account &rarr; Orders</PolicyLink> at any point before it
          ships. Once shipped, an order can no longer be cancelled but can be returned within 30 days of delivery, provided the item is unused
          and in its original packaging. Certain categories, such as opened beauty and personal-care items, are not returnable for hygiene
          reasons. See the <PolicyLink href="/cancellation">Cancellation policy</PolicyLink> and{' '}
          <PolicyLink href="/returns">Returns &amp; refunds policy</PolicyLink> for the complete rules and refund timelines.
        </PolicyP>
      </PolicySection>

      <PolicySection id="coupons" title="7. Coupons & promotions">
        <PolicyP>
          Coupon codes such as <strong className="font-bold text-ink">WELCOME10</strong> and <strong className="font-bold text-ink">FLAT5</strong>{' '}
          are applied in the bag or at checkout and are subject to the minimum order value, maximum discount, expiry date and usage limits
          stated for each code. Only one coupon can be used per order. Coupons cannot be exchanged for cash and we may withdraw a promotion
          at any time. If an order using a coupon is partially returned, the discount is pro-rated across the returned items.
        </PolicyP>
      </PolicySection>

      <PolicySection id="reviews" title="8. Reviews & user content">
        <PolicyP>
          You may leave reviews, ratings and other content on products you have bought. By submitting content you grant Couture a worldwide,
          royalty-free, non-exclusive licence to use, display and adapt it in connection with the site and our marketing. You confirm that
          your content is your own, is honest, and does not infringe anyone else&rsquo;s rights. We may edit or remove content that is
          offensive, misleading, promotional, off-topic or otherwise breaches these Terms.
        </PolicyP>
      </PolicySection>

      <PolicySection id="ip" title="9. Intellectual property">
        <PolicyP>
          The Couture name, logo, site design, text, graphics and software are owned by or licensed to Couture Retail Pvt. Ltd. and are
          protected by Indian and international intellectual-property laws. You may use the site for personal shopping only. You may not
          copy, scrape, reproduce, modify or redistribute any part of the site without our written permission. Product names and brand marks
          belong to their respective owners.
        </PolicyP>
      </PolicySection>

      <PolicySection id="liability" title="10. Limitation of liability">
        <PolicyP>
          Nothing in these Terms limits any liability that cannot be limited under applicable law, including for death or personal injury
          caused by negligence, or for fraud. Subject to that, Couture is not liable for any indirect, incidental or consequential loss, loss
          of profit or loss of data arising from your use of the site or any product, and our total liability for any order is limited to the
          amount you paid for that order.
        </PolicyP>
        <PolicyCallout title="Service availability">
          The site is provided &ldquo;as is&rdquo;. We do our best to keep it online and accurate but cannot promise it will be uninterrupted
          or error-free, and we may change or withdraw features without notice.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="law" title="11. Governing law">
        <PolicyP>
          These Terms are governed by the laws of India. Any dispute arising out of or relating to these Terms or your use of the site is
          subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka. Before starting any formal proceedings we ask that you
          contact us so we can try to resolve the issue informally.
        </PolicyP>
      </PolicySection>

      <PolicySection id="contact" title="12. Contact">
        <PolicyP>
          Questions about these Terms? Reach us through the <PolicyLink href="/contact">Contact page</PolicyLink>, email{' '}
          <a href="mailto:support@couture.test" className="font-bold text-brand underline-offset-2 hover:underline">
            support@couture.test
          </a>{' '}
          or write to Couture Retail Pvt. Ltd., 12 MG Road, Bengaluru 560001, India.
        </PolicyP>
      </PolicySection>
    </PolicyPage>
  );
}
