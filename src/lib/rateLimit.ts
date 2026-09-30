// Best-effort API rate limiting: an in-memory sliding window keyed by client IP.
//
// Scope and limits — read before relying on this in production:
// - State lives in the memory of ONE server process. On Vercel / any multi-instance
//   deployment every instance (and every cold start) has its own counter, so the
//   effective limit is "60/min per IP per instance", not a global guarantee.
// - It is meant to blunt accidental hammering and cheap scripted abuse, not to
//   replace a CDN/WAF rule or a shared store (Upstash/Redis) when real traffic arrives.
// - The client IP is taken from `x-forwarded-for` (first hop), which is only trustworthy
//   behind a proxy that overwrites the header (Vercel, Cloudflare, nginx with
//   `proxy_set_header`). Direct exposure lets a client spoof it.

import { NextResponse } from 'next/server';

export interface RateLimitOptions {
  /** Requests allowed per window. Default 60. */
  limit?: number;
  /** Window length in milliseconds. Default 60 000 (one minute). */
  windowMs?: number;
  /** Bucket namespace so different route groups can have independent budgets. */
  scope?: string;
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the oldest request in the window expires (>= 1 when blocked). */
  retryAfterSec: number;
  /** Standard RateLimit-* headers to attach to the response. */
  headers: Record<string, string>;
}

const DEFAULT_LIMIT = 60;
const DEFAULT_WINDOW_MS = 60_000;
/** Sweep idle buckets once the map grows past this many keys. */
const SWEEP_THRESHOLD = 5_000;

type Bucket = number[]; // sorted request timestamps (ms) inside the current window

// Keep the map on globalThis so dev-server HMR reloads of this module don't reset it.
const GLOBAL_KEY = '__coutureRateLimitBuckets__';
type GlobalWithBuckets = typeof globalThis & { [GLOBAL_KEY]?: Map<string, Bucket> };
const buckets: Map<string, Bucket> =
  (globalThis as GlobalWithBuckets)[GLOBAL_KEY] ?? ((globalThis as GlobalWithBuckets)[GLOBAL_KEY] = new Map());

/** First hop of x-forwarded-for, else x-real-ip, else a shared "unknown" bucket. */
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim().slice(0, 64);
  return 'unknown';
}

function sweep(now: number, windowMs: number) {
  for (const [key, bucket] of buckets) {
    const last = bucket[bucket.length - 1];
    if (last === undefined || now - last >= windowMs) buckets.delete(key);
  }
}

/** Record a hit for `key` and report whether it is within the sliding window budget. */
export function checkRateLimit(key: string, options: RateLimitOptions = {}): RateLimitResult {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const bucketKey = `${options.scope ?? 'api'}:${key}`;
  const now = Date.now();

  if (buckets.size > SWEEP_THRESHOLD) sweep(now, windowMs);

  const bucket = buckets.get(bucketKey) ?? [];
  // Drop timestamps that have left the window.
  let start = 0;
  while (start < bucket.length && now - bucket[start] >= windowMs) start += 1;
  const live = start > 0 ? bucket.slice(start) : bucket;

  const ok = live.length < limit;
  if (ok) live.push(now);
  buckets.set(bucketKey, live);

  const oldest = live[0];
  const resetMs = oldest === undefined ? windowMs : Math.max(windowMs - (now - oldest), 0);
  const retryAfterSec = Math.max(1, Math.ceil(resetMs / 1000));
  const remaining = Math.max(limit - live.length, 0);

  return {
    ok,
    limit,
    remaining,
    retryAfterSec,
    headers: {
      'RateLimit-Limit': String(limit),
      'RateLimit-Remaining': String(remaining),
      'RateLimit-Reset': String(retryAfterSec),
    },
  };
}

/**
 * Route-handler helper: returns a ready 429 JSON response when the caller is over
 * budget, or `null` (plus the headers to copy onto the real response) when allowed.
 */
export function rateLimitRequest(
  request: Request,
  options?: RateLimitOptions,
): { blocked: NextResponse | null; headers: Record<string, string> } {
  const result = checkRateLimit(getClientIp(request), options);
  if (result.ok) return { blocked: null, headers: result.headers };
  const blocked = NextResponse.json(
    { success: false, error: 'Too many requests. Please slow down and try again shortly.' },
    {
      status: 429,
      headers: {
        ...result.headers,
        'Retry-After': String(result.retryAfterSec),
        'Cache-Control': 'no-store',
      },
    },
  );
  return { blocked, headers: result.headers };
}

/** Test/ops hook: forget every bucket (used by docs' verification steps and unit tests). */
export function resetRateLimits(): void {
  buckets.clear();
}

// ---------------------------------------------------------------------------
// Shared route-handler helpers (kept here so every /api route imports one module)
// ---------------------------------------------------------------------------

/** Public GET responses are CDN-cacheable for a minute and served stale for five while revalidating. */
export const PUBLIC_GET_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';

/** Reject query strings that are absurdly long before any parsing happens. */
export const MAX_QUERY_STRING_LENGTH = 2048;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 120;

/** Catalog slugs are lowercase kebab-case; anything else is treated as "not found" without touching data. */
export function isValidSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(value);
}

/** JSON success response with cache + rate-limit headers applied. */
export function jsonOk(body: unknown, extraHeaders: Record<string, string> = {}): NextResponse {
  return NextResponse.json(body, {
    headers: { 'Cache-Control': PUBLIC_GET_CACHE_CONTROL, ...extraHeaders },
  });
}

/** JSON error response; never cached. */
export function jsonError(error: string, status: number, extraHeaders: Record<string, string> = {}): NextResponse {
  return NextResponse.json({ success: false, error }, { status, headers: { 'Cache-Control': 'no-store', ...extraHeaders } });
}
