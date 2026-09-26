import { getProductById } from '../catalog';
import { getJsonStore, isRecord, sanitizeArray, storageKeys } from '../storage';
import { hasErrors, validateReviewInput, type ReviewInput } from '../validation';
import { randomId } from './crypto';
import { getBaseProductById, getCatalog, getProductById as getAnyProductById } from './catalogStore';
import { hasPurchasedProduct } from './orders';
import type {
  AdminReview,
  RatingBucket,
  Review,
  ReviewStatus,
  ReviewSummary,
  ReviewView,
  ServiceResult,
  User,
} from './types';

export const MAX_SEEDED_REVIEWS = 6;

const EMPTY_REVIEWS: Review[] = [];

function isReview(value: unknown): value is Review {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.productId === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.authorName === 'string' &&
    typeof value.rating === 'number' &&
    Number.isInteger(value.rating) &&
    value.rating >= 1 &&
    value.rating <= 5 &&
    typeof value.title === 'string' &&
    typeof value.body === 'string' &&
    typeof value.createdAt === 'string'
  );
}

export function reviewsStore() {
  return getJsonStore(storageKeys.reviews, EMPTY_REVIEWS, (v) =>
    sanitizeArray(v, isReview).map((r) => ({
      ...r,
      isSeeded: false,
      verifiedPurchase: !!r.verifiedPurchase,
      // Reviews stored before Milestone 3 have no status: they are published.
      status: r.status === 'hidden' ? ('hidden' as const) : ('published' as const),
    })),
  );
}

export type SeededModeration = Record<string, 'hidden' | 'deleted'>;
const EMPTY_MODERATION: SeededModeration = {};

/** Seeded (generated) reviews are not stored, so their moderation state lives in its own key. */
export function reviewModerationStore() {
  return getJsonStore<SeededModeration>(storageKeys.reviewModeration, EMPTY_MODERATION, (v) => {
    if (!isRecord(v)) return EMPTY_MODERATION;
    const out: SeededModeration = {};
    Object.entries(v).forEach(([id, state]) => {
      if (state === 'hidden' || state === 'deleted') out[id] = state;
    });
    return out;
  });
}

export const isReviewPublished = (review: Pick<Review, 'status'>) => review.status !== 'hidden';

/** Storefront view of the seeded reviews: drops the ones an admin hid or deleted. */
export function visibleSeededReviews(
  seeded: readonly Review[],
  moderation: SeededModeration = reviewModerationStore().get(),
): readonly Review[] {
  if (Object.keys(moderation).length === 0) return seeded;
  return seeded.filter((r) => !moderation[r.id]);
}

/** How many of a product's seeded reviews were hidden/deleted (subtract from the product's reviewCount). */
export function moderatedSeededCount(seeded: readonly Review[], moderation: SeededModeration): number {
  return seeded.reduce((count, r) => count + (moderation[r.id] ? 1 : 0), 0);
}

/** Every user-submitted review across products (newest first), hidden ones included. */
export function getAllUserReviews(): readonly Review[] {
  return reviewsStore().get();
}

export function getUserReviewsForProduct(productId: string, all: readonly Review[] = getAllUserReviews()): Review[] {
  return all.filter((r) => r.productId === productId);
}

function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(items: readonly T[], rand: () => number): T => items[Math.floor(rand() * items.length)];

const FIRST_NAMES = [
  'Olivia', 'Liam', 'Emma', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Lucas',
  'Mia', 'Aiden', 'Harper', 'Elijah', 'Amelia', 'James', 'Priya', 'Arjun', 'Chloe', 'Daniel',
  'Grace', 'Mateo', 'Zoe', 'Hannah', 'Leo', 'Nora', 'Samuel', 'Aria', 'Kenji', 'Layla',
];
const LAST_INITIALS = 'ABCDEFGHJKLMNPRSTVWY';

const TITLES: Record<number, readonly string[]> = {
  5: ['Absolutely love it', 'Exceeded my expectations', 'Worth every penny', 'Best purchase this year', 'Five stars, no notes'],
  4: ['Really solid choice', 'Great value for the price', 'Very happy overall', 'Does exactly what I needed', 'Would buy again'],
  3: ['Decent, with a few caveats', 'Good but not great', 'It does the job', 'Mixed feelings', 'Okay for the price'],
  2: ['Not quite what I expected', 'Had some issues', 'Could be better', 'Disappointed with the quality'],
  1: ['Would not recommend', 'Did not work out for me', 'Returned it'],
};

const BODIES: Record<number, readonly string[]> = {
  5: [
    'The {name} arrived quickly and the quality is outstanding. It feels premium and I use it every single day.',
    'I did a lot of research before buying and I am so glad I picked this one. Setup was effortless and it looks great.',
    'Honestly better than I hoped. The build quality, the finish, the details — everything feels thoughtfully made.',
    'Bought one for myself and ended up ordering another as a gift. Both of us are thrilled with it.',
  ],
  4: [
    'Really happy with the {name}. It does everything it promises; I only wish it came in a few more options.',
    'Great quality for the price. Took a day or two to get used to, but now it is part of my routine.',
    'Solid product and fast delivery. Minor nitpicks, but nothing that would stop me from recommending it.',
    'Looks and feels well made. Knocked off one star only because the packaging could be a bit less bulky.',
  ],
  3: [
    'The {name} is fine for everyday use, but it is not as polished as the photos suggest. Fair for the price.',
    'It works as described, though I noticed a couple of small quality issues. Customer support was helpful.',
    'Average experience overall. Some things I like, some I do not. Probably would look at alternatives next time.',
  ],
  2: [
    'I wanted to like the {name}, but it did not hold up as well as I hoped after a few weeks of regular use.',
    'Quality felt a bit inconsistent compared to the description. It is usable, just not what I was expecting.',
  ],
  1: [
    'Unfortunately the {name} was not a good fit for me and the quality did not match the listing. I sent it back.',
    'Stopped working the way I expected within a short time. The return process was easy at least.',
  ],
};

function distributeRatings(avgRating: number, count: number, rand: () => number): number[] {
  if (count <= 0) return [];
  const avg = Math.min(5, Math.max(1, Number.isFinite(avgRating) ? avgRating : 4));
  const targetSum = Math.min(5 * count, Math.max(count, Math.round(avg * count)));
  const base = Math.floor(targetSum / count);
  const remainder = targetSum - base * count;
  const ratings = Array.from({ length: count }, (_, i) => (i < remainder ? base + 1 : base));

  for (let k = 0; k < Math.floor(count / 2); k++) {
    const i = Math.floor(rand() * count);
    const j = Math.floor(rand() * count);
    if (i !== j && ratings[i] < 5 && ratings[j] > 1 && rand() < 0.5) {
      ratings[i]++;
      ratings[j]--;
    }
  }
  for (let i = ratings.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [ratings[i], ratings[j]] = [ratings[j], ratings[i]];
  }
  return ratings;
}

const seededCache = new Map<string, readonly Review[]>();

/** Deterministic demo reviews (same output on server and client): min(reviewCount, 6), newest first, dated in 2026. */
export function getSeededReviews(productId: string, avgRating: number, reviewCount: number): readonly Review[] {
  const count = Math.max(0, Math.min(Math.floor(reviewCount) || 0, MAX_SEEDED_REVIEWS));
  const cacheKey = `${productId}|${avgRating}|${count}`;
  const cached = seededCache.get(cacheKey);
  if (cached) return cached;

  const rand = mulberry32(hashString(productId));
  // Base name first so the server render and the hydration render agree even after an admin rename.
  const productName = getBaseProductById(productId)?.name ?? getProductById(productId)?.name ?? 'product';
  const ratings = distributeRatings(avgRating, count, rand);
  const usedNames = new Set<string>();

  const reviews: Review[] = ratings.map((rating, index) => {
    let authorName = '';
    for (let attempt = 0; attempt < 10 && (!authorName || usedNames.has(authorName)); attempt++) {
      authorName = `${pick(FIRST_NAMES, rand)} ${pick(LAST_INITIALS.split(''), rand)}.`;
    }
    usedNames.add(authorName);
    const month = 1 + Math.floor(rand() * 8);
    const day = 1 + Math.floor(rand() * 28);
    const hour = 8 + Math.floor(rand() * 12);
    const minute = Math.floor(rand() * 60);
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      id: `seed-${productId}-${index + 1}`,
      productId,
      userId: null,
      authorName,
      rating,
      title: pick(TITLES[rating], rand),
      body: pick(BODIES[rating], rand).replace('{name}', productName),
      createdAt: `2026-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00.000Z`,
      isSeeded: true,
      verifiedPurchase: rand() < 0.75,
      status: 'published',
    };
  });

  reviews.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  seededCache.set(cacheKey, reviews);
  return reviews;
}

export interface ReviewSummaryParams {
  avgRating: number;
  reviewCount: number;
  /** All user-submitted reviews for the product. */
  userReviews: readonly Pick<Review, 'rating'>[];
  /** Reviews shown on the page (seeded + user). */
  visibleReviews: readonly Pick<Review, 'rating'>[];
}

export function computeReviewSummary({
  avgRating,
  reviewCount,
  userReviews,
  visibleReviews,
}: ReviewSummaryParams): ReviewSummary {
  const baseCount = Math.max(0, Math.floor(reviewCount) || 0);
  const totalCount = baseCount + userReviews.length;
  const userSum = userReviews.reduce((sum, r) => sum + r.rating, 0);
  const average =
    totalCount > 0 ? Math.round((((Number.isFinite(avgRating) ? avgRating : 0) * baseCount + userSum) / totalCount) * 10) / 10 : 0;

  const ratings = [5, 4, 3, 2, 1] as const;
  const visibleTotal = visibleReviews.length;
  let distribution: RatingBucket[];

  if (totalCount === 0 || visibleTotal === 0) {
    distribution = ratings.map((rating) => ({ rating, count: 0, percent: 0 }));
  } else {
    // Largest-remainder rounding so scaled counts sum exactly to totalCount.
    const exact = ratings.map((rating) => {
      const share = visibleReviews.filter((r) => r.rating === rating).length / visibleTotal;
      return { rating, value: share * totalCount };
    });
    const counts = exact.map((e) => Math.floor(e.value));
    let leftover = totalCount - counts.reduce((a, b) => a + b, 0);
    const order = exact
      .map((e, i) => ({ i, frac: e.value - Math.floor(e.value) }))
      .sort((a, b) => b.frac - a.frac || a.i - b.i);
    for (let k = 0; leftover > 0 && k < order.length; k++, leftover--) counts[order[k].i]++;
    distribution = ratings.map((rating, i) => ({
      rating,
      count: counts[i],
      percent: Math.round((counts[i] / totalCount) * 100),
    }));
  }

  return { average, totalCount, distribution };
}

/** Current user's review first, then other user reviews (newest first), then seeded reviews. */
export function buildReviewList(
  seeded: readonly Review[],
  userReviews: readonly Review[],
  currentUserId: string | null,
): ReviewView[] {
  const byNewest = [...userReviews].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  const own = currentUserId ? byNewest.filter((r) => r.userId === currentUserId) : [];
  const others = byNewest.filter((r) => !currentUserId || r.userId !== currentUserId);
  return [
    ...own.map((r) => ({ ...r, isOwn: true })),
    ...others.map((r) => ({ ...r, isOwn: false })),
    ...seeded.map((r) => ({ ...r, isOwn: false })),
  ];
}

export function formatAuthorName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Couture customer';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

export async function submitReview(
  user: Pick<User, 'id' | 'name'>,
  productId: string,
  input: ReviewInput,
): Promise<ServiceResult<Review>> {
  if (!getProductById(productId)) return { ok: false, error: 'Product not found' };

  const fieldErrors = validateReviewInput(input);
  if (hasErrors(fieldErrors)) return { ok: false, error: 'Please fix the highlighted fields', fieldErrors };

  const all = getAllUserReviews();
  if (all.some((r) => r.productId === productId && r.userId === user.id)) {
    return { ok: false, error: 'You have already reviewed this product' };
  }

  const review: Review = {
    id: randomId('rev'),
    productId,
    userId: user.id,
    authorName: formatAuthorName(user.name),
    rating: input.rating,
    title: input.title.trim(),
    body: input.body.trim(),
    createdAt: new Date().toISOString(),
    isSeeded: false,
    verifiedPurchase: hasPurchasedProduct(user.id, productId),
    status: 'published',
  };
  reviewsStore().set([review, ...all]);
  return { ok: true, data: review };
}

export async function deleteReview(userId: string, reviewId: string): Promise<ServiceResult> {
  const all = getAllUserReviews();
  const review = all.find((r) => r.id === reviewId);
  if (!review) return { ok: false, error: 'Review not found' };
  if (review.userId !== userId) return { ok: false, error: 'You can only delete your own reviews' };
  reviewsStore().set(all.filter((r) => r.id !== reviewId));
  return { ok: true, data: undefined };
}

export interface ListAllReviewsOptions {
  /** Include the generated demo reviews of every product (default true). */
  includeSeeded?: boolean;
}

/**
 * Admin moderation list: user reviews + seeded demo reviews (deleted seeded reviews are omitted),
 * newest first, each with its product name/slug. Not referentially stable: wrap in useMemo
 * (see hooks/useAllReviews).
 */
export function listAllReviews(options: ListAllReviewsOptions = {}): AdminReview[] {
  const moderation = reviewModerationStore().get();
  const describe = (review: Review): AdminReview => {
    const product = getAnyProductById(review.productId) ?? getBaseProductById(review.productId);
    return { ...review, productName: product?.name ?? 'Deleted product', productSlug: product?.slug ?? null };
  };
  const all: AdminReview[] = getAllUserReviews().map(describe);
  if (options.includeSeeded !== false) {
    getCatalog().products.forEach((product) => {
      getSeededReviews(product.id, product.avgRating, product.reviewCount).forEach((review) => {
        const state = moderation[review.id];
        if (state === 'deleted') return;
        all.push(describe(state === 'hidden' ? { ...review, status: 'hidden' } : review));
      });
    });
  }
  return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

const isSeededId = (reviewId: string) => reviewId.startsWith('seed-');

export function setReviewStatus(reviewId: string, status: ReviewStatus): ServiceResult {
  if (status !== 'published' && status !== 'hidden') return { ok: false, error: 'Select a status' };
  if (isSeededId(reviewId)) {
    const moderation = reviewModerationStore().get();
    if (moderation[reviewId] === 'deleted') return { ok: false, error: 'Review not found' };
    const next = { ...moderation };
    if (status === 'hidden') next[reviewId] = 'hidden';
    else delete next[reviewId];
    reviewModerationStore().set(next);
    return { ok: true, data: undefined };
  }
  const all = getAllUserReviews();
  if (!all.some((r) => r.id === reviewId)) return { ok: false, error: 'Review not found' };
  reviewsStore().set(all.map((r) => (r.id === reviewId ? { ...r, status } : r)));
  return { ok: true, data: undefined };
}

export function deleteReviewAsAdmin(reviewId: string): ServiceResult {
  if (isSeededId(reviewId)) {
    reviewModerationStore().set({ ...reviewModerationStore().get(), [reviewId]: 'deleted' });
    return { ok: true, data: undefined };
  }
  const all = getAllUserReviews();
  if (!all.some((r) => r.id === reviewId)) return { ok: false, error: 'Review not found' };
  reviewsStore().set(all.filter((r) => r.id !== reviewId));
  return { ok: true, data: undefined };
}
