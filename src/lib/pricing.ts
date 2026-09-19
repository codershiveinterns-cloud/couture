export const FREE_SHIPPING_THRESHOLD = 50;
export const FLAT_SHIPPING_RATE = 5.99;
export const TAX_RATE = 0.08;

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export interface PricingLine {
  unitPrice: number;
  quantity: number;
}

export interface DiscountRule {
  type: 'percentage' | 'fixed';
  value: number;
  maxDiscount: number | null;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  discount: number;
  discountedSubtotal: number;
  shipping: number;
  tax: number;
  total: number;
  amountToFreeShipping: number;
  qualifiesForFreeShipping: boolean;
}

export function lineTotal(unitPrice: number, quantity: number): number {
  return roundMoney(roundMoney(unitPrice) * quantity);
}

export function calculateSubtotal(lines: readonly PricingLine[]): number {
  return roundMoney(lines.reduce((sum, line) => sum + lineTotal(line.unitPrice, line.quantity), 0));
}

export function calculateDiscount(rule: DiscountRule | null | undefined, subtotal: number): number {
  if (!rule || subtotal <= 0) return 0;
  let discount =
    rule.type === 'percentage' ? roundMoney((subtotal * rule.value) / 100) : roundMoney(rule.value);
  if (rule.type === 'percentage' && rule.maxDiscount !== null) {
    discount = Math.min(discount, rule.maxDiscount);
  }
  return roundMoney(Math.max(0, Math.min(discount, subtotal)));
}

export function calculateShipping(discountedSubtotal: number, itemCount: number): number {
  if (itemCount <= 0 || discountedSubtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return FLAT_SHIPPING_RATE;
}

export function calculateTotals(lines: readonly PricingLine[], discountRule?: DiscountRule | null): CartTotals {
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = calculateSubtotal(lines);
  const discount = calculateDiscount(discountRule, subtotal);
  const discountedSubtotal = roundMoney(subtotal - discount);
  const shipping = calculateShipping(discountedSubtotal, itemCount);
  const tax = roundMoney(discountedSubtotal * TAX_RATE);
  const total = roundMoney(discountedSubtotal + shipping + tax);
  const amountToFreeShipping =
    itemCount > 0 ? roundMoney(Math.max(0, FREE_SHIPPING_THRESHOLD - discountedSubtotal)) : 0;

  return {
    itemCount,
    subtotal,
    discount,
    discountedSubtotal,
    shipping,
    tax,
    total,
    amountToFreeShipping,
    qualifiesForFreeShipping: itemCount > 0 && shipping === 0,
  };
}

export const EMPTY_TOTALS: CartTotals = calculateTotals([]);
