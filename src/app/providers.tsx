'use client';

import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/Toaster';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {children}
          <Toaster />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default Providers;
