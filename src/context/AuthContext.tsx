'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useHydrated } from '@/hooks/useHydrated';
import {
  changePassword as changePasswordService,
  clearExpiredSession,
  createAccount,
  endSession,
  ensureAdminSeeded,
  getAuthSnapshot,
  getServerAuthSnapshot,
  requestPasswordReset as requestPasswordResetService,
  resetPassword as resetPasswordService,
  startSession,
  subscribeAuth,
  updateProfile as updateProfileService,
  verifyAdminCredentials,
  verifyCredentials,
} from '@/lib/services/auth';
import { mergeGuestCartInto } from '@/lib/services/cart';
import type { ForgotPasswordResult, ServiceResult, Session, User } from '@/lib/services/types';
import { mergeGuestWishlistInto } from '@/lib/services/wishlist';
import { GUEST_OWNER } from '@/lib/storage';
import type {
  ChangePasswordInput,
  LoginInput,
  ProfileInput,
  RegisterInput,
  ResetPasswordInput,
} from '@/lib/validation';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

export interface LogoutOptions {
  /** Navigate here (router.replace) as part of logging out, e.g. "/" from a protected page. */
  redirectTo?: string;
}

export interface AuthContextValue {
  user: User | null;
  /** 'loading' until hydrated; never trust user === null before then. */
  status: AuthStatus;
  isAuthenticated: boolean;
  /** true when the signed-in user has role 'admin' (always false while loading). */
  isAdmin: boolean;
  isHydrated: boolean;
  /** Storage owner for cart/wishlist/coupon: the user id, or "guest". */
  ownerId: string;
  session: Session | null;
  login(input: LoginInput): Promise<ServiceResult<User>>;
  /** Admin sign in: rejects non-admin accounts without starting a session (guest bag/wishlist are NOT merged). */
  loginAdmin(input: LoginInput): Promise<ServiceResult<User>>;
  register(input: RegisterInput): Promise<ServiceResult<User>>;
  logout(options?: LogoutOptions): void;
  requestPasswordReset(email: string): Promise<ServiceResult<ForgotPasswordResult>>;
  resetPassword(input: ResetPasswordInput & { token: string }): Promise<ServiceResult>;
  updateProfile(input: ProfileInput): Promise<ServiceResult<User>>;
  changePassword(input: ChangePasswordInput): Promise<ServiceResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SIGNED_OUT_RESULT = { ok: false as const, error: 'Please sign in to continue' };

const logoutNavigation: { from: string | null } = { from: null };

function markLogoutNavigation(pathname: string) {
  logoutNavigation.from = pathname;
}

function clearLogoutNavigationIfLeft(pathname: string) {
  if (logoutNavigation.from !== null && logoutNavigation.from !== pathname) logoutNavigation.from = null;
}

/** true while a logout({ redirectTo }) navigation away from `pathname` is in flight (RequireAuth skips its login redirect). */
export function isLogoutNavigationPending(pathname: string): boolean {
  return logoutNavigation.from === pathname;
}

function adoptGuestData(userId: string) {
  mergeGuestCartInto(userId);
  mergeGuestWishlistInto(userId);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const { user, session } = snapshot;

  useEffect(() => {
    pathnameRef.current = pathname;
    clearLogoutNavigationIfLeft(pathname);
  }, [pathname]);

  useEffect(() => {
    clearExpiredSession();
    ensureAdminSeeded();
  }, []);

  useEffect(() => {
    if (!session) return;
    const remaining = new Date(session.expiresAt).getTime() - Date.now();
    const timer = setTimeout(clearExpiredSession, Math.min(Math.max(remaining, 0) + 250, 2_147_483_647));
    return () => clearTimeout(timer);
  }, [session]);

  const value = useMemo<AuthContextValue>(() => {
    const status: AuthStatus = !hydrated ? 'loading' : user ? 'authenticated' : 'guest';
    const userId = user?.id ?? null;
    return {
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isAdmin: status === 'authenticated' && user?.role === 'admin',
      isHydrated: hydrated,
      ownerId: userId ?? GUEST_OWNER,
      session,
      login: async (input) => {
        const result = await verifyCredentials(input);
        if (result.ok) {
          adoptGuestData(result.data.id);
          startSession(result.data.id);
        }
        return result;
      },
      loginAdmin: async (input) => {
        const result = await verifyAdminCredentials(input);
        if (result.ok) startSession(result.data.id);
        return result;
      },
      register: async (input) => {
        const result = await createAccount(input);
        if (result.ok) {
          adoptGuestData(result.data.id);
          startSession(result.data.id);
        }
        return result;
      },
      logout: (options) => {
        if (options?.redirectTo) {
          markLogoutNavigation(pathnameRef.current);
          router.replace(options.redirectTo);
        }
        endSession();
      },
      requestPasswordReset: requestPasswordResetService,
      resetPassword: resetPasswordService,
      updateProfile: (input) =>
        userId ? updateProfileService(userId, input) : Promise.resolve(SIGNED_OUT_RESULT),
      changePassword: (input) =>
        userId ? changePasswordService(userId, input) : Promise.resolve(SIGNED_OUT_RESULT),
    };
  }, [hydrated, user, session, router]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within <AuthProvider>');
  return context;
}
