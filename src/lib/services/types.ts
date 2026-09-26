import type { FieldErrors } from '../validation';

export type ServiceResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export type UserRole = 'customer' | 'admin';
export type UserStatus = 'active' | 'blocked';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  /** Users stored before Milestone 3 have no role/status; they are read as 'customer' / 'active'. */
  role: UserRole;
  status: UserStatus;
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
export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

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
  /** Milestone 3 fields. Orders stored by Milestone 2 are normalized on read (history = [{status, at: createdAt}]). */
  updatedAt: string;
  /** Oldest first; the last entry always matches `status`. */
  statusHistory: OrderStatusEvent[];
  trackingNumber: string | null;
  trackingCarrier: string | null;
  paymentId: string | null;
  cancelReason: string | null;
}

export interface OrderCustomer {
  id: string;
  name: string;
  email: string;
}

/** Order joined with its customer, as returned by the admin order APIs. */
export interface AdminOrder extends Order {
  customer: OrderCustomer;
}

export type PaymentRecordStatus = PaymentStatus;

export interface PaymentRecord {
  id: string;
  /** Order number reserved for this attempt. FAILED/CANCELLED attempts never produce an order with this number. */
  orderNumber: string;
  userId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: 'USD';
  /** Gateway id ("cod" for cash on delivery). */
  gateway: string;
  /** Gateway reference / transaction id. */
  reference: string;
  /** Card brand + last 4 digits only. The full number, expiry and CVC are never stored. */
  cardBrand?: string;
  cardLast4?: string;
  /** Masked, e.g. "su•••••@upi". */
  upiId?: string;
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
}

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  status: UserStatus;
  orderCount: number;
  /** Sum of order totals excluding CANCELLED / REFUNDED orders. */
  totalSpent: number;
  lastOrderAt: string | null;
}

export interface CustomerDetail extends CustomerSummary {
  /** Newest first. */
  orders: Order[];
  addresses: Address[];
}

export type ReviewStatus = 'published' | 'hidden';

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
  /** Admin moderation. Storefront lists and summaries only include 'published'. */
  status: ReviewStatus;
}

export interface AdminReview extends Review {
  productName: string;
  productSlug: string | null;
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
