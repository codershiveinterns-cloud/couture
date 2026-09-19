import type { FieldErrors } from '../validation';

export type ServiceResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  salt: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export type User = Omit<StoredUser, 'salt' | 'passwordHash'>;

export interface Session {
  userId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface ResetTokenRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
}

export type ResetTokenStatus = 'valid' | 'invalid' | 'expired' | 'used';

export interface ForgotPasswordResult {
  message: string;
  /** Demo mode only: present when the email belongs to an account. */
  demoResetPath: string | null;
}

export interface CartItem {
  productId: string;
  variantId: string | null;
  quantity: number;
  addedAt: string;
}

export type AddToCartStatus = 'added' | 'clamped' | 'out_of_stock' | 'invalid';

export interface AddToCartResult {
  /** true when at least one unit was added. */
  ok: boolean;
  status: AddToCartStatus;
  productId: string;
  variantId: string | null;
  addedQuantity: number;
  /** Quantity of this line after the operation. */
  quantity: number;
  availableStock: number;
  /** "Only N left in stock" | "Out of stock" | error text; null on a clean add. */
  message: string | null;
}

export type SetQuantityStatus = 'updated' | 'removed' | 'clamped' | 'out_of_stock' | 'invalid';

export interface SetQuantityResult {
  status: SetQuantityStatus;
  quantity: number;
  availableStock: number;
  message: string | null;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AddressSnapshot = Pick<
  Address,
  'fullName' | 'phone' | 'line1' | 'line2' | 'city' | 'state' | 'postalCode' | 'country'
>;

export type PaymentMethod = 'COD' | 'CARD' | 'UPI';
export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  productId: string;
  variantId: string | null;
  slug: string;
  sku: string;
  name: string;
  image: string | null;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderTotals {
  itemCount: number;
  subtotal: number;
  discount: number;
  discountedSubtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  address: AddressSnapshot;
  totals: OrderTotals;
  couponCode: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  /** null for seeded demo reviews. */
  userId: string | null;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  isSeeded: boolean;
  verifiedPurchase: boolean;
}

export interface ReviewView extends Review {
  isOwn: boolean;
}

export interface RatingBucket {
  rating: 1 | 2 | 3 | 4 | 5;
  count: number;
  /** 0-100, share of totalCount. */
  percent: number;
}

export interface ReviewSummary {
  average: number;
  totalCount: number;
  /** Ordered 5 -> 1. */
  distribution: RatingBucket[];
}
