// Pure card / UPI helpers + validation for the payment form. Nothing here touches storage.

import type { FieldErrors } from '../validation';

export interface CardDetails {
  /** Digits with optional spaces/dashes, e.g. "4242 4242 4242 4242". */
  number: string;
  /** "MM/YY" or "MM/YYYY". */
  expiry: string;
  cvc: string;
  name: string;
}

export type CardField = 'cardNumber' | 'cardExpiry' | 'cardCvc' | 'cardName';
export type PaymentField = CardField | 'upiId';

export const EMPTY_CARD: CardDetails = { number: '', expiry: '', cvc: '', name: '' };

export function cardDigits(number: string): string {
  return number.replace(/[\s-]/g, '');
}

export function luhnCheck(number: string): boolean {
  const digits = cardDigits(number);
  if (!/^\d{12,19}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export type CardBrand = 'Visa' | 'Mastercard' | 'American Express' | 'Discover' | 'RuPay' | 'Card';

export function detectCardBrand(number: string): CardBrand {
  const digits = cardDigits(number);
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^(6011|65|64[4-9])/.test(digits)) return 'Discover';
  if (/^(60|81|82|508)/.test(digits)) return 'RuPay';
  return 'Card';
}

/** "4242424242424242" -> "4242 4242 4242 4242" (Amex: 4-6-5). For controlled inputs. */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  if (/^3[47]/.test(digits)) {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(' ');
  }
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

/** "1228" -> "12/28". For controlled inputs. */
export function formatCardExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function parseExpiry(expiry: string): { month: number; year: number } | null {
  const match = /^\s*(\d{1,2})\s*\/\s*(\d{2}|\d{4})\s*$/.exec(expiry);
  if (!match) return null;
  const month = Number(match[1]);
  const year = match[2].length === 2 ? 2000 + Number(match[2]) : Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { month, year };
}

/** A card is valid through the last day of its expiry month. */
export function isExpiryInPast(expiry: string, now: Date = new Date()): boolean {
  const parsed = parseExpiry(expiry);
  if (!parsed) return true;
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return parsed.year < currentYear || (parsed.year === currentYear && parsed.month < currentMonth);
}

export function validateCardDetails(card: CardDetails, now: Date = new Date()): FieldErrors<CardField> {
  const errors: FieldErrors<CardField> = {};
  const digits = cardDigits(card.number);
  if (!digits) errors.cardNumber = 'Card number is required';
  else if (!/^\d+$/.test(digits)) errors.cardNumber = 'Card number may only contain digits';
  else if (!luhnCheck(digits)) errors.cardNumber = 'Enter a valid card number';

  if (!card.expiry.trim()) errors.cardExpiry = 'Expiry date is required';
  else if (!parseExpiry(card.expiry)) errors.cardExpiry = 'Use the format MM/YY';
  else if (isExpiryInPast(card.expiry, now)) errors.cardExpiry = 'This card has expired';
  else if ((parseExpiry(card.expiry)?.year ?? 0) > now.getFullYear() + 25) errors.cardExpiry = 'Enter a valid expiry date';

  if (!card.cvc.trim()) errors.cardCvc = 'CVC is required';
  else if (!/^\d{3,4}$/.test(card.cvc.trim())) errors.cardCvc = 'CVC must be 3 or 4 digits';

  const name = card.name.trim();
  if (!name) errors.cardName = 'Name on card is required';
  else if (name.length < 2 || name.length > 60) errors.cardName = 'Enter the name as shown on the card';
  return errors;
}

const UPI_PATTERN = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;

export function normalizeUpiId(upiId: string): string {
  return upiId.trim().toLowerCase();
}

export function validateUpiId(upiId: string): string | undefined {
  if (!upiId.trim()) return 'UPI ID is required';
  if (!UPI_PATTERN.test(upiId.trim())) return 'Enter a valid UPI ID (e.g. name@bank)';
  return undefined;
}

/** "success@upi" -> "su•••••@upi". Only the masked form is ever persisted. */
export function maskUpiId(upiId: string): string {
  const [handle, provider = ''] = normalizeUpiId(upiId).split('@');
  const visible = handle.slice(0, 2);
  return `${visible}${'•'.repeat(Math.max(3, handle.length - visible.length))}@${provider}`;
}
