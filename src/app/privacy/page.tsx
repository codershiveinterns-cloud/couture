import type { Metadata } from 'next';
import { PolicyCallout, PolicyLink, PolicyList, PolicyP, PolicyPage, PolicySection } from '@/components/storefront/policy/PolicyPage';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy policy',
  description: 'How Couture collects, uses, stores and protects your personal data, what cookies and local storage we use, and the rights you have.',
  path: '/privacy',
});

const LAST_UPDATED = '1 October 2026';

const SECTIONS = [
  { id: 'collect', title: 'Data we collect' },
  { id: 'use', title: 'How we use it' },
  { id: 'cookies', title: 'Cookies & local storage' },
  { id: 'payments', title: 'Payments' },
  { id: 'sharing', title: 'Sharing' },
  { id: 'retention', title: 'Retention' },
  { id: 'rights', title: 'Your rights' },
  { id: 'children', title: 'Children' },
  { id: 'changes', title: 'Changes to this policy' },
  { id: 'contact', title: 'Contact' },
] as const;

export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy policy" subtitle={`Last updated: ${LAST_UPDATED}`} path="/privacy" sections={SECTIONS}>
      <PolicyP>
        Couture Retail Pvt. Ltd. (&ldquo;Couture&rdquo;, &ldquo;we&rdquo;) respects your privacy. This policy explains what personal data we
        collect when you use the Couture website, why we collect it, how long we keep it and the choices you have. It applies alongside our{' '}
        <PolicyLink href="/terms">Terms &amp; Conditions</PolicyLink>.
      </PolicyP>

      <PolicySection id="collect" title="1. Data we collect">
        <PolicyP>We collect only what we need to run the store and serve you:</PolicyP>
        <PolicyList
          items={[
            <>
              <strong className="font-bold text-ink">Account details</strong> &mdash; your name, email address, phone number and password (stored
              hashed, never in plain text).
            </>,
            <>
              <strong className="font-bold text-ink">Order details</strong> &mdash; the items you buy, delivery addresses, payment method chosen,
              order status history and any cancellation or return requests.
            </>,
            <>
              <strong className="font-bold text-ink">Shopping activity</strong> &mdash; your bag, wishlist, recently viewed products, applied coupons
              and reviews you post.
            </>,
            <>
              <strong className="font-bold text-ink">Support messages</strong> &mdash; anything you send us through the Contact page or by email.
            </>,
            <>
              <strong className="font-bold text-ink">Technical data</strong> &mdash; device type, browser, approximate location from your IP
              address, and pages visited, used in aggregate to keep the site fast and secure.
            </>,
          ]}
        />
      </PolicySection>

      <PolicySection id="use" title="2. How we use it">
        <PolicyList
          items={[
            'To process and deliver your orders, take payment and send order confirmations, shipping and delivery notifications.',
            'To run your account: sign-in, password reset, saved addresses, order history and wishlist.',
            'To answer support requests and handle cancellations, returns and refunds.',
            'To prevent fraud, abuse and security incidents.',
            'To improve the store, for example by understanding which products and pages are popular.',
            'To send marketing emails about new drops and offers only if you opt in; you can unsubscribe from any email at any time.',
          ]}
        />
      </PolicySection>

      <PolicySection id="cookies" title="3. Cookies & local storage">
        <PolicyP>
          Couture uses a small number of strictly necessary cookies and your browser&rsquo;s local storage to keep you signed in and to
          remember your bag, wishlist, recently viewed items and in-progress checkout between visits. These are essential for the store to
          work and are not used to track you across other websites.
        </PolicyP>
        <PolicyCallout title="Good to know">
          Because the bag and wishlist live in your browser, clearing site data or switching devices will empty them unless you are signed in.
          We do not use third-party advertising cookies.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="payments" title="4. Payments">
        <PolicyP>
          Card and UPI payments are processed by our payment provider over an encrypted connection. Your full card number, CVV and UPI
          credentials are entered directly with the provider and are <strong className="font-bold text-ink">never stored on Couture servers</strong>.
          We keep only the payment method type, the last four digits of a card where provided by the processor, and the transaction
          reference needed to issue refunds.
        </PolicyP>
      </PolicySection>

      <PolicySection id="sharing" title="5. Sharing">
        <PolicyP>We never sell your personal data. We share it only with:</PolicyP>
        <PolicyList
          items={[
            'Delivery carriers (for example FedEx, UPS, DHL, USPS, Blue Dart and Delhivery) so they can deliver your parcel and contact you about it.',
            'Payment processors to take payments and issue refunds.',
            'Service providers who host the site, send our emails and SMS, and help us detect fraud, each bound by contract to use your data only on our instructions.',
            'Law enforcement, regulators or courts when the law requires it or to protect our rights and our customers.',
          ]}
        />
      </PolicySection>

      <PolicySection id="retention" title="6. Retention">
        <PolicyP>
          We keep account data for as long as your account is open. Order and payment records are retained for 8 years after the order to
          meet tax and accounting obligations under Indian law. Support messages are kept for 2 years. Technical logs are kept for up to 90
          days. When data is no longer needed we delete or anonymise it.
        </PolicyP>
      </PolicySection>

      <PolicySection id="rights" title="7. Your rights">
        <PolicyP>Depending on where you live, you may have the right to:</PolicyP>
        <PolicyList
          items={[
            'Access the personal data we hold about you and receive a copy.',
            'Correct inaccurate or incomplete data; most account details can be edited directly from your Account page.',
            'Delete your account and associated data, subject to records we must keep by law.',
            'Object to or restrict certain processing, including withdrawing consent to marketing.',
            'Complain to your local data-protection authority.',
          ]}
        />
        <PolicyP>
          To exercise any of these rights, contact us using the details below. We respond within 30 days and may ask you to verify your
          identity first.
        </PolicyP>
      </PolicySection>

      <PolicySection id="children" title="8. Children">
        <PolicyP>
          The Couture site is intended for adults. We do not knowingly collect personal data from anyone under 18 without parental consent.
          If you believe a child has given us data, contact us and we will delete it promptly.
        </PolicyP>
      </PolicySection>

      <PolicySection id="changes" title="9. Changes to this policy">
        <PolicyP>
          We may update this policy as the store evolves or the law changes. The &ldquo;Last updated&rdquo; date at the top shows the current
          version. For significant changes we will let you know by email or a notice on the site before they take effect.
        </PolicyP>
      </PolicySection>

      <PolicySection id="contact" title="10. Contact">
        <PolicyP>
          Privacy questions and requests can be sent through the <PolicyLink href="/contact">Contact page</PolicyLink>, by email to{' '}
          <a href="mailto:support@couture.test" className="font-bold text-brand underline-offset-2 hover:underline">
            support@couture.test
          </a>
          , or by post to Couture Retail Pvt. Ltd., 12 MG Road, Bengaluru 560001, India.
        </PolicyP>
      </PolicySection>
    </PolicyPage>
  );
}
