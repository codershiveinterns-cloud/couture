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
  title: 'Cancellation policy',
  description: 'How to cancel a Couture order before it ships, refund timelines for card, UPI and cash on delivery, and what happens to coupons.',
  path: '/cancellation',
});

const LAST_UPDATED = '1 October 2026';

const SECTIONS = [
  { id: 'window', title: 'When you can cancel' },
  { id: 'how', title: 'How to cancel' },
  { id: 'refunds', title: 'Refund timelines' },
  { id: 'coupons', title: 'Coupons on cancelled orders' },
  { id: 'partial', title: 'Partial cancellation' },
  { id: 'by-us', title: 'Cancellations by Couture' },
] as const;

export default function CancellationPage() {
  return (
    <PolicyPage title="Cancellation policy" subtitle={`Last updated: ${LAST_UPDATED}`} path="/cancellation" sections={SECTIONS}>
      <PolicySection id="window" title="When you can cancel">
        <PolicyP>
          You can cancel an order at any point <strong className="font-bold text-ink">before it ships</strong> &mdash; that is, while its
          status is Placed, Confirmed or Processing. Once the status changes to Shipped the parcel is already with the carrier and can no
          longer be cancelled. You can instead return it within 30 days of delivery under our{' '}
          <PolicyLink href="/returns">Returns &amp; refunds policy</PolicyLink>.
        </PolicyP>
      </PolicySection>

      <PolicySection id="how" title="How to cancel">
        <PolicyList
          ordered
          items={[
            <>
              Sign in and open <PolicyLink href="/account/orders">Account &rarr; Orders</PolicyLink>.
            </>,
            'Select the order and choose "Cancel order". The button is only shown while cancellation is still possible.',
            'Pick a reason (optional) and confirm. The order status changes to Cancelled immediately and you receive a confirmation email.',
          ]}
        />
        <PolicyP>
          Checked out as a guest? Use the <PolicyLink href="/contact">Contact page</PolicyLink> with your order number and we will cancel it
          for you, as long as it has not shipped by the time we receive your message.
        </PolicyP>
      </PolicySection>

      <PolicySection id="refunds" title="Refund timelines">
        <PolicyP>Refunds for cancelled orders always go back to the original payment method:</PolicyP>
        <PolicyTable
          caption="Refund timelines by payment method"
          rows={[
            { label: 'Credit / debit card', value: 'Issued within 1 business day; appears on your statement in 5–7 business days depending on your bank.' },
            { label: 'UPI', value: 'Issued within 1 business day; credited to the linked bank account in 5–7 business days.' },
            { label: 'Cash on delivery', value: 'Not applicable — nothing has been charged, so there is nothing to refund.' },
          ]}
        />
        <PolicyP>
          The refund covers the full amount paid, including tax and any shipping charge. If a refund has not arrived after 7 business days,
          contact us with your order number and we will share the payment reference for your bank.
        </PolicyP>
      </PolicySection>

      <PolicySection id="coupons" title="Coupons on cancelled orders">
        <PolicyCallout title="Stated clearly" tone="brand">
          A coupon applied to a cancelled order is <strong className="font-bold text-ink">not automatically restored</strong> to your account.
          Our standard codes WELCOME10 and FLAT5 have no per-customer limit, so you can simply enter them again on your next order. If you
          used a limited or single-use code, contact us after cancelling and we will issue a replacement code of equal value.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="partial" title="Partial cancellation">
        <PolicyP>
          <strong className="font-bold text-ink">Partial cancellation is not supported.</strong> An order can only be cancelled in full. If you
          want to keep some items and remove others, cancel the whole order (refunded in full) and place a new order for the items you want.
          Shipping and coupon eligibility will be recalculated on the new order.
        </PolicyP>
      </PolicySection>

      <PolicySection id="by-us" title="Cancellations by Couture">
        <PolicyP>
          Occasionally we may have to cancel an order ourselves &mdash; for example if an item is out of stock, a price or listing error is
          found, a payment cannot be verified, or the delivery address cannot be served. If this happens we email you straight away and
          refund any payment in full within the timelines above.
        </PolicyP>
      </PolicySection>
    </PolicyPage>
  );
}
