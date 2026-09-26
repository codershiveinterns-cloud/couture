export const DEFAULT_AUTH_REDIRECT = '/account';

const CONTROL_CHARS = /[\x00-\x1f\x7f]/;

export function isSafeRedirect(target: unknown): target is string {
  if (typeof target !== 'string' || target.length === 0) return false;
  if (!target.startsWith('/') || target.startsWith('//')) return false;
  if (target.includes('\\') || CONTROL_CHARS.test(target)) return false;
  try {
    const base = 'http://couture.local';
    return new URL(target, base).origin === base;
  } catch {
    return false;
  }
}

export function safeRedirect(target: unknown, fallback: string = DEFAULT_AUTH_REDIRECT): string {
  if (Array.isArray(target)) return safeRedirect(target[0], fallback);
  return isSafeRedirect(target) ? target : fallback;
}

export function buildLoginHref(next?: string | null): string {
  return next && isSafeRedirect(next) ? `/login?next=${encodeURIComponent(next)}` : '/login';
}

export function buildRegisterHref(next?: string | null): string {
  return next && isSafeRedirect(next) ? `/register?next=${encodeURIComponent(next)}` : '/register';
}

export const ADMIN_HOME = '/admin';

export function buildAdminLoginHref(next?: string | null): string {
  return next && isSafeRedirect(next) ? `/admin/login?next=${encodeURIComponent(next)}` : '/admin/login';
}
