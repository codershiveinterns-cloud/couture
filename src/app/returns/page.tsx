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
  title: 'Returns & refunds',
  description: 'Return most Couture items within 30 days of delivery. Condition rules, non-returnable categories, how to start a return, refund timelines and exchanges.',
  path: '/returns',
});

const LAST_UPDATED = '1 October 2026';

const SECTIONS = [
  { id: 'window', title: '30-day return window' },
  { id: 'condition', title: 'Condition rules' },
  { id: 'excluded', title: 'Non-returnable items' },
  { id: 'how', title: 'How to start a return' },
  { id: 'refunds', title: 'Refund methods & timelines' },
  { id: 'exchanges', title: 'Exchanges' },
  { id: 'faulty', title: 'Faulty or wrong items' },
] as const;

export default function ReturnsPage() {
  return (
    <PolicyPage title="Returns & refunds" subtitle={`Last updated: ${LAST_UPDATED}`} path="/returns" sections={SECTIONS}>
      <PolicySection id="window" title="30-day return window">
        <PolicyP>
          Changed your mind? Most items can be returned within <strong className="font-bold text-ink">30 days of delivery</strong> for a full
          refund of the item price. The window starts on the day the order status becomes Delivered. Returns requested after 30 days cannot be
          accepted unless the item is faulty.
        </PolicyP>
        <PolicyP>
          Return pickup from your door is free for one return per order. If you prefer, you can also drop the parcel at any partner carrier
          location.
        </PolicyP>
      </PolicySection>

      <PolicySection id="condition" title="Condition rules">
        <PolicyP>To be accepted, a returned item must be:</PolicyP>
        <PolicyList
          items={[
            'Unused, unwashed and unworn, with no signs of wear, damage or alteration.',
            'In its original packaging with all tags, labels, manuals, accessories and free gifts included.',
            'Accompanied by the order number (printed on the packing slip or shown in your account).',
          ]}
        />
        <PolicyP>
          Items are inspected when they reach our warehouse. If an item fails inspection we will let you know, and we may return it to you or
          issue a reduced refund depending on its condition.
        </PolicyP>
      </PolicySection>

      <PolicySection id="excluded" title="Non-returnable items">
        <PolicyP>For hygiene and safety reasons the following cannot be returned unless they arrive damaged or faulty:</PolicyP>
        <PolicyList
          items={[
            'Beauty and personal-care products that have been opened or whose seal is broken (skincare, fragrance, make-up, grooming tools).',
            'Innerwear, swimwear, socks and earrings.',
            'Items marked "final sale" or "non-returnable" on the product page.',
            'Gift cards and digital downloads.',
            'Software, headphones and personal audio once the seal is broken, unless faulty.',
          ]}
        />
      </PolicySection>

      <PolicySection id="how" title="How to start a return">
        <PolicyList
          ordered
          items={[
            <>
              Send us the order number, the item(s) you want to return and the reason through the{' '}
              <PolicyLink href="/contact">Contact page</PolicyLink> (choose the &ldquo;Returns&rdquo; topic) or by email to support@couture.test.
            </>,
            'We confirm eligibility within 1 business day and email you a return label plus a pickup date, or drop-off instructions.',
            'Pack the item securely in its original packaging and hand it to the courier.',
            'Once the item reaches our warehouse and passes inspection (usually 2–4 business days after pickup) your refund is issued.',
          ]}
        />
        <PolicyCallout title="Tip">
          Keep the pickup receipt or drop-off slip until your refund arrives — it is your proof that the parcel was handed over. Common
          questions are also answered in the <PolicyLink href="/faq">FAQ</PolicyLink>.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="refunds" title="Refund methods & timelines">
        <PolicyP>Refunds are issued to the payment method used for the order:</PolicyP>
        <PolicyTable
          caption="Refund methods and timelines"
          rows={[
            { label: 'Credit / debit card', value: '5–7 business days after the refund is issued, depending on your bank.' },
            { label: 'UPI', value: '5–7 business days, credited to the bank account linked to your UPI ID.' },
            {
              label: 'Cash on delivery',
              value: 'Refunded by bank transfer. We will ask for your account details when the return is approved; the money arrives 5–7 business days after the item passes inspection.',
            },
          ]}
        />
        <PolicyP>
          The refund includes the item price and the proportional tax. Original shipping charges are refunded only when the whole order is
          returned or the item was faulty or wrong. If a coupon was applied, the discount is spread across the items and the refund reflects
          the price you actually paid for the returned item.
        </PolicyP>
      </PolicySection>

      <PolicySection id="exchanges" title="Exchanges">
        <PolicyP>
          Need a different size or colour? The quickest route is to place a new order for the variant you want and return the original for a
          refund &mdash; that way the replacement ships immediately rather than waiting for the return to arrive. If the variant is out of
          stock, contact us and we will reserve it for you if a restock is expected.
        </PolicyP>
      </PolicySection>

      <PolicySection id="faulty" title="Faulty or wrong items">
        <PolicyP>
          If an item arrives damaged, defective or is not what you ordered, contact us within 48 hours of delivery with photos. We will
          arrange a free pickup and send a replacement or a full refund, including any shipping you paid, regardless of the category. See the{' '}
          <PolicyLink href="/shipping">Shipping policy</PolicyLink> for what to do if the outer packaging is damaged on arrival.
        </PolicyP>
      </PolicySection>
    </PolicyPage>
  );
}
