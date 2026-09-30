import { getJsonStore, isRecord, sanitizeArray, storageKeys, subscribeKeys } from '../storage';
import {
  hasErrors,
  normalizeEmail,
  validateChangePasswordInput,
  validateForgotPasswordInput,
  validateLoginInput,
  validateProfileInput,
  validateRegisterInput,
  validateResetPasswordInput,
  type ChangePasswordInput,
  type LoginInput,
  type ProfileInput,
  type RegisterInput,
  type ResetPasswordInput,
} from '../validation';
import { hashPassword, randomHex, randomId, safeEqual, sha256HexSync } from './crypto';
import { notify } from './notifications';
import type {
  ForgotPasswordResult,
  ResetTokenRecord,
  ResetTokenStatus,
  ServiceResult,
  Session,
  StoredUser,
  User,
  UserStatus,
} from './types';

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
export const GENERIC_LOGIN_ERROR = 'Invalid email or password';
export const FORM_ERROR = 'Please fix the highlighted fields';
export const EMAIL_TAKEN_ERROR = 'An account with this email already exists';
export const FORGOT_PASSWORD_MESSAGE =
  "If an account exists for that email, we've sent a link to reset your password. The link expires in 30 minutes.";
export const ACCOUNT_SUSPENDED_ERROR = 'This account has been suspended. Contact support.';
export const ADMIN_LOGIN_PATH = '/admin/login';

/** Default store admin, seeded on first use when no admin exists. Shown as a hint on the admin login page. */
export const DEMO_ADMIN_CREDENTIALS = {
  name: 'Store Admin',
  email: 'admin@couture.test',
  password: 'Admin@12345',
} as const;

export const RESET_TOKEN_ERRORS: Record<Exclude<ResetTokenStatus, 'valid'>, string> = {
  invalid: 'This password reset link is invalid.',
  expired: 'This password reset link has expired. Please request a new one.',
  used: 'This password reset link has already been used. Please request a new one.',
};

const AUTH_LATENCY_MS = 350;
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const EMPTY_USERS: StoredUser[] = [];
const EMPTY_TOKENS: ResetTokenRecord[] = [];

function isStoredUser(value: unknown): value is StoredUser {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    typeof value.salt === 'string' &&
    typeof value.passwordHash === 'string' &&
    (value.phone === null || typeof value.phone === 'string') &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isSession(value: unknown): value is Session {
  return (
    isRecord(value) &&
    typeof value.userId === 'string' &&
    typeof value.token === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.expiresAt === 'string'
  );
}

function isResetToken(value: unknown): value is ResetTokenRecord {
  return (
    isRecord(value) &&
    typeof value.token === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.expiresAt === 'string' &&
    (value.usedAt === null || typeof value.usedAt === 'string')
  );
}

/** Lazy migration: users stored before Milestone 3 have no role/status. */
function withRoleDefaults(user: StoredUser): StoredUser {
  const role = user.role === 'admin' ? 'admin' : 'customer';
  const status = user.status === 'blocked' ? 'blocked' : 'active';
  return user.role === role && user.status === status ? user : { ...user, role, status };
}

export const usersStore = () =>
  getJsonStore(storageKeys.users, EMPTY_USERS, (v) => sanitizeArray(v, isStoredUser).map(withRoleDefaults));
const sessionStore = () =>
  getJsonStore<Session | null>(storageKeys.session, null, (v) => (isSession(v) ? v : null));
const resetTokensStore = () =>
  getJsonStore(storageKeys.resetTokens, EMPTY_TOKENS, (v) => sanitizeArray(v, isResetToken));

function isExpired(iso: string, now = Date.now()): boolean {
  const time = new Date(iso).getTime();
  return !Number.isFinite(time) || time <= now;
}

export function toPublicUser(user: StoredUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function isAdminUser(user: Pick<User, 'role'> | null | undefined): boolean {
  return user?.role === 'admin';
}

/** Every stored account (admins included) without credentials. */
export function listUsers(): User[] {
  return usersStore().get().map(toPublicUser);
}

/**
 * Creates the default admin when no admin account exists. Synchronous (uses the sync SHA-256) so it
 * can run before any credential check. Safe to call repeatedly. No-op on the server.
 */
export function ensureAdminSeeded(): void {
  if (typeof window === 'undefined') return;
  const users = usersStore().get();
  if (users.some((u) => u.role === 'admin')) return;
  const email = normalizeEmail(DEMO_ADMIN_CREDENTIALS.email);
  const salt = randomHex(16);
  const passwordHash = sha256HexSync(`${salt}${DEMO_ADMIN_CREDENTIALS.password}`);
  const now = new Date().toISOString();
  const squatter = users.find((u) => u.email === email);
  if (squatter) {
    // The reserved admin address was registered as a customer before M3: promote it and reset the password.
    usersStore().set(
      users.map((u) =>
        u.id === squatter.id
          ? { ...u, name: DEMO_ADMIN_CREDENTIALS.name, role: 'admin', status: 'active', salt, passwordHash, updatedAt: now }
          : u,
      ),
    );
    return;
  }
  const admin: StoredUser = {
    id: randomId('usr'),
    name: DEMO_ADMIN_CREDENTIALS.name,
    email,
    phone: null,
    role: 'admin',
    status: 'active',
    salt,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };
  usersStore().set([...users, admin]);
}

function findUserByEmail(email: string): StoredUser | undefined {
  const normalized = normalizeEmail(email);
  return usersStore()
    .get()
    .find((u) => u.email === normalized);
}

function replaceUser(updated: StoredUser) {
  usersStore().update((users) => users.map((u) => (u.id === updated.id ? updated : u)));
}

export function getUserById(userId: string): User | null {
  const user = usersStore()
    .get()
    .find((u) => u.id === userId);
  return user ? toPublicUser(user) : null;
}

export interface AuthSnapshot {
  user: User | null;
  session: Session | null;
}

const LOGGED_OUT: AuthSnapshot = { user: null, session: null };
let authCache: { users: StoredUser[]; session: Session | null; expired: boolean; snapshot: AuthSnapshot } | null =
  null;

function sameUser(a: User | null, b: User | null): boolean {
  if (!a || !b) return a === b;
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.email === b.email &&
    a.phone === b.phone &&
    a.role === b.role &&
    a.status === b.status &&
    a.createdAt === b.createdAt &&
    a.updatedAt === b.updatedAt
  );
}

/** useSyncExternalStore snapshot: stable until users/session storage changes or the session expires. */
export function getAuthSnapshot(): AuthSnapshot {
  const users = usersStore().get();
  const session = sessionStore().get();
  const expired = session ? isExpired(session.expiresAt) : false;
  if (authCache && authCache.users === users && authCache.session === session && authCache.expired === expired) {
    return authCache.snapshot;
  }
  // Blocked accounts are treated as signed out even while their session is still stored.
  const stored =
    session && !expired ? users.find((u) => u.id === session.userId && u.status !== 'blocked') : undefined;
  let snapshot: AuthSnapshot = LOGGED_OUT;
  if (stored && session) {
    const user = toPublicUser(stored);
    const previous = authCache?.snapshot;
    snapshot =
      previous && previous.session === session && sameUser(previous.user, user)
        ? previous
        : { user, session };
  }
  authCache = { users, session, expired, snapshot };
  return snapshot;
}

export function getServerAuthSnapshot(): AuthSnapshot {
  return LOGGED_OUT;
}

export function subscribeAuth(callback: () => void): () => void {
  return subscribeKeys([storageKeys.users, storageKeys.session], callback);
}

export function getCurrentUser(): User | null {
  return getAuthSnapshot().user;
}

export function startSession(userId: string): Session {
  const now = Date.now();
  const session: Session = {
    userId,
    token: randomHex(32),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  };
  sessionStore().set(session);
  return session;
}

export function endSession(): void {
  sessionStore().clear();
}

/** Removes a stored session that has expired; returns true when one was removed. */
export function clearExpiredSession(): boolean {
  const session = sessionStore().get();
  if (!session || !isExpired(session.expiresAt)) return false;
  sessionStore().clear();
  return true;
}

/** Creates the account without starting a session. */
export async function createAccount(input: RegisterInput): Promise<ServiceResult<User>> {
  const fieldErrors = validateRegisterInput(input);
  if (hasErrors(fieldErrors)) return { ok: false, error: FORM_ERROR, fieldErrors };

  await delay(AUTH_LATENCY_MS);
  ensureAdminSeeded();
  const email = normalizeEmail(input.email);
  if (findUserByEmail(email)) {
    return { ok: false, error: EMAIL_TAKEN_ERROR, fieldErrors: { email: EMAIL_TAKEN_ERROR } };
  }

  const salt = randomHex(16);
  const passwordHash = await hashPassword(salt, input.password);
  const now = new Date().toISOString();
  const user: StoredUser = {
    id: randomId('usr'),
    name: input.name.trim(),
    email,
    phone: null,
    role: 'customer',
    status: 'active',
    salt,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  if (findUserByEmail(email)) {
    return { ok: false, error: EMAIL_TAKEN_ERROR, fieldErrors: { email: EMAIL_TAKEN_ERROR } };
  }
  usersStore().update((users) => [...users, user]);
  notify({ type: 'REGISTRATION', user: { id: user.id, name: user.name, email: user.email } });
  return { ok: true, data: toPublicUser(user) };
}

/** Checks credentials without starting a session. Errors are always generic. */
export async function verifyCredentials(input: LoginInput): Promise<ServiceResult<User>> {
  const fieldErrors = validateLoginInput(input);
  if (hasErrors(fieldErrors)) return { ok: false, error: FORM_ERROR, fieldErrors };

  await delay(AUTH_LATENCY_MS);
  ensureAdminSeeded();
  const user = findUserByEmail(input.email);
  const hash = await hashPassword(user?.salt ?? 'no-such-user', input.password);
  if (!user || !safeEqual(hash, user.passwordHash)) {
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }
  // Only revealed after the password matched, so it cannot be used to probe for accounts.
  if (user.status === 'blocked') return { ok: false, error: ACCOUNT_SUSPENDED_ERROR };
  return { ok: true, data: toPublicUser(user) };
}

export async function registerUser(input: RegisterInput): Promise<ServiceResult<User>> {
  const result = await createAccount(input);
  if (result.ok) startSession(result.data.id);
  return result;
}

export async function loginUser(input: LoginInput): Promise<ServiceResult<User>> {
  const result = await verifyCredentials(input);
  if (result.ok) startSession(result.data.id);
  return result;
}

/**
 * Admin-only sign in: same credential check, but non-admin accounts are rejected with the generic
 * error and no session is started.
 */
export async function verifyAdminCredentials(input: LoginInput): Promise<ServiceResult<User>> {
  const result = await verifyCredentials(input);
  if (result.ok && result.data.role !== 'admin') {
    return { ok: false, error: 'This account does not have admin access' };
  }
  return result;
}

/** Sets active/blocked. Blocking also ends that user's session when it is the stored one. */
export function setUserStatus(userId: string, status: UserStatus): ServiceResult<User> {
  const user = usersStore()
    .get()
    .find((u) => u.id === userId);
  if (!user) return { ok: false, error: 'Customer not found' };
  if (user.role === 'admin') return { ok: false, error: 'Admin accounts cannot be suspended' };
  if (status !== 'active' && status !== 'blocked') return { ok: false, error: 'Select a status' };
  const updated: StoredUser = { ...user, status, updatedAt: new Date().toISOString() };
  replaceUser(updated);
  if (status === 'blocked' && sessionStore().get()?.userId === userId) sessionStore().clear();
  return { ok: true, data: toPublicUser(updated) };
}

/** Inserts pre-built accounts (demo seeding). Existing emails are skipped; returns the stored users for the given emails. */
export function importUsers(users: readonly StoredUser[]): User[] {
  const existing = usersStore().get();
  const emails = new Set(existing.map((u) => u.email));
  const fresh = users.filter((u) => !emails.has(u.email));
  if (fresh.length > 0) usersStore().set([...existing, ...fresh]);
  const wanted = new Set(users.map((u) => u.email));
  return usersStore()
    .get()
    .filter((u) => wanted.has(u.email))
    .map(toPublicUser);
}

export function logoutUser(): void {
  endSession();
}

export async function requestPasswordReset(email: string): Promise<ServiceResult<ForgotPasswordResult>> {
  const fieldErrors = validateForgotPasswordInput({ email });
  if (hasErrors(fieldErrors)) return { ok: false, error: FORM_ERROR, fieldErrors };

  await delay(AUTH_LATENCY_MS);
  const user = findUserByEmail(email);
  if (!user) return { ok: true, data: { message: FORGOT_PASSWORD_MESSAGE, demoResetPath: null } };

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const record: ResetTokenRecord = {
    token: randomHex(32),
    userId: user.id,
    createdAt: nowIso,
    expiresAt: new Date(now + RESET_TOKEN_TTL_MS).toISOString(),
    usedAt: null,
  };
  resetTokensStore().update((tokens) => [
    ...tokens
      .filter((t) => !t.usedAt && !isExpired(t.expiresAt, now))
      .map((t) => (t.userId === user.id ? { ...t, usedAt: nowIso } : t)),
    record,
  ]);

  return {
    ok: true,
    data: {
      message: FORGOT_PASSWORD_MESSAGE,
      demoResetPath: `/reset-password?token=${encodeURIComponent(record.token)}`,
    },
  };
}

export function getResetTokenStatus(token: string | null | undefined): ResetTokenStatus {
  if (!token) return 'invalid';
  const record = resetTokensStore()
    .get()
    .find((t) => t.token === token);
  if (!record) return 'invalid';
  if (record.usedAt) return 'used';
  if (isExpired(record.expiresAt)) return 'expired';
  return getUserById(record.userId) ? 'valid' : 'invalid';
}

export function subscribeResetTokens(callback: () => void): () => void {
  return subscribeKeys([storageKeys.resetTokens, storageKeys.users], callback);
}

export async function resetPassword(input: ResetPasswordInput & { token: string }): Promise<ServiceResult> {
  const status = getResetTokenStatus(input.token);
  if (status !== 'valid') return { ok: false, error: RESET_TOKEN_ERRORS[status] };

  const fieldErrors = validateResetPasswordInput(input);
  if (hasErrors(fieldErrors)) return { ok: false, error: FORM_ERROR, fieldErrors };

  await delay(AUTH_LATENCY_MS);
  const recheck = getResetTokenStatus(input.token);
  if (recheck !== 'valid') return { ok: false, error: RESET_TOKEN_ERRORS[recheck] };

  const record = resetTokensStore()
    .get()
    .find((t) => t.token === input.token);
  const user = record && usersStore().get().find((u) => u.id === record.userId);
  if (!record || !user) return { ok: false, error: RESET_TOKEN_ERRORS.invalid };

  const salt = randomHex(16);
  const passwordHash = await hashPassword(salt, input.password);
  const nowIso = new Date().toISOString();
  replaceUser({ ...user, salt, passwordHash, updatedAt: nowIso });
  resetTokensStore().update((tokens) =>
    tokens.map((t) => (t.userId === user.id && !t.usedAt ? { ...t, usedAt: nowIso } : t)),
  );
  return { ok: true, data: undefined };
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<ServiceResult<User>> {
  const fieldErrors = validateProfileInput(input);
  if (hasErrors(fieldErrors)) return { ok: false, error: FORM_ERROR, fieldErrors };

  await delay(AUTH_LATENCY_MS);
  const user = usersStore()
    .get()
    .find((u) => u.id === userId);
  if (!user) return { ok: false, error: 'Your session has ended. Please sign in again.' };

  const email = normalizeEmail(input.email);
  const owner = findUserByEmail(email);
  if (owner && owner.id !== userId) {
    return { ok: false, error: EMAIL_TAKEN_ERROR, fieldErrors: { email: EMAIL_TAKEN_ERROR } };
  }

  const updated: StoredUser = {
    ...user,
    name: input.name.trim(),
    email,
    phone: input.phone.trim() || null,
    updatedAt: new Date().toISOString(),
  };
  replaceUser(updated);
  return { ok: true, data: toPublicUser(updated) };
}

export async function changePassword(userId: string, input: ChangePasswordInput): Promise<ServiceResult> {
  const fieldErrors = validateChangePasswordInput(input);
  if (hasErrors(fieldErrors)) return { ok: false, error: FORM_ERROR, fieldErrors };

  await delay(AUTH_LATENCY_MS);
  const user = usersStore()
    .get()
    .find((u) => u.id === userId);
  if (!user) return { ok: false, error: 'Your session has ended. Please sign in again.' };

  const currentHash = await hashPassword(user.salt, input.currentPassword);
  if (!safeEqual(currentHash, user.passwordHash)) {
    const error = 'Current password is incorrect';
    return { ok: false, error, fieldErrors: { currentPassword: error } };
  }

  const salt = randomHex(16);
  const passwordHash = await hashPassword(salt, input.newPassword);
  const latest = usersStore()
    .get()
    .find((u) => u.id === userId);
  if (!latest) return { ok: false, error: 'Your session has ended. Please sign in again.' };
  replaceUser({ ...latest, salt, passwordHash, updatedAt: new Date().toISOString() });
  return { ok: true, data: undefined };
}
