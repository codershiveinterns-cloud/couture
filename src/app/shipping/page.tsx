import type { Metadata } from 'next';
import {
  PolicyCallout,
  PolicyLink,
  PolicyList,
  PolicyP,
  PolicyPage,
  PolicySection,
  PolicyTable,
} from '@/components/storefront/policy/PolicyPage';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Shipping policy',
  description: 'Processing times, delivery estimates, free shipping over $50, carriers we use, tracking, delivery attempts and what to do about damaged parcels.',
  path: '/shipping',
});

const LAST_UPDATED = '1 October 2026';

const SECTIONS = [
  { id: 'overview', title: 'At a glance' },
  { id: 'processing', title: 'Processing time' },
  { id: 'delivery', title: 'Delivery time' },
  { id: 'cost', title: 'Shipping cost' },
  { id: 'carriers', title: 'Carriers' },
  { id: 'tracking', title: 'Tracking & notifications' },
  { id: 'attempts', title: 'Delivery attempts' },
  { id: 'damaged', title: 'Damaged or missing parcels' },
] as const;

const CARRIERS = ['FedEx', 'UPS', 'DHL', 'USPS', 'Blue Dart', 'Delhivery'];

export default function ShippingPage() {
  return (
    <PolicyPage title="Shipping policy" subtitle={`Last updated: ${LAST_UPDATED}`} path="/shipping" sections={SECTIONS}>
      <PolicySection id="overview" title="At a glance">
        <PolicyTable
          caption="Shipping summary"
          rows={[
            { label: 'Processing', value: '1–2 business days' },
            { label: 'Standard delivery', value: '3–5 business days after dispatch' },
            { label: 'Cost', value: 'Free on orders over $50 after discounts; otherwise $5.99 flat' },
            { label: 'Tracking', value: 'Tracking number by email and SMS as soon as the parcel ships' },
          ]}
        />
      </PolicySection>

      <PolicySection id="processing" title="Processing time">
        <PolicyP>
          Every order is picked, quality-checked and packed within 1&ndash;2 business days (Monday to Saturday, excluding public holidays).
          Orders placed after 2pm IST are processed the next business day. You will see the order move from &ldquo;Placed&rdquo; to
          &ldquo;Confirmed&rdquo; and then &ldquo;Processing&rdquo; in <PolicyLink href="/account/orders">Account &rarr; Orders</PolicyLink>{' '}
          as this happens.
        </PolicyP>
        <PolicyP>
          During sale events and the festive season processing can take an extra day. If we expect a longer delay we will email you with the
          option to cancel for a full refund.
        </PolicyP>
      </PolicySection>

      <PolicySection id="delivery" title="Delivery time">
        <PolicyP>
          Standard shipping takes 3&ndash;5 business days from the day your parcel is dispatched. Remote pin codes and international
          addresses can take longer and may be subject to local customs duties, which are the recipient&rsquo;s responsibility. Delivery
          estimates are our best projection, not a guaranteed date.
        </PolicyP>
      </PolicySection>

      <PolicySection id="cost" title="Shipping cost">
        <PolicyP>
          Shipping is <strong className="font-bold text-ink">free on orders over $50</strong> (calculated on the subtotal after any coupon
          discount). Orders at or below $50 are charged a flat <strong className="font-bold text-ink">$5.99</strong>. The bag page shows exactly
          how much more you need to add to unlock free shipping, and the final shipping charge is always shown on the checkout review step
          before you pay.
        </PolicyP>
      </PolicySection>

      <PolicySection id="carriers" title="Carriers">
        <PolicyP>We choose the fastest reliable carrier for your address from our partners:</PolicyP>
        <ul className="flex flex-wrap gap-2" aria-label="Carrier partners">
          {CARRIERS.map((c) => (
            <li key={c} className="rounded-sm border border-line bg-white px-3 py-1.5 text-[13px] font-bold text-ink">
              {c}
            </li>
          ))}
        </ul>
        <PolicyP>
          The carrier assigned to your order is shown with the tracking number on the order page and on{' '}
          <PolicyLink href="/track">Track order</PolicyLink>.
        </PolicyP>
      </PolicySection>

      <PolicySection id="tracking" title="Tracking & notifications">
        <PolicyP>
          As soon as your parcel leaves our warehouse we email and text you the carrier name and tracking number. You can follow progress in
          two ways:
        </PolicyP>
        <PolicyList
          items={[
            <>
              Open <PolicyLink href="/track">Track order</PolicyLink> and enter your order number and the email you used at checkout — no sign-in
              needed.
            </>,
            <>
              Signed-in customers can see the full status timeline for every order in <PolicyLink href="/account/orders">Account &rarr; Orders</PolicyLink>.
            </>,
          ]}
        />
        <PolicyP>
          We also notify you when the parcel is out for delivery and once it has been delivered. Order statuses move through Placed, Confirmed,
          Processing, Shipped, Out for delivery and Delivered.
        </PolicyP>
      </PolicySection>

      <PolicySection id="attempts" title="Delivery attempts">
        <PolicyP>
          Carriers make up to three delivery attempts on consecutive business days. If no one is available, the courier leaves a note or
          sends an SMS so you can reschedule. After three failed attempts the parcel is returned to us; we will contact you to re-dispatch it
          (a new shipping fee may apply for orders under $50) or cancel the order and refund the item value.
        </PolicyP>
        <PolicyCallout title="Cash on delivery">
          For COD orders please keep the exact amount ready. Parcels that are refused at the door are returned to our warehouse and the order
          is cancelled.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="damaged" title="Damaged or missing parcels">
        <PolicyP>
          Please check the outer packaging before you accept the parcel. If it looks tampered with or damaged, refuse delivery and let us
          know. If you discover damage after opening, contact us within 48 hours of delivery with photos of the item and the packaging and we
          will send a replacement or refund you in full, including any shipping charged.
        </PolicyP>
        <PolicyP>
          If tracking shows &ldquo;delivered&rdquo; but you have not received the parcel, check with household members, neighbours and your
          building reception first, then <PolicyLink href="/contact">contact us</PolicyLink> within 7 days so we can open an investigation with
          the carrier.
        </PolicyP>
      </PolicySection>
    </PolicyPage>
  );
}
